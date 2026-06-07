const { pool } = require('../config/db');
const { transporter } = require('../config/mail');
const PDFDocument = require('pdfkit');
const useragent = require('useragent');
require('dotenv').config();

// Track a visitor page view
async function trackVisit(req, res) {
  const { sessionId, pageVisited, referrer } = req.body;
  if (!sessionId || !pageVisited) {
    return res.status(400).json({ error: 'Session ID and Page Visited are required.' });
  }

  // Parse User Agent details
  const agent = useragent.parse(req.headers['user-agent']);
  const browser = agent.toAgent();
  const os = agent.os.toString();
  
  // Basic device category guess
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(req.headers['user-agent']);
  const isTablet = /ipad|tablet/i.test(req.headers['user-agent']);
  const device = isTablet ? 'Tablet' : (isMobile ? 'Mobile' : 'Desktop');

  // Resolve IP Address (handles proxy headers like Cloudflare or Render)
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  // Standardize local loopback IPs
  if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  res.json({ success: true }); // Respond quickly to client

  // Process Geolocation & DB save in the background
  processGeolocateAndLogVisit(sessionId, ip, referrer, pageVisited, device, browser, os, req.io);
}

// Background IP Lookup & Database logger
async function processGeolocateAndLogVisit(sessionId, ip, referrer, pageVisited, device, browser, os, io) {
  let city = 'Localhost';
  let country = 'Localhost';

  if (ip !== '127.0.0.1' && ip !== '::1') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 sec timeout
      
      const response = await fetch(`http://ip-api.com/json/${ip}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const geo = await response.json();
        if (geo.status === 'success') {
          city = geo.city || 'Unknown';
          country = geo.country || 'Unknown';
        }
      }
    } catch (err) {
      console.warn('⚠ IP Geolocation lookup failed: ' + err.message);
      city = 'Unknown';
      country = 'Unknown';
    }
  }

  try {
    // Insert visitor record into SQL
    const [result] = await pool.query(
      `INSERT INTO visitors (session_id, ip_address, city, country, device, browser, operating_system, page_visited, referrer) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, ip, city, country, device, browser, os, pageVisited, referrer || 'Direct']
    );
    const visitorId = result.insertId;

    // Trigger Real-Time Notification on Admin Dashboard
    if (io) {
      io.emit('notification', {
        type: 'visitor',
        title: 'New Visitor Connected',
        body: `From: ${city}, ${country} (${device})`,
        time: new Date().toLocaleTimeString()
      });
      // Emit update signal to recount active visitors
      io.emit('visitor_activity');
    }
  } catch (err) {
    console.error('❌ Failed to log visitor record:', err.message);
  }
}

