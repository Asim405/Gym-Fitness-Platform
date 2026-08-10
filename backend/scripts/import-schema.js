const fs = require('fs');
const path = require('path');

// Dynamically locate config/db.js regardless of script position
let dbPath = '../config/db';
if (fs.existsSync(path.join(__dirname, 'config/db.js'))) {
  dbPath = './config/db';
} else if (fs.existsSync(path.join(__dirname, '../config/db.js'))) {
  dbPath = '../config/db';
}

const pool = require(dbPath);

async function importSchema() {
  try {
    // Dynamically locate database/schema_mysql.sql
    let schemaPath = path.join(__dirname, '../database/schema_mysql.sql');
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.join(__dirname, 'database/schema_mysql.sql');
    }
    
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Schema file not found. Checked path: ${schemaPath}`);
      process.exit(1);
    }

    console.log(`⏳ Reading schema file from: ${schemaPath}`);
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    // Split queries safely by semicolon
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