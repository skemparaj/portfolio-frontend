/* ============================================
   KEMPARAJ S — ADMIN PANEL CONTROLLER
   JWT Auth • Chart.js • Socket.io Toasts • CRUD
   ============================================ */

'use strict';

const API_BASE = 'http://localhost:5000';
function apiFetch(path, options) {
  return fetch(`${API_BASE}${path}`, options);
}

// Global Chart References (to destroy before rebuild)
let trafficChartInstance = null;
let deviceChartInstance = null;
let browserChartInstance = null;
let osChartInstance = null;

let currentTab = 'overview';
let visitorsCurrentPage = 1;
const visitorsPageLimit = 15;

// Socket connection reference
let socket = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuthentication();
  setupEventListeners();
});

// ── 1. AUTHENTICATION HANDLERS ────────────────
function checkAuthentication() {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    showLogin();
    return;
  }

  // Verify token validity with backend
  apiFetch('/api/auth/verify', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => {
    if (!res.ok) throw new Error('Token expired');
    return res.json();
  })
  .then(data => {
    showDashboard(data.admin.username);
  })
  .catch(() => {
    localStorage.removeItem('admin_token');
    showLogin();
  });
}

function showLogin() {
  document.getElementById('login-container').style.display = 'flex';
  document.getElementById('admin-container').style.display = 'none';
}

function showDashboard(username) {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('admin-container').style.display = 'flex';
  
  // Set initial status and load defaults
  initWebSocket();
  loadCurrentTab();
}

// Handle Login Form Submit
document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) throw new Error(data.error);
    localStorage.setItem('admin_token', data.token);
    usernameInput.value = '';
    passwordInput.value = '';
    showDashboard(username);
  })
  .catch(err => {
    alert(err.message || 'Authentication failed.');
  });
});

// Handle Sign Out
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  if (socket) socket.disconnect();
  showLogin();
});

// Change Password Handler
document.getElementById('change-password-form').addEventListener('submit', e => {
  e.preventDefault();
  const currentPass = document.getElementById('current-password').value;
  const newPass = document.getElementById('new-password').value;
  const confirmPass = document.getElementById('confirm-password').value;

  if (newPass !== confirmPass) {
    alert('Passwords do not match.');
    return;
  }

  apiFetch('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
    },
    body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) throw new Error(data.error);
    alert('Password updated successfully!');
    document.getElementById('change-password-form').reset();
  })
  .catch(err => alert(err.message));
});


// ── 2. WEBSOCKETS REAL-TIME HANDLERS ─────────
function initWebSocket() {
  if (typeof io === 'undefined') return;

  socket = io();

  // Send registration token so the server maps active socket session ID
  const sessionId = sessionStorage.getItem('portfolio_session_id') || 'admin_monitor';
  socket.emit('register_session', sessionId);

  // Live Visitors count updates
  socket.on('live_visitors_count', (count) => {
    const liveCounterEl = document.getElementById('live-visitors');
    if (liveCounterEl) liveCounterEl.textContent = count;
  });

  // Dynamic system-wide toasts (visits, downloads, messages)
  socket.on('notification', (notif) => {
    showToastAlert(notif.type, notif.title, notif.body, notif.time);
    
    // Auto-refresh stats if on overview tab
    if (currentTab === 'overview') {
      loadOverviewStats();
    } else if (currentTab === 'messages') {
      loadMessagesList();
    } else if (currentTab === 'visitors') {
      loadVisitorsList();
    }
  });

  // Messages count badge listeners
  socket.on('new_message_badge', () => {
    const badge = document.getElementById('messages-count-badge');
    if (badge) {
      const currentVal = parseInt(badge.textContent || '0');
      badge.textContent = currentVal + 1;
      badge.style.display = 'inline-block';
    }
  });
}

function showToastAlert(type, title, body, time) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-eye';
  if (type === 'message') icon = 'fa-envelope';
  if (type === 'download') icon = 'fa-download';

  toast.innerHTML = `
    <div class="toast-icon"><i class="fa-solid ${icon}"></i></div>
    <div class="toast-content">
      <h4>${title}</h4>
      <p>${body}</p>
    </div>
    <div class="toast-time">${time}</div>
  `;
  container.appendChild(toast);

  // Remove toast automatically after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slide-toast 0.35s ease reverse forwards';
    setTimeout(() => toast.remove(), 400);
  }, 5000);
}


// ── 3. GENERAL VIEW TAB ROUTING ────────────────
function setupEventListeners() {
  document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-menu .menu-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      currentTab = item.dataset.tab;
      
      // Update Headers
      const titles = {
        overview: ['Overview Analytics', 'Real-time visitor patterns and site usage aggregates.'],
        messages: ['Contact Messages', 'Feed of incoming project inquiries and collaboration requests.'],
        projects: ['Projects Manager', 'Manage dynamic portfolio projects listings in MySQL Database.'],
        visitors: ['Visitor Logs', 'Granular logs representing unique visitor sessions.'],
        heatmap: ['Click Heatmap Visualizer', 'Visual click coordinates overlays mapping user density hotspots.'],
        settings: ['System Security Keys', 'Manage credential tokens securing database operations.']
      };
      
      document.getElementById('tab-title').textContent = titles[currentTab][0];
      document.getElementById('tab-subtitle').textContent = titles[currentTab][1];

      loadCurrentTab();
    });
  });
}

function loadCurrentTab() {
  // Hide all views, display current
  document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
  document.getElementById(`tab-view-${currentTab}`).classList.add('active');

  if (currentTab === 'overview') {
    loadOverviewStats();
  } else if (currentTab === 'messages') {
    // Hide unread badge on opening
    const badge = document.getElementById('messages-count-badge');
    if (badge) {
      badge.textContent = '0';
      badge.style.display = 'none';
    }
    loadMessagesList();
  } else if (currentTab === 'projects') {
    loadProjectsList();
    initProjectForm();
  } else if (currentTab === 'visitors') {
    loadVisitorsList();
  } else if (currentTab === 'heatmap') {
    loadHeatmapData();
  }
}


// ── 4. TAB A: OVERVIEW STATS & CHARTS ──────────
function loadOverviewStats() {
  const token = localStorage.getItem('admin_token');
  apiFetch('/api/analytics/overview', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    // 1. Populate KPI stats cards
    document.getElementById('stat-total-visits').textContent = data.total_visits;
    document.getElementById('stat-unique-visitors').textContent = data.unique_visits;
    document.getElementById('stat-resume-downloads').textContent = data.total_downloads;
    
    const minutes = Math.floor(data.avg_duration / 60);
    const seconds = data.avg_duration % 60;
    document.getElementById('stat-avg-duration').textContent = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    // Unread count indicator badge trigger
    const badge = document.getElementById('messages-count-badge');
    if (badge && data.unread_messages > 0) {
      badge.textContent = data.unread_messages;
      badge.style.display = 'inline-block';
    }

    // 2. Render Charts
    renderTrafficChart(data.trafficStats);
    renderDeviceChart(data.deviceStats);
    renderOSChart(data.osStats);
    renderBrowserChart(data.browserStats);
    renderGeoStatsList(data.geoStats);
  })
  .catch(err => console.error('Overview stats loader error:', err));
}

// Traffic Line Chart (14 Days)
function renderTrafficChart(stats) {
  const ctx = document.getElementById('trafficChart').getContext('2d');
  if (trafficChartInstance) trafficChartInstance.destroy();

  const labels = stats.map(s => {
    const d = new Date(s.date);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });
  const visits = stats.map(s => s.visits);
  const uniques = stats.map(s => s.unique_visits);

  trafficChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Visits',
          data: visits,
          borderColor: '#00f5ff',
          backgroundColor: 'rgba(0, 245, 255, 0.05)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Unique Visitors',
          data: uniques,
          borderColor: '#7b2fff',
          backgroundColor: 'rgba(123, 47, 255, 0.05)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { family: 'Space Grotesk' } } }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b' } },
        y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b', stepSize: 1 } }
      }
    }
  });
}

