#!/usr/bin/env node
const http = require('http');
const { pool } = require('../src/config/db');

function getCsrfToken() {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/csrf-token',
      method: 'GET'
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const body = JSON.parse(data);
          const setCookie = res.headers['set-cookie'];
          resolve({ token: body.csrfToken, cookie: setCookie && setCookie.join('; ') });
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function postContact(csrf, cookie) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ name: 'test user', email: 'test@example.com', subject: 'smoke', message: 'hello from test' });
    const opts = {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/contact',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-csrf-token': csrf,
        'Cookie': cookie || ''
      }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  try {
    console.log('Fetching CSRF token...');
    const { token, cookie } = await getCsrfToken();
    console.log('Token received:', !!token, 'Cookie received:', !!cookie);

    console.log('Posting contact with CSRF token...');
    const res = await postContact(token, cookie);
    console.log('POST /api/contact status:', res.status);
    // Wait a moment for DB write
    await new Promise(r => setTimeout(r, 500));

    // Verify inserted row
    const [rows] = await pool.query("SELECT * FROM contact_messages ORDER BY sent_time DESC LIMIT 5");
    console.log('Latest contact messages:');
    console.table(rows);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err.message || err);
    process.exit(1);
  }
})();
