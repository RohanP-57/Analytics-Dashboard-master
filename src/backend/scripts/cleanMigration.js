const database = require('../utils/databaseHybrid');

/**
 * Clean migration script to remove old atr_documents table and create new structure:
 * 1. Drop existing atr_documents table (if exists)
 * 2. Create new inferred_reports table with proper structure
 * 3. Create new uploaded_atr table with proper structure
 */

async function cleanMigration() {
  console.log('🔄 Starting clean migration...');
  
  try {
    // Check if we're using PostgreSQL
    if (!database.usePostgres) {
      console.log('⚠️ PostgreSQL not available, creating tables in SQLite...');
      await cleanSQLiteTables();
    } else {
      console.log('✅ PostgreSQL available, creating tables in PostgreSQL...');
      await cleanPostgresTables();
    }
    
    console.log('🎉 Clean migration completed successfully!');
  } catch (error) {
    console.error('❌ Clean migration failed:', error);
    throw error;
  }
}

async function cleanPostgresTables() {
  console.log('🔄 Clean migration for PostgreSQL...');
  
  try {
    // Drop existing tables if they exist
    console.log('🗑️ Dropping existing tables...');
    
    try {
      await database.run('DROP TABLE IF EXISTS atr_documents CASCADE');
      console.log('✅ Dropped atr_documents table');
    } catch (error) {
      console.log('⚠️ atr_documents table did not exist or could not be dropped');
    }
    
    try {
      await database.run('DROP TABLE IF EXISTS inferred_reports CASCADE');
      console.log('✅ Dropped inferred_reports table');
    } catch (error) {
      console.log('⚠️ inferred_reports table did not exist or could not be dropped');
    }
    
    try {
      await database.run('DROP TABLE IF EXISTS uploaded_atr CASCADE');
      console.log('✅ Dropped uploaded_atr table');
    } catch (error) {
      console.log('⚠️ uploaded_atr table did not exist or could not be dropped');
    }
    
    // Create new inferred_reports table
    console.log('🔄 Creating new inferred_reports table...');
    await database.run(`
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
      )
    `);
    console.log('✅ inferred_reports table created');
    
    // Create new uploaded_atr table
    console.log('🔄 Creating new uploaded_atr table...');
    await database.run(`
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
      )
    `);
    console.log('✅ uploaded_atr table created');

    // Create indexes for better performance
    console.log('🔄 Creating indexes...');
    await database.run(`CREATE INDEX IF NOT EXISTS idx_inferred_reports_department ON inferred_reports(department)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_inferred_reports_site ON inferred_reports(site_name)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_inferred_reports_uploaded_by ON inferred_reports(uploaded_by)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_uploaded_atr_site_name ON uploaded_atr(site_name)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_uploaded_atr_date_time ON uploaded_atr(date_time)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_uploaded_atr_uploaded_by ON uploaded_atr(uploaded_by)`);
    console.log('✅ Indexes created');

    // Insert sample data
    console.log('🔄 Inserting sample data...');
    await insertSampleData();
    
  } catch (error) {
    console.error('❌ Error in PostgreSQL clean migration:', error);
    throw error;
  }
}