// Device Doughnut Split
function renderDeviceChart(stats) {
  const ctx = document.getElementById('deviceChart').getContext('2d');
  if (deviceChartInstance) deviceChartInstance.destroy();

  const labels = stats.map(s => s.device);
  const data = stats.map(s => s.count);

  deviceChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#00f5ff', '#7b2fff', '#00ff88', '#ff2d78'],
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Space Grotesk', size: 10 } } }
      }
    }
  });
}

// OS Distribution Chart
function renderOSChart(stats) {
  const ctx = document.getElementById('osChart').getContext('2d');
  if (osChartInstance) osChartInstance.destroy();

  const labels = stats.map(s => s.os);
  const data = stats.map(s => s.count);

  osChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Sessions',
        data,
        backgroundColor: 'rgba(123, 47, 255, 0.75)',
        borderColor: '#7b2fff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b' } },
        y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b', stepSize: 1 } }
      }
    }
  });
}

// Browser Distribution Chart
function renderBrowserChart(stats) {
  const ctx = document.getElementById('browserChart').getContext('2d');
  if (browserChartInstance) browserChartInstance.destroy();

  const labels = stats.map(s => s.browser.split(' ')[0]); // Get just name, drop version
  const data = stats.map(s => s.count);

  browserChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Sessions',
        data,
        backgroundColor: 'rgba(0, 245, 255, 0.75)',
        borderColor: '#00f5ff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b' } },
        y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b', stepSize: 1 } }
      }
    }
  });
}

// Geographic Location text list representation
function renderGeoStatsList(stats) {
  const container = document.getElementById('geo-split-list');
  if (!container) return;
  container.innerHTML = '';
  
  if (stats.length === 0) {
    container.innerHTML = '<div class="geo-item"><span class="geo-item-lbl">No data logged</span></div>';
    return;
  }

  stats.forEach(s => {
    const el = document.createElement('div');
    el.className = 'geo-item';
    el.innerHTML = `
      <span class="geo-item-lbl"><i class="fa-solid fa-earth-americas" style="color:var(--neon-green)"></i> ${s.country}</span>
      <span class="geo-item-val">${s.count} visits</span>
    `;
    container.appendChild(el);
  });
}


// ── 5. TAB B: CONTACT MESSAGES ─────────────────
function loadMessagesList() {
  const token = localStorage.getItem('admin_token');
  apiFetch('/api/analytics/messages', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(messages => {
    const tableBody = document.getElementById('messages-table-body');
    const summaryText = document.getElementById('messages-summary-text');
    tableBody.innerHTML = '';
    
    summaryText.textContent = `${messages.length} message${messages.length === 1 ? '' : 's'} total`;

    if (messages.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No messages found.</td></tr>`;
      return;
    }

    messages.forEach(msg => {
      const dateStr = new Date(msg.sent_time).toLocaleString();
      const readClass = msg.is_read ? '' : 'unread';
      const readBtn = msg.is_read ? '' : `
        <button class="action-btn btn-check" title="Mark as Read" onclick="markMessageRead(${msg.id}, true)">
          <i class="fa-solid fa-check"></i>
        </button>
      `;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:var(--font-mono);font-size:0.78rem;">${dateStr}</td>
        <td style="font-weight:600;">${msg.name}</td>
        <td><a href="mailto:${msg.email}" style="color:var(--neon-cyan);">${msg.email}</a></td>
        <td><span class="msg-bubble ${readClass}">${msg.subject}</span></td>
        <td><div style="font-size:0.82rem;color:var(--text-secondary);max-width:280px;white-space:normal;word-break:break-word;">${msg.message}</div></td>
        <td>
          <div class="action-btn-group">
            ${readBtn}
            <button class="action-btn btn-delete" title="Delete Message" onclick="deleteMessage(${msg.id})">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  })
  .catch(err => console.error('Messages list loader error:', err));
}

window.markMessageRead = function(id, isRead) {
  const token = localStorage.getItem('admin_token');
  apiFetch(`/api/analytics/messages/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ is_read: isRead })
  })
  .then(res => res.json())
  .then(() => loadMessagesList())
  .catch(err => alert(err.message));
};

