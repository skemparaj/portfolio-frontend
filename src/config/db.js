const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'portfolio_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create the connection pool
const pool = mysql.createPool(poolConfig);

// Handle pool connection errors gracefully to prevent uncaught exception crashes
pool.on('error', (err) => {
  console.error('⚠ Database pool error:', err.message);
});

// Helper to check and execute schema setup on startup
async function initializeDatabase() {
  let connection;
  try {
    // Attempt connection
    connection = await pool.getConnection();
    console.log('✔ Connected to MySQL Database successfully.');

    // Check if tables exist
    const [tables] = await connection.query(`SHOW TABLES LIKE 'visitors'`);
    if (tables.length === 0) {
      console.log('⚙ Database tables not found. Executing schema.sql migration...');
      const schemaPath = path.join(__dirname, '../../schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        // Split queries by semicolon to execute them sequentially (avoiding multi-statement errors)
        const queries = schemaSql
          .replace(/--.*\n/g, '') // Remove comments
          .split(';')
          .map(q => q.trim())
          .filter(q => q.length > 0);

        for (const query of queries) {
          await connection.query(query);
        }
        console.log('✔ Database migrated and initialized successfully.');
      } else {
        console.error('⚠ schema.sql not found at ' + schemaPath + '. Database tables must be created manually.');
      }
    }
  } catch (err) {
    console.error('❌ Database connection failed. Please ensure MySQL is running and credentials in .env are correct.');
    console.error(err.message);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  pool,
  initializeDatabase
};
