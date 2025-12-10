#!/usr/bin/env node

/**
 * Migration script to add new columns to atr_documents table
 * Run this ONCE after deploying the new code
 * 
 * Usage: 
 * Railway: railway run node src/backend/scripts/migrateAtrTable.js
 * Local: DATABASE_URL="your_url" node src/backend/scripts/migrateAtrTable.js
 */

const { Pool } = require('pg');

async function migrateAtrTable() {
  console.log('🚀 Starting ATR table migration...');
  console.log('📍 Current directory:', process.cwd());
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    console.error('💡 Set DATABASE_URL environment variable or run via Railway CLI');
    process.exit(1);
  }
  
  console.log('🔗 DATABASE_URL found:', process.env.DATABASE_URL.substring(0, 30) + '...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    console.log('🔄 Connecting to PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'atr_documents'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️ Table atr_documents does not exist yet');
      console.log('💡 The table will be created automatically on server startup');
      client.release();
      await pool.end();
      process.exit(0);
    }
    
    console.log('✅ Table atr_documents exists');
    
    // Add new columns if they don't exist
    const columns = [
      { name: 'comment', type: 'TEXT' },
      { name: 'ai_report_url', type: 'TEXT' },
      { name: 'ai_report_public_id', type: 'TEXT' },
      { name: 'hyperlink', type: 'TEXT' }
    ];
    
    for (const column of columns) {
      try {
        console.log(`🔄 Checking column: ${column.name}...`);
        
        // Check if column exists
        const columnCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'atr_documents' 
            AND column_name = $1
          );
        `, [column.name]);
        
        if (columnCheck.rows[0].exists) {
          console.log(`✅ Column ${column.name} already exists`);
        } else {
          console.log(`🔄 Adding column: ${column.name}...`);
          await client.query(`
            ALTER TABLE atr_documents 
            ADD COLUMN ${column.name} ${column.type}
          `);
          console.log(`✅ Column ${column.name} added successfully`);
        }
      } catch (err) {
        console.error(`❌ Error with column ${column.name}:`, err.message);
        throw err;
      }
    }
    
    // Verify all columns
    console.log('\n🔍 Verifying table structure...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'atr_documents'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Current columns in atr_documents:');
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    client.release();
    console.log('\n🎉 Migration completed successfully!');
    console.log('💡 You can now use the AI Reports feature with all new columns');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('📋 Error details:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

migrateAtrTable();