window.deleteMessage = function(id) {
  if (!confirm('Are you sure you want to delete this message?')) return;
  const token = localStorage.getItem('admin_token');
  apiFetch(`/api/analytics/messages/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(() => loadMessagesList())
  .catch(err => alert(err.message));
};


// ── 6. TAB C: PROJECTS MANAGER CRUD ────────────
function loadProjectsList() {
  apiFetch('/api/projects')
  .then(res => res.json())
  .then(projects => {
    const listBody = document.getElementById('projects-list-table-body');
    listBody.innerHTML = '';

    if (projects.length === 0) {
      listBody.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:2rem;">No projects logged.</div>`;
      return;
    }

    projects.forEach(proj => {
      const item = document.createElement('div');
      item.className = 'project-list-item';
      item.innerHTML = `
        <div>
          <div class="project-list-item-title">${proj.title}</div>
          <div class="project-list-item-tech">${proj.technologies}</div>
        </div>
        <div class="action-btn-group">
          <button class="action-btn" title="Edit Project" onclick='editProject(${JSON.stringify(proj)})'>
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="action-btn btn-delete" title="Delete Project" onclick="deleteProject(${proj.id})">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;
      listBody.appendChild(item);
    });
  })
  .catch(err => console.error('Projects feed error:', err));
}

function initProjectForm() {
  document.getElementById('project-crud-form').reset();
  document.getElementById('project-id').value = '';
  document.getElementById('project-form-title').textContent = 'Add New Project';
  document.getElementById('btn-save-project').textContent = 'Add Project';
  document.getElementById('btn-cancel-edit').style.display = 'none';
}

document.getElementById('btn-cancel-edit').addEventListener('click', () => {
  initProjectForm();
});

// Form submit: Create OR Edit
document.getElementById('project-crud-form').addEventListener('submit', e => {
  e.preventDefault();
  const token = localStorage.getItem('admin_token');
  
  const id = document.getElementById('project-id').value;
  const title = document.getElementById('project-title').value.trim();
  const description = document.getElementById('project-description').value.trim();
  const technologies = document.getElementById('project-technologies').value.trim();
  const github_link = document.getElementById('project-github').value.trim();
  const live_link = document.getElementById('project-live').value.trim();

  const isEdit = id.length > 0;
  const url = isEdit ? `/api/projects/${id}` : '/api/projects';
  const method = isEdit ? 'PUT' : 'POST';

  apiFetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, description, technologies, github_link, live_link })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) throw new Error(data.error);
    alert(isEdit ? 'Project updated successfully!' : 'Project created successfully!');
    initProjectForm();
    loadProjectsList();
  })
  .catch(err => alert(err.message));
});

window.editProject = function(proj) {
  document.getElementById('project-id').value = proj.id;
  document.getElementById('project-title').value = proj.title;
  document.getElementById('project-description').value = proj.description;
  document.getElementById('project-technologies').value = proj.technologies;
  document.getElementById('project-github').value = proj.github_link || '';
  document.getElementById('project-live').value = proj.live_link || '';

  document.getElementById('project-form-title').textContent = 'Edit Project';
  document.getElementById('btn-save-project').textContent = 'Save Changes';
  document.getElementById('btn-cancel-edit').style.display = 'block';
};

window.deleteProject = function(id) {
  if (!confirm('Are you sure you want to delete this project?')) return;
  const token = localStorage.getItem('admin_token');
  apiFetch(`/api/projects/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) throw new Error(data.error);
    loadProjectsList();
    initProjectForm();
  })
  .catch(err => alert(err.message));
};


