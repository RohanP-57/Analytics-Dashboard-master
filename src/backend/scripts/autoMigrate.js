/**
 * Auto-migration script that runs on server startup
 * This will automatically add new columns if they don't exist
 */

const { Pool } = require('pg');

async function autoMigrate() {
  // Only run if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ No DATABASE_URL - skipping auto-migration');
    return;
  }

  console.log('🔄 Running auto-migration for atr_documents table...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await pool.connect();
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'atr_documents'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️ Table atr_documents does not exist yet - will be created by databaseHybrid');
      client.release();
      await pool.end();
      return;
    }
    
    // Add new columns if they don't exist
    const columns = [
      { name: 'comment', type: 'TEXT' },
      { name: 'ai_report_url', type: 'TEXT' },
      { name: 'ai_report_public_id', type: 'TEXT' },
      { name: 'hyperlink', type: 'TEXT' }
    ];
    
    let addedCount = 0;
    
    for (const column of columns) {
      const columnCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'atr_documents' 
          AND column_name = $1
        );
      `, [column.name]);
      
      if (!columnCheck.rows[0].exists) {
        await client.query(`
          ALTER TABLE atr_documents 
          ADD COLUMN ${column.name} ${column.type}
        `);
        console.log(`✅ Added column: ${column.name}`);
        addedCount++;
      }
    }
    
    if (addedCount > 0) {
      console.log(`🎉 Auto-migration completed: ${addedCount} columns added`);
    } else {
      console.log('✅ All columns already exist - no migration needed');
    }
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Auto-migration error:', error.message);
    // Don't throw - let the app continue even if migration fails
  }
}

module.exports = autoMigrate;