async function cleanSQLiteTables() {
  console.log('🔄 Clean migration for SQLite...');
  
  try {
    // Drop existing tables if they exist
    console.log('🗑️ Dropping existing tables...');
    
    try {
      await database.run('DROP TABLE IF EXISTS atr_documents');
      console.log('✅ Dropped atr_documents table');
    } catch (error) {
      console.log('⚠️ atr_documents table did not exist or could not be dropped');
    }
    
    try {
      await database.run('DROP TABLE IF EXISTS inferred_reports');
      console.log('✅ Dropped inferred_reports table');
    } catch (error) {
      console.log('⚠️ inferred_reports table did not exist or could not be dropped');
    }
    
    try {
      await database.run('DROP TABLE IF EXISTS uploaded_atr');
      console.log('✅ Dropped uploaded_atr table');
    } catch (error) {
      console.log('⚠️ uploaded_atr table did not exist or could not be dropped');
    }
    
    // Create new inferred_reports table
    console.log('🔄 Creating new inferred_reports table...');
    await database.run(`
      CREATE TABLE inferred_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        site_name TEXT,
        cloudinary_url TEXT NOT NULL,
        cloudinary_public_id TEXT NOT NULL,
        department TEXT NOT NULL,
        uploaded_by INTEGER NOT NULL,
        file_size INTEGER,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        comment TEXT,
        ai_report_url TEXT,
        ai_report_public_id TEXT,
        hyperlink TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ inferred_reports table created');
    
    // Create new uploaded_atr table
    console.log('🔄 Creating new uploaded_atr table...');
    await database.run(`
      CREATE TABLE uploaded_atr (
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
    console.log('✅ uploaded_atr table created');

    // Insert sample data
    await insertSampleData();
    
  } catch (error) {
    console.error('❌ Error in SQLite clean migration:', error);
    throw error;
  }
}

async function insertSampleData() {
  try {
    console.log('🔄 Inserting sample data...');
    
    // Sample data for inferred_reports
    const inferredReportsData = [
      {
        filename: 'Inferred_Report_Site_A.pdf',
        site_name: 'Site A',
        cloudinary_url: 'https://res.cloudinary.com/sample/raw/upload/v1/sample.pdf',
        cloudinary_public_id: 'sample_inferred_1',
        department: 'Security Department',
        uploaded_by: 1,
        file_size: 2048576,
        comment: 'AI-generated security analysis report for Site A'
      },
      {
        filename: 'Inferred_Report_Bukaro.pdf',
        site_name: 'Bukaro',
        cloudinary_url: 'https://res.cloudinary.com/sample/raw/upload/v2/sample.pdf',
        cloudinary_public_id: 'sample_inferred_2',
        department: 'Operation Department',
        uploaded_by: 1,
        file_size: 3145728,
        comment: 'Operational insights report for Bukaro site'
      }
    ];
    
    for (const data of inferredReportsData) {
      await database.run(`
        INSERT INTO inferred_reports 
        (filename, site_name, cloudinary_url, cloudinary_public_id, department, uploaded_by, file_size, comment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.filename,
        data.site_name,
        data.cloudinary_url,
        data.cloudinary_public_id,
        data.department,
        data.uploaded_by,
        data.file_size,
        data.comment
      ]);
    }
    console.log('✅ Sample inferred reports data inserted');
    
    // Sample data for uploaded_atr
    const uploadedATRData = [
      {
        serial_no: 1,
        site_name: 'Site A',
        date_time: '2024-12-11 10:30:00',
        video_link: 'https://example.com/video1.mp4',
        atr_link: 'https://res.cloudinary.com/sample/raw/upload/atr1.pdf',
        file_name: 'ATR_Site_A_Report.pdf',
        department: 'Security Department',
        uploaded_by: 1,
        file_size: 2048576,
        comment: 'Initial security assessment report for Site A'
      },
      {
        serial_no: 2,
        site_name: 'Bukaro',
        date_time: '2024-12-10 14:15:00',
        video_link: 'https://example.com/video2.mp4',
        atr_link: 'https://res.cloudinary.com/sample/raw/upload/atr2.pdf',
        file_name: 'ATR_Bukaro_Analysis.pdf',
        department: 'Operation Department',
        uploaded_by: 1,
        file_size: 3145728,
        comment: 'Operational analysis and recommendations for Bukaro'
      },
      {
        serial_no: 3,
        site_name: 'BNK Mines',
        date_time: '2024-12-09 09:00:00',
        video_link: null,
        atr_link: 'https://res.cloudinary.com/sample/raw/upload/atr3.pdf',
        file_name: 'ATR_BNK_Safety_Report.pdf',
        department: 'Safety Department',
        uploaded_by: 1,
        file_size: 1572864,
        comment: 'Safety compliance report for BNK Mines'
      },
      {
        serial_no: 4,
        site_name: 'Dhori',
        date_time: '2024-12-08 16:45:00',
        video_link: 'https://example.com/video4.mp4',
        atr_link: 'https://res.cloudinary.com/sample/raw/upload/atr4.pdf',
        file_name: 'ATR_Dhori_Survey_Report.pdf',
        department: 'Survey Department',
        uploaded_by: 1,
        file_size: 4194304,
        comment: 'Survey and mapping report for Dhori site'
      },
      {
        serial_no: 5,
        site_name: 'Kathara',
        date_time: '2024-12-07 11:20:00',
        video_link: 'https://example.com/video5.mp4',
        atr_link: 'https://res.cloudinary.com/sample/raw/upload/atr5.pdf',
        file_name: 'ATR_Kathara_ET_Report.pdf',
        department: 'E&T Department',
        uploaded_by: 1,
        file_size: 2621440,
        comment: 'Electrical and technical assessment for Kathara site'
      }
    ];

    for (const data of uploadedATRData) {
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
    console.log('✅ Sample uploaded ATR data inserted');

  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    // Don't throw - sample data is not critical
  }
}

// Run migration if called directly
if (require.main === module) {
  cleanMigration()
    .then(() => {
      console.log('🎉 Clean migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Clean migration script failed:', error);
      process.exit(1);
    });
}

module.exports = cleanMigration;