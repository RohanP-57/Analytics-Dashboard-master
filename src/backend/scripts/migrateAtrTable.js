#!/usr/bin/env node

/**
 * Migration script to add new columns to atr_documents table
 * Run this ONCE after deploying the new code
 * 
 * Usage: node scripts/migrateAtrTable.js
 */

const { Pool } = require('pg');

async function migrateAtrTable() {
  console.log('🚀 Starting ATR table migration...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔄 Connecting to PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Add new columns if they don't exist
    const columns = [
      { name: 'comment', type: 'TEXT' },
      { name: 'ai_report_url', type: 'TEXT' },
      { name: 'ai_report_public_id', type: 'TEXT' },
      { name: 'hyperlink', type: 'TEXT' }
    ];
    
    for (const column of columns) {
      try {
        console.log(`🔄 Adding column: ${column.name}...`);
        await client.query(`
          ALTER TABLE atr_documents 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
        `);
        console.log(`✅ Column ${column.name} added`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`⚠️ Column ${column.name} already exists, skipping...`);
        } else {
          throw err;
        }
      }
    }
    
    client.release();
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

migrateAtrTable();
