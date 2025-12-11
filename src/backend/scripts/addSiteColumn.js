const { Pool } = require('pg');

/**
 * Migration script to add site_name column to tables in Railway PostgreSQL
 * This script should be run using: railway run node src/backend/scripts/addSiteColumn.js
 */

async function addSiteColumn() {
  console.log('🔄 Starting migration to add site_name column...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');

    try {
      await client.query('BEGIN');
      console.log('🔄 Transaction started');

      // Check if inferred_reports table exists
      const inferredTableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'inferred_reports'
        );
      `);

      if (inferredTableCheck.rows[0].exists) {
        console.log('📋 inferred_reports table exists');
        
        // Check if site_name column already exists
        const inferredColumnCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'inferred_reports' AND column_name = 'site_name'
          );
        `);

        if (!inferredColumnCheck.rows[0].exists) {
          console.log('➕ Adding site_name column to inferred_reports...');
          await client.query(`
            ALTER TABLE inferred_reports 
            ADD COLUMN site_name TEXT;
          `);
          console.log('✅ site_name column added to inferred_reports');
        } else {
          console.log('ℹ️ site_name column already exists in inferred_reports');
        }
      } else {
        console.log('⚠️ inferred_reports table does not exist, creating it...');
        await client.query(`
          CREATE TABLE inferred_reports (
            id SERIAL PRIMARY KEY,
            filename TEXT NOT NULL,
            site_name TEXT,
            cloudinary_url TEXT NOT NULL,
            cloudinary_public_id TEXT NOT NULL,
            department TEXT NOT NULL,
            uploaded_by INTEGER NOT NULL,
            file_size INTEGER,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            comment TEXT,
            ai_report_url TEXT,
            ai_report_public_id TEXT,
            hyperlink TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('✅ inferred_reports table created with site_name column');
      }

      // Check if atr_documents table exists
      const atrTableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'atr_documents'
        );
      `);

      if (atrTableCheck.rows[0].exists) {
        console.log('📋 atr_documents table exists');
        
        // Check if site_name column already exists
        const atrColumnCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'atr_documents' AND column_name = 'site_name'
          );
        `);

        if (!atrColumnCheck.rows[0].exists) {
          console.log('➕ Adding site_name column to atr_documents...');
          await client.query(`
            ALTER TABLE atr_documents 
            ADD COLUMN site_name TEXT;
          `);
          console.log('✅ site_name column added to atr_documents');
        } else {
          console.log('ℹ️ site_name column already exists in atr_documents');
        }
      } else {
        console.log('⚠️ atr_documents table does not exist, creating it...');
        await client.query(`
          CREATE TABLE atr_documents (
            id SERIAL PRIMARY KEY,
            filename TEXT NOT NULL,
            site_name TEXT,
            cloudinary_url TEXT NOT NULL,
            cloudinary_public_id TEXT NOT NULL,
            department TEXT NOT NULL,
            uploaded_by INTEGER NOT NULL,
            file_size INTEGER,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            comment TEXT,
            ai_report_url TEXT,
            ai_report_public_id TEXT,
            hyperlink TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('✅ atr_documents table created with site_name column');
      }

      // Check if uploaded_atr table exists
      const uploadedAtrTableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'uploaded_atr'
        );
      `);

      if (uploadedAtrTableCheck.rows[0].exists) {
        console.log('📋 uploaded_atr table exists');
        
        // Check if site_name column already exists
        const uploadedAtrColumnCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'uploaded_atr' AND column_name = 'site_name'
          );
        `);

        if (!uploadedAtrColumnCheck.rows[0].exists) {
          console.log('➕ Adding site_name column to uploaded_atr...');
          await client.query(`
            ALTER TABLE uploaded_atr 
            ADD COLUMN site_name TEXT;
          `);
          console.log('✅ site_name column added to uploaded_atr');
        } else {
          console.log('ℹ️ site_name column already exists in uploaded_atr');
        }
      } else {
        console.log('⚠️ uploaded_atr table does not exist, creating it...');
        await client.query(`
          CREATE TABLE uploaded_atr (
            id SERIAL PRIMARY KEY,
            serial_no INTEGER,
            site_name TEXT NOT NULL,
            date_time TIMESTAMP NOT NULL,
            video_link TEXT,
            atr_link TEXT,
            file_name TEXT,
            department TEXT,
            uploaded_by INTEGER NOT NULL,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            file_size INTEGER,
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('✅ uploaded_atr table created with site_name column');
      }

      await client.query('COMMIT');
      console.log('✅ Transaction committed');
      console.log('🎉 Migration completed successfully!');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction rolled back due to error');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Run migration if called directly
if (require.main === module) {
  addSiteColumn()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = addSiteColumn;