// ── 7. TAB D: VISITOR LOGS & EXPORTS ───────────
function loadVisitorsList() {
  const token = localStorage.getItem('admin_token');
  apiFetch(`/api/analytics/visitors?page=${visitorsCurrentPage}&limit=${visitorsPageLimit}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    const tableBody = document.getElementById('visitors-table-body');
    tableBody.innerHTML = '';

    data.rows.forEach(row => {
      const visitTime = new Date(row.visit_time).toLocaleString();
      const minutes = Math.floor(row.time_spent / 60);
      const seconds = row.time_spent % 60;
      const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:var(--font-mono);font-size:0.78rem;">${visitTime}</td>
        <td class="td-badge">${row.ip_address}</td>
        <td>${row.city}, ${row.country}</td>
        <td>${row.device}</td>
        <td>${row.browser.split(' ')[0]}</td>
        <td>${row.operating_system}</td>
        <td style="font-family:var(--font-mono);">${durationStr}</td>
      `;
      tableBody.appendChild(tr);
    });

    // Handle Pagination bounds UI
    const totalPages = Math.ceil(data.total / visitorsPageLimit) || 1;
    document.getElementById('page-num-indicator').textContent = `Page ${visitorsCurrentPage} of ${totalPages}`;
    document.getElementById('prev-page-btn').disabled = visitorsCurrentPage <= 1;
    document.getElementById('next-page-btn').disabled = visitorsCurrentPage >= totalPages;
  })
  .catch(err => console.error('Visitor list loader error:', err));
}

document.getElementById('prev-page-btn').addEventListener('click', () => {
  if (visitorsCurrentPage > 1) {
    visitorsCurrentPage--;
    loadVisitorsList();
  }
});

document.getElementById('next-page-btn').addEventListener('click', () => {
  visitorsCurrentPage++;
  loadVisitorsList();
});

// CSV Export Handler
document.getElementById('btn-export-csv').addEventListener('click', () => {
  const token = localStorage.getItem('admin_token');
  apiFetch(`/api/analytics/visitors?page=1&limit=500`, { // grab last 500 visitors
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Visit Time,IP Address,City,Country,Device,Browser,OS,Time Spent (Seconds)\n';
    
    data.rows.forEach(r => {
      const line = `"${r.visit_time}","${r.ip_address}","${r.city}","${r.country}","${r.device}","${r.browser}","${r.operating_system}",${r.time_spent}`;
      csvContent += line + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `visitors_analytics_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  })
  .catch(err => alert('CSV Export failed: ' + err.message));
});

// PDF Print trigger
document.getElementById('btn-export-pdf').addEventListener('click', () => {
  window.print();
});


// ── 8. TAB E: HEATMAP PLOTTING ──────────────────
function loadHeatmapData() {
  const token = localStorage.getItem('admin_token');
  apiFetch('/api/analytics/overview', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    drawHeatmap(data.heatmapPoints);
  })
  .catch(err => console.error('Heatmap load failed:', err));
}

function drawHeatmap(points) {
  const canvas = document.getElementById('heatmapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Set internal resolution matching stylesheet bounds
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!points || points.length === 0) {
    ctx.font = '14px Space Grotesk';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('No click interactions tracked yet.', canvas.width / 2, canvas.height / 2);
    return;
  }

  // Draw Heatmap spots
  points.forEach(pt => {
    const x = pt.x * canvas.width;
    const y = pt.y * canvas.height;
    const radius = 25;

    // Create radial color gradient hotspot
    const gradient = ctx.createRadialGradient(x, y, 2, x, y, radius);
    gradient.addColorStop(0, 'rgba(255, 45, 120, 0.6)'); // Core red-pink
    gradient.addColorStop(0.2, 'rgba(123, 47, 255, 0.4)'); // Purple aura
    gradient.addColorStop(0.6, 'rgba(0, 245, 255, 0.15)'); // Cyan border
    gradient.addColorStop(1, 'rgba(0, 245, 255, 0)'); // Transparency

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  });
}

// Reset Heatmap Plot
document.getElementById('btn-clear-heatmap').addEventListener('click', () => {
  if (!confirm('Are you sure you want to reset click coordinates? This will clear logs.')) return;
  const canvas = document.getElementById('heatmapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '14px Space Grotesk';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText('Clicks reset. Hotspots cleared.', canvas.width / 2, canvas.height / 2);
});
