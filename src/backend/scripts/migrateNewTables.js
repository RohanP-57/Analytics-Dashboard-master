const database = require('../utils/databaseHybrid');

/**
 * Migration script to create new tables for the restructured system:
 * 1. Rename atr_documents table to inferred_reports
 * 2. Create new uploaded_atr table for ATR management functionality
 * 3. Update all references and models
 */

async function migrateNewTables() {
  console.log('🔄 Starting migration for new table structure...');
  
  try {
    // Check if we're using PostgreSQL
    if (!database.usePostgres) {
      console.log('⚠️ PostgreSQL not available, creating tables in SQLite...');
      await createSQLiteTables();
    } else {
      console.log('✅ PostgreSQL available, creating tables in PostgreSQL...');
      await createPostgresTables();
    }
    
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function createPostgresTables() {
  console.log('🔄 Creating PostgreSQL tables for new structure...');
  
  try {
    // First, check if atr_documents table exists
    console.log('🔍 Checking existing atr_documents table...');
    const atrTableExists = await database.get(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'atr_documents'
      );
    `);
    
    // Check if inferred_reports table already exists
    const inferredTableExists = await database.get(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'inferred_reports'
      );
    `);
    
    if (atrTableExists && atrTableExists.exists && (!inferredTableExists || !inferredTableExists.exists)) {
      console.log('🔄 Renaming atr_documents table to inferred_reports...');
      
      // Rename the table
      await database.run(`ALTER TABLE atr_documents RENAME TO inferred_reports`);
      console.log('✅ Table renamed: atr_documents → inferred_reports');
      
      // Rename indexes if they exist
      try {
        await database.run(`ALTER INDEX IF EXISTS idx_atr_documents_department RENAME TO idx_inferred_reports_department`);
        await database.run(`ALTER INDEX IF EXISTS idx_atr_documents_uploaded_by RENAME TO idx_inferred_reports_uploaded_by`);
        console.log('✅ Indexes renamed');
      } catch (indexError) {
        console.log('⚠️ Index renaming failed (may not exist):', indexError.message);
      }
      
    } else if (inferredTableExists && inferredTableExists.exists) {
      console.log('✅ inferred_reports table already exists');
    } else {
      console.log('🔄 Creating new inferred_reports table...');
      await database.run(`
        CREATE TABLE IF NOT EXISTS inferred_reports (
          id SERIAL PRIMARY KEY,
          filename TEXT NOT NULL,
          cloudinary_url TEXT NOT NULL,
          cloudinary_public_id TEXT NOT NULL,
          department TEXT NOT NULL,
          uploaded_by INTEGER NOT NULL,
          file_size INTEGER,
          upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          comment TEXT,
          ai_report_url TEXT,
          ai_report_public_id TEXT,
          hyperlink TEXT
        )
      `);
      console.log('✅ inferred_reports table created');
    }
    
    // Check current columns in inferred_reports
    const columns = await database.all(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inferred_reports'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Current inferred_reports columns:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Now create the new uploaded_atr table
    console.log('🔄 Creating uploaded_atr table...');
    await database.run(`
      CREATE TABLE IF NOT EXISTS uploaded_atr (
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
      )
    `);
    console.log('✅ uploaded_atr table created');

    // Create indexes for better performance
    console.log('🔄 Creating indexes...');
    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_inferred_reports_department ON inferred_reports(department)
    `);
    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_inferred_reports_uploaded_by ON inferred_reports(uploaded_by)
    `);
    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_atr_site_name ON uploaded_atr(site_name)
    `);
    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_atr_date_time ON uploaded_atr(date_time)
    `);
    await database.run(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_atr_uploaded_by ON uploaded_atr(uploaded_by)
    `);
    console.log('✅ Indexes created');

    // Insert some sample data for testing
    console.log('🔄 Inserting sample data...');
    await insertSampleData();
    
  } catch (error) {
    console.error('❌ Error creating PostgreSQL tables:', error);
    throw error;
  }
}

async function createSQLiteTables() {
  console.log('🔄 Creating SQLite tables for new structure (fallback)...');
  
  try {
    // Rename atr_documents to inferred_reports in SQLite (if exists)
    try {
      console.log('🔄 Checking if atr_documents table exists in SQLite...');
      const tableExists = await database.get(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='atr_documents'
      `);
      
      if (tableExists) {
        console.log('🔄 Renaming atr_documents to inferred_reports in SQLite...');
        await database.run(`ALTER TABLE atr_documents RENAME TO inferred_reports`);
        console.log('✅ Table renamed in SQLite: atr_documents → inferred_reports');
      } else {
        console.log('🔄 Creating new inferred_reports table in SQLite...');
        await database.run(`
          CREATE TABLE IF NOT EXISTS inferred_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            cloudinary_url TEXT NOT NULL,
            cloudinary_public_id TEXT NOT NULL,
            department TEXT NOT NULL,
            uploaded_by INTEGER NOT NULL,
            file_size INTEGER,
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            comment TEXT,
            ai_report_url TEXT,
            ai_report_public_id TEXT,
            hyperlink TEXT
          )
        `);
        console.log('✅ inferred_reports table created in SQLite');
      }
    } catch (renameError) {
      console.log('⚠️ Table rename failed, creating new table:', renameError.message);
    }
    
    // Create uploaded_atr table in SQLite
    console.log('🔄 Creating uploaded_atr table in SQLite...');
    await database.run(`
      CREATE TABLE IF NOT EXISTS uploaded_atr (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serial_no INTEGER,
        site_name TEXT NOT NULL,
        date_time DATETIME NOT NULL,
        video_link TEXT,
        atr_link TEXT,
        file_name TEXT,
        department TEXT,
        uploaded_by INTEGER NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        file_size INTEGER,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ uploaded_atr table created in SQLite');

    // Insert sample data
    await insertSampleData();
    
  } catch (error) {
    console.error('❌ Error creating SQLite tables:', error);
    throw error;
  }
}

async function insertSampleData() {
  try {
    console.log('🔄 Checking if sample data already exists...');
    
    // Check if data already exists
    const existingData = await database.get('SELECT COUNT(*) as count FROM uploaded_atr');
    if (existingData && existingData.count > 0) {
      console.log('✅ Sample data already exists, skipping insertion');
      return;
    }

    console.log('🔄 Inserting sample ATR data...');
    
    const sampleData = [
      {
        serial_no: 1,
        site_name: 'Site A',
        date_time: '2024-12-11 10:30:00',
        video_link: 'https://example.com/video1.mp4',
        atr_link: 'https://example.com/atr1.pdf',
        file_name: 'ATR_Site_A_Report.pdf',
        department: 'Security Department',
        uploaded_by: 1, // Admin user ID
        file_size: 2048576,
        comment: 'Initial security assessment report for Site A'
      },
      {
        serial_no: 2,
        site_name: 'Site B',
        date_time: '2024-12-10 14:15:00',
        video_link: 'https://example.com/video2.mp4',
        atr_link: 'https://example.com/atr2.pdf',
        file_name: 'ATR_Site_B_Analysis.pdf',
        department: 'Operation Department',
        uploaded_by: 1,
        file_size: 3145728,
        comment: 'Operational analysis and recommendations for Site B'
      },
      {
        serial_no: 3,
        site_name: 'Bukaro',
        date_time: '2024-12-09 09:00:00',
        video_link: 'https://example.com/video3.mp4',
        atr_link: 'https://example.com/atr3.pdf',
        file_name: 'ATR_Bukaro_Safety_Report.pdf',
        department: 'Safety Department',
        uploaded_by: 1,
        file_size: 1572864,
        comment: 'Safety compliance report for Bukaro site'
      },
      {
        serial_no: 4,
        site_name: 'BNK Mines',
        date_time: '2024-12-08 16:45:00',
        video_link: null, // No video link
        atr_link: 'https://example.com/atr4.pdf',
        file_name: 'ATR_BNK_Survey_Report.pdf',
        department: 'Survey Department',
        uploaded_by: 1,
        file_size: 4194304,
        comment: 'Survey and mapping report for BNK Mines'
      },
      {
        serial_no: 5,
        site_name: 'Dhori',
        date_time: '2024-12-07 11:20:00',
        video_link: 'https://example.com/video5.mp4',
        atr_link: 'https://example.com/atr5.pdf',
        file_name: 'ATR_Dhori_ET_Report.pdf',
        department: 'E&T Department',
        uploaded_by: 1,
        file_size: 2621440,
        comment: 'Electrical and technical assessment for Dhori site'
      }
    ];

    for (const data of sampleData) {
      await database.run(`
        INSERT INTO uploaded_atr 
        (serial_no, site_name, date_time, video_link, atr_link, file_name, department, uploaded_by, file_size, comment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.serial_no,
        data.site_name,
        data.date_time,
        data.video_link,
        data.atr_link,
        data.file_name,
        data.department,
        data.uploaded_by,
        data.file_size,
        data.comment
      ]);
    }

    console.log('✅ Sample ATR data inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    // Don't throw - sample data is not critical
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateNewTables()
    .then(() => {
      console.log('🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateNewTables;