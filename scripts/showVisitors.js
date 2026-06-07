#!/usr/bin/env node
const { pool } = require('../src/config/db');

(async () => {
  try {
    const [rows] = await pool.query("SELECT * FROM visitors ORDER BY visit_time DESC LIMIT 10");
    if (!rows || rows.length === 0) {
      console.log('No rows found in visitors table.');
    } else {
      console.log('Latest visitors (up to 10):');
      console.table(rows);
    }
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to query visitors:', err.message || err);
    process.exit(1);
  }
})();
