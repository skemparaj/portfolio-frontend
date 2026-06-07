#!/usr/bin/env node
const http = require('http');
const https = require('https');

const checks = [
  { name: 'Frontend index', url: 'http://127.0.0.1:3000/index.html' },
  { name: 'Backend root', url: 'http://127.0.0.1:5000/' },
  { name: 'API projects', url: 'http://127.0.0.1:5000/api/projects' },
  { name: 'API contact (GET)', url: 'http://127.0.0.1:5000/api/contact' }
];

function checkUrl(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      resolve({ url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
    });
    req.on('error', (err) => resolve({ url, error: err.message }));
    req.setTimeout(5000, () => { req.abort(); resolve({ url, error: 'timeout' }); });
  });
}

(async () => {
  console.log('Running connectivity checks...');
  for (const c of checks) {
    const r = await checkUrl(c.url);
    if (r.error) console.log(`${c.name}: ERROR -> ${r.error}`);
    else console.log(`${c.name}: HTTP ${r.status} ${r.ok ? 'OK' : 'FAIL'}`);
  }
  process.exit(0);
})();
