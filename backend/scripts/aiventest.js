require('dotenv').config();
// backend/scripts/test-aiven-db.js
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false } // Aiven requires SSL
    });
    console.log("Connected to Aiven MySQL successfully!");
    const [rows] = await connection.execute("SHOW TABLES;");
    console.log("Tables in database:", rows);
    await connection.end();
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
}

testConnection();