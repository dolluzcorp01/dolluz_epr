// ─────────────────────────────────────────────────────────────────────────────
//  config/db.js
//  MySQL2 promise-based connection pool.
//  Usage anywhere: const db = require('../config/db');
//                  const [rows] = await db.execute('SELECT 1');
// ─────────────────────────────────────────────────────────────────────────────

const mysql  = require("mysql2/promise");
const logger = require("../utils/logger");

const pool = mysql.createPool({
  host               : process.env.DB_HOST     || "localhost",
  port               : parseInt(process.env.DB_PORT) || 3306,
  user               : process.env.DB_USER     || "dolluz_user",
  password           : process.env.DB_PASSWORD || "",
  database           : process.env.DB_NAME     || "dolluz_epr",
  waitForConnections : true,
  connectionLimit    : 20,
  queueLimit         : 0,
  timezone           : "+00:00",         // Store all datetimes in UTC
  charset            : "utf8mb4",
  connectTimeout     : 10_000,
});

// Verify connectivity on startup
pool.getConnection()
  .then(conn => {
    logger.info("MySQL pool connected successfully");
    conn.release();
  })
  .catch(err => {
    logger.error(`MySQL connection failed: ${err.message}`);
    process.exit(1);
  });

module.exports = pool;