// Track Session Heartbeat duration
async function trackHeartbeat(req, res) {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'Session ID is required.' });

  try {
    // Increment visit time duration by 15 seconds for the latest session visitor entry
    await pool.query(
      `UPDATE visitors SET time_spent = time_spent + 15 
       WHERE session_id = ? ORDER BY visit_time DESC LIMIT 1`,
      [sessionId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Track Resume Download
async function trackDownload(req, res) {
  const { sessionId, fileName } = req.body;
  if (!fileName) {
    return res.status(400).json({ error: 'File Name is required.' });
  }

  res.json({ success: true }); // Respond quickly

  // Perform tracking actions in background
  try {
    // Find latest visitor by session ID
    const [visitors] = await pool.query(
      'SELECT id, city, country, ip_address, device FROM visitors WHERE session_id = ? ORDER BY visit_time DESC LIMIT 1',
      [sessionId || 'anonymous']
    );

    let visitorId = null;
    let locationStr = 'Unknown';
    let deviceStr = 'Unknown';
    let ipStr = 'Unknown';

    if (visitors.length > 0) {
      visitorId = visitors[0].id;
      locationStr = `${visitors[0].city}, ${visitors[0].country}`;
      deviceStr = visitors[0].device;
      ipStr = visitors[0].ip_address;
    }

    // Save download event
    await pool.query(
      'INSERT INTO resume_downloads (visitor_id, file_name) VALUES (?, ?)',
      [visitorId, fileName]
    );

    const timeStr = new Date().toLocaleString();

    // Trigger Real-time WebSocket Alert to Dashboard
    if (req.io) {
      req.io.emit('notification', {
        type: 'download',
        title: 'Resume Downloaded!',
        body: `File: ${fileName} | Loc: ${locationStr}`,
        time: timeStr
      });
      req.io.emit('new_download_badge');
    }

    // Send Admin Email Alert
    sendDownloadEmail(fileName, timeStr, ipStr, locationStr, deviceStr);
  } catch (err) {
    console.error('❌ Failed to log resume download:', err.message);
  }
}

// Nodemailer alert for Resume download
async function sendDownloadEmail(fileName, time, ip, location, device) {
  const adminEmail = process.env.ADMIN_RECEIVER_EMAIL;
  if (!process.env.EMAIL_USER || !adminEmail) return;

  const mailOptions = {
    from: `"KS Portfolio Alerts" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `📄 Resume Downloaded: ${fileName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #00f5ff; background-color: #0b0f19; color: #f8fafc; border-radius: 8px;">
        <h2 style="color: #00f5ff; border-bottom: 2px solid #7b2fff; padding-bottom: 10px; margin-top: 0;">Resume Download Activity</h2>
        
        <p style="font-size: 1rem; color: #cbd5e1; line-height: 1.6;">
          Your resume <strong style="color: #00f5ff;">"${fileName}"</strong> was downloaded from your portfolio website.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.9rem;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8; width: 120px;">Download Time:</td>
            <td style="padding: 8px 0; color: #f8fafc;">${time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">IP Address:</td>
            <td style="padding: 8px 0; color: #f8fafc;">${ip}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Location:</td>
            <td style="padding: 8px 0; color: #00ff88;">${location}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Device Type:</td>
            <td style="padding: 8px 0; color: #f8fafc;">${device}</td>
          </tr>
        </table>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉ Resume download email alert sent.`);
  } catch (err) {
    console.error('❌ Nodemailer download alert failed:', err.message);
  }
}

// Track heatmap click events
async function trackHeatmap(req, res) {
  const { sessionId, clickX, clickY, elementId } = req.body;
  if (!sessionId || clickX === undefined || clickY === undefined) {
    return res.status(400).json({ error: 'Session ID and click coordinates are required.' });
  }
  try {
    const coordsStr = `${clickX},${clickY}:${elementId || ''}`;
    // Append coordinates to the latest visitor session record
    await pool.query(
      `UPDATE visitors SET heatmap_clicks = CONCAT(COALESCE(heatmap_clicks, ''), ';', ?) 
       WHERE session_id = ? ORDER BY visit_time DESC LIMIT 1`,
      [coordsStr, sessionId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ADMIN ENDPOINT: Get dashboard analytics statistics overview
async function getOverviewStats(req, res) {
  try {
    // Total & Unique Visitors
    const [[{ total_visits }]] = await pool.query('SELECT COUNT(*) as total_visits FROM visitors');
    const [[{ unique_visits }]] = await pool.query('SELECT COUNT(DISTINCT session_id) as unique_visits FROM visitors');
    
    // Daily traffic
    const [trafficStats] = await pool.query(`
      SELECT DATE(visit_time) as date, COUNT(*) as visits, COUNT(DISTINCT session_id) as unique_visits
      FROM visitors 
      WHERE visit_time >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
      GROUP BY DATE(visit_time)
      ORDER BY date ASC
    `);

    // Device split
    const [deviceStats] = await pool.query(`
      SELECT device, COUNT(*) as count 
      FROM visitors GROUP BY device
    `);

    // Browser split
    const [browserStats] = await pool.query(`
      SELECT browser, COUNT(*) as count 
      FROM visitors GROUP BY browser ORDER BY count DESC LIMIT 5
    `);

    // OS split
    const [osStats] = await pool.query(`
      SELECT operating_system as os, COUNT(*) as count 
      FROM visitors GROUP BY operating_system ORDER BY count DESC LIMIT 5
    `);

    // Geo split (Country)
    const [geoStats] = await pool.query(`
      SELECT country, COUNT(*) as count 
      FROM visitors GROUP BY country ORDER BY count DESC LIMIT 5
    `);

    // Top Visited Pages
    const [pageStats] = await pool.query(`
      SELECT page_visited as page, COUNT(*) as count 
      FROM visitors GROUP BY page_visited ORDER BY count DESC
    `);

    // Total resume downloads
    const [[{ total_downloads }]] = await pool.query('SELECT COUNT(*) as total_downloads FROM resume_downloads');

    // Total contact messages (and unread)
    const [[{ total_messages }]] = await pool.query('SELECT COUNT(*) as total_messages FROM contact_messages');
    const [[{ unread_messages }]] = await pool.query('SELECT COUNT(*) as unread_messages FROM contact_messages WHERE is_read = FALSE');

    // Average duration spent (session time)
    const [[{ avg_duration }]] = await pool.query('SELECT ROUND(AVG(time_spent)) as avg_duration FROM visitors WHERE time_spent > 0');

    // Collect coordinates for Heatmap
    const [clicksRows] = await pool.query('SELECT heatmap_clicks FROM visitors WHERE heatmap_clicks IS NOT NULL');
    const heatmapPoints = [];
    clicksRows.forEach(row => {
      if (row.heatmap_clicks) {
        const parts = row.heatmap_clicks.split(';');
        parts.forEach(pt => {
          if (pt.includes(':')) {
            const [coords] = pt.split(':');
            const [x, y] = coords.split(',');
            if (x && y) {
              heatmapPoints.push({ x: parseFloat(x), y: parseFloat(y) });
            }
          }
        });
      }
    });

    res.json({
      total_visits,
      unique_visits,
      total_downloads,
      total_messages,
      unread_messages,
      avg_duration: avg_duration || 0,
      trafficStats,
      deviceStats,
      browserStats,
      osStats,
      geoStats,
      pageStats,
      heatmapPoints
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to aggregate analytics data: ' + err.message });
  }
}

// ADMIN ENDPOINT: Fetch visitor lists (Paginated)
async function getVisitorsList(req, res) {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '20');
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM visitors ORDER BY visit_time DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM visitors');
    res.json({ rows, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch visitor logs.' });
  }
}

// ADMIN ENDPOINT: Fetch messages list
async function getMessagesList(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM contact_messages ORDER BY sent_time DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contact messages.' });
  }
}

// ADMIN ENDPOINT: Mark message as read
async function updateMessageStatus(req, res) {
  const { id } = req.params;
  const { is_read } = req.body;
  try {
    await pool.query('UPDATE contact_messages SET is_read = ? WHERE id = ?', [is_read, id]);
    res.json({ success: true, message: 'Message status updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message.' });
  }
}

// ADMIN ENDPOINT: Delete message
async function deleteMessage(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM contact_messages WHERE id = ?', [id]);
    res.json({ success: true, message: 'Message deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message.' });
  }
}

// ADMIN ENDPOINT: Fetch downloads logs
async function getDownloadsList(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT rd.*, v.ip_address, v.city, v.country, v.device 
      FROM resume_downloads rd
      LEFT JOIN visitors v ON rd.visitor_id = v.id
      ORDER BY rd.download_time DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch download logs.' });
  }
}

// EXPORT: Visitors (CSV or PDF)
async function exportVisitors(req, res) {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const [rows] = await pool.query('SELECT * FROM visitors ORDER BY visit_time DESC');

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="visitors_${Date.now()}.pdf"`);
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      doc.pipe(res);
      doc.fontSize(18).text('Visitors Report', { align: 'center' });
      doc.moveDown(1);
      rows.forEach(r => {
        doc.fontSize(10).fillColor('#111').text(`${r.visit_time} | ${r.ip_address} | ${r.city}, ${r.country} | ${r.device} | ${r.browser} | ${r.operating_system} | ${r.time_spent}s`);
        doc.moveDown(0.2);
      });
      doc.end();
      return;
    }

    // Default CSV
    let csv = 'Visit Time,IP Address,City,Country,Device,Browser,OS,Time Spent (s)\n';
    rows.forEach(r => {
      csv += `"${r.visit_time}","${r.ip_address}","${r.city}","${r.country}","${r.device}","${r.browser}","${r.operating_system}","${r.time_spent}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="visitors_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export visitors: ' + err.message });
  }
}

// EXPORT: Messages (CSV or PDF)
async function exportMessages(req, res) {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const [rows] = await pool.query('SELECT * FROM contact_messages ORDER BY sent_time DESC');

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="messages_${Date.now()}.pdf"`);
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      doc.pipe(res);
      doc.fontSize(18).text('Messages Report', { align: 'center' });
      doc.moveDown(1);
      rows.forEach(r => {
        doc.fontSize(11).text(`${r.sent_time} | ${r.name} <${r.email}> | ${r.subject}`);
        doc.fontSize(10).fillColor('#333').text(r.message, { indent: 10 });
        doc.moveDown(0.5);
      });
      doc.end();
      return;
    }

    let csv = 'Sent Time,Name,Email,Subject,Message\n';
    rows.forEach(r => {
      csv += `"${r.sent_time}","${r.name}","${r.email}","${r.subject}","${(r.message||'').replace(/\"/g,'\"')}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="messages_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export messages: ' + err.message });
  }
}

async function getPublicStats(req, res) {
  try {
    const [[{ total_visits }]] = await pool.query('SELECT COUNT(*) as total_visits FROM visitors');
    const [[{ unique_visits }]] = await pool.query('SELECT COUNT(DISTINCT session_id) as unique_visits FROM visitors');
    const [[{ total_downloads }]] = await pool.query('SELECT COUNT(*) as total_downloads FROM resume_downloads');
    res.json({
      total_visits: total_visits || 0,
      unique_visits: unique_visits || 0,
      total_downloads: total_downloads || 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch public stats.' });
  }
}

module.exports = {
  trackVisit,
  trackHeartbeat,
  trackDownload,
  trackHeatmap,
  getOverviewStats,
  getVisitorsList,
  getMessagesList,
  updateMessageStatus,
  deleteMessage,
  getDownloadsList,
  exportVisitors,
  exportMessages,
  getPublicStats
};


