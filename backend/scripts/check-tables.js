const pool = require('../src/config/db');

async function checkTables() {
  try {
    const result = await pool.query('SHOW TABLES;');
    console.log('📊 Active Tables in Aiven MySQL Database:');
    console.table(result.rows);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fetching tables:', err);
    process.exit(1);
  }
}

checkTables();