#!/usr/bin/env node
const { pool } = require('../src/config/db');

(async () => {
  try {
    const [rows] = await pool.query("SHOW TABLES");
    console.log('Tables in database:');
    console.table(rows);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to list tables:', err.message || err);
    process.exit(1);
  }
})();
