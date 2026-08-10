// backend/scripts/import-schema.js
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function importSchema() {
  try {
    // Apne schema.sql file ka exact path yahan dein
    const schemaPath = path.join(__dirname, '../database/schema_mysql.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Schema file not found at: ${schemaPath}`);
      process.exit(1);
    }

    console.log('⏳ Reading schema file...');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    // Individual SQL queries me split karein
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    console.log(`🚀 Executing ${queries.length} SQL queries on Aiven MySQL...`);

    for (const query of queries) {
      await pool.query(query);
    }

    console.log('✅ Schema successfully imported into Aiven MySQL!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing schema:', error);
    process.exit(1);
  }
}

importSchema();