const fs = require('fs');
const path = require('path');

// Require db.js from src/config/db
const pool = require('../src/config/db');

async function importSchema() {
  try {
    const schemaPath = path.join(__dirname, '../database/schema_mysql.sql');

    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Schema file not found at: ${schemaPath}`);
      process.exit(1);
    }

    console.log(`⏳ Reading schema file from: ${schemaPath}`);
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    console.log(`🚀 Executing ${queries.length} SQL statements on Aiven MySQL...`);

    for (const query of queries) {
      await pool.query(query);
    }

    console.log('✅ All tables successfully created/imported into Aiven MySQL!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing schema:', error);
    process.exit(1);
  }
}

importSchema();