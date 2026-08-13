const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbType = process.env.DB_TYPE || 'postgres';
let pool;

if (dbType === 'mysql') {
  // Updated path to point to backend/ssl/ca.pem
  const caPath = path.join(__dirname, '../../ssl/ca.pem');

  const mysqlPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl:false,
    //  fs.existsSync(caPath)
    //   ? { ca: fs.readFileSync(caPath) }
    //   : { rejectUnauthorized: false },
  });

  const wrapQuery = async (sql, params) => {
    const formattedSql = sql.replace(/\$([0-9]+)/g, '?');
    const [rows] = await mysqlPool.query(formattedSql, params);
    if (Array.isArray(rows)) return { rows, rowCount: rows.length };
    return { rows: [], rowCount: rows.affectedRows ?? 0, insertId: rows.insertId ?? null };
  };

  pool = {
    query: wrapQuery,
    connect: async () => {
      const conn = await mysqlPool.getConnection();
      const connQuery = async (sql, params) => {
        const formattedSql = sql.replace(/\$([0-9]+)/g, '?');
        const [rows] = await conn.query(formattedSql, params);
        if (Array.isArray(rows)) return { rows, rowCount: rows.length };
        return { rows: [], rowCount: rows.affectedRows ?? 0, insertId: rows.insertId ?? null };
      };
      conn.query = connQuery;
      return conn;
    },
    end: mysqlPool.end.bind(mysqlPool),
  };
} else {
  const pgPool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      })
    : new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });

  const formatPgResult = (result) => ({
    ...result,
    insertId: result.rows?.[0]?.id ?? null,
  });

  pool = {
    query: async (sql, params) => formatPgResult(await pgPool.query(sql, params)),
    connect: async () => {
      const conn = await pgPool.connect();
      const originalQuery = conn.query.bind(conn);
      conn.query = async (sql, params) => formatPgResult(await originalQuery(sql, params));
      return conn;
    },
    end: pgPool.end.bind(pgPool),
    on: pgPool.on.bind(pgPool),
  };

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(1);
  });
}

module.exports = { ...pool, dbType };