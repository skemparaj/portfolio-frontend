#!/usr/bin/env node
require('dotenv').config();
const mysql = require('mysql2/promise');

async function ensureDatabaseExists() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'portfolio_db';

  let conn;
  try {
    conn = await mysql.createConnection({ host, port, user, password });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✔ Database '${dbName}' exists or was created.`);
  } catch (err) {
    console.error('❌ Could not create database:', err.message || err);
    throw err;
  } finally {
    if (conn) await conn.end();
  }
}

async function run() {
  try {
    await ensureDatabaseExists();
    // Now load app initializer which will apply schema.sql if tables missing
    const { initializeDatabase } = require('../src/config/db');
    console.log('Connecting to database and applying schema (if needed)...');
    await initializeDatabase();
    console.log('Schema application complete (or already present).');
    process.exit(0);
  } catch (err) {
    console.error('Failed to apply schema:', err.message || err);
    process.exit(1);
  }
}

run();
