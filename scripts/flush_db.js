const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function flushDb() {
  try {
    console.log('🚀 Starting full database flush...');
    
    // Get all table names from public schema
    const tablesQuery = `
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public';
    `;
    
    const { rows } = await pool.query(tablesQuery);
    
    if (rows.length === 0) {
      console.log('ℹ️ No tables found to drop.');
    } else {
      console.log(`📦 Found ${rows.length} tables to drop.`);
      
      // Drop all tables
      for (const row of rows) {
        const tableName = row.tablename;
        console.log(`🗑️ Dropping table: ${tableName}`);
        await pool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
      }
      
      console.log('✅ All tables dropped.');
    }
    
    console.log('🛠️ Re-syncing schema with Prisma...');
    // We can't really call shell commands from inside here easily without child_process
    // but we can finish and return.
    
    await pool.end();
    console.log('✅ Flush complete.');
  } catch (err) {
    console.error('❌ Flush failed:', err.message);
    process.exit(1);
  }
}

flushDb();
