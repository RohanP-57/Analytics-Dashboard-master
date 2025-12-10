const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

/**
 * Hybrid Database Manager
 * - Uses PostgreSQL for: users (admin/user tables), ATR documents
 * - Uses SQLite for: violations, reports, features, sites, video_links
 */
class HybridDatabase {
  constructor() {
    this.sqliteDb = null;
    this.pgPool = null;
    this.usePostgres = false;
    this.init();
  }

  init() {
    console.log('🔍 HYBRID DATABASE INIT');
    console.log('🔍 DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
    
    // Always initialize SQLite for violations
    this.initSQLite();

    // Initialize PostgreSQL if available (for users and ATR)
    if (process.env.DATABASE_URL) {
      console.log('🔄 Initializing PostgreSQL for users and ATR documents...');
      this.initPostgreSQL();
    } else {
      console.log('⚠️ No DATABASE_URL found - using SQLite for everything');
    }
  }

  initSQLite() {
    const dbPath = path.join(__dirname, '../data/violations.db');
    
    this.sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening SQLite database:', err.message);
      } else {
        console.log('✅ Connected to SQLite database (violations, reports, features, sites)');
        this.createSQLiteTables();
      }
    });
  }

  initPostgreSQL() {
    try {
      this.pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      this.pgPool.on('error', (err) => {
        console.error('❌ Unexpected error on idle PostgreSQL client', err);
      });

      this.usePostgres = true;
      console.log('✅ Connected to PostgreSQL database (users, ATR documents)');
      this.createPostgresTables();
    } catch (error) {
      console.error('❌ PostgreSQL initialization failed:', error);
      this.usePostgres = false;
    }
  }

  async createPostgresTables() {
    console.log('🔄 Creating PostgreSQL tables...');
    const client = await this.pgPool.connect();
    
    try {
      await client.query('BEGIN');
      console.log('✅ PostgreSQL transaction started');

      // Admin table
      console.log('🔄 Creating admin table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT,
          permissions TEXT DEFAULT 'all',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Admin table created');

      // User table
      console.log('🔄 Creating user table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "user" (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT,
          department TEXT,
          access_level TEXT DEFAULT 'basic',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ User table created');

      // ATR documents table
      console.log('🔄 Creating atr_documents table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS atr_documents (
          id SERIAL PRIMARY KEY,
          filename TEXT NOT NULL,
          cloudinary_url TEXT NOT NULL,
          cloudinary_public_id TEXT NOT NULL,
          department TEXT NOT NULL,
          uploaded_by INTEGER NOT NULL,
          file_size INTEGER,
          upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ ATR documents table created');

      await client.query('COMMIT');
      console.log('✅ PostgreSQL tables created successfully (admin, user, atr_documents)');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error creating PostgreSQL tables:', error);
      console.error('❌ Error details:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  createSQLiteTables() {
    // Reports table
    this.sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS reports (
        report_id TEXT PRIMARY KEY,
        drone_id TEXT NOT NULL,
        date TEXT NOT NULL,
        location TEXT NOT NULL,
        total_violations INTEGER,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(drone_id, date)
      )
    `, (err) => {
      if (err) console.error('Error creating reports table:', err);
      else console.log('✅ Reports table ready (SQLite)');
    });

    // Violations table
    this.sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS violations (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL,
        drone_id TEXT NOT NULL,
        date TEXT NOT NULL,
        location TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        image_url TEXT NOT NULL,
        confidence REAL,
        frame_number INTEGER,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports (report_id)
      )
    `, (err) => {
      if (err) console.error('Error creating violations table:', err);
      else console.log('✅ Violations table ready (SQLite)');
    });

    // Features table
    this.sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
      )
    `, (err) => {
      if (err) console.error('Error creating features table:', err);
      else console.log('✅ Features table ready (SQLite)');
    });

    // Sites table
    this.sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating sites table:', err);
      else {
        console.log('✅ Sites table ready (SQLite)');
        this.insertDefaultSites();
      }
    });

    // Videos links table
    this.sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS videos_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_id TEXT,
        site_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        video_url TEXT NOT NULL,
        create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        update_date DATETIME DEFAULT NULL
      )
    `, (err) => {
      if (err) console.error('Error creating videos_links table:', err);
      else console.log('✅ Videos links table ready (SQLite)');
    });
  }

  insertDefaultSites() {
    const defaultSites = ['Bukaro', 'BNK Mines', 'Dhori', 'Kathara'];
    
    defaultSites.forEach(siteName => {
      this.sqliteDb.run(
        'INSERT OR IGNORE INTO sites (name) VALUES (?)',
        [siteName],
        (err) => {
          if (err) console.error(`Error inserting site ${siteName}:`, err.message);
        }
      );
    });
  }

  // Determine which database to use based on table
  getDatabase(table) {
    const postgresTables = ['admin', 'user', 'atr_documents'];
    
    if (this.usePostgres && postgresTables.includes(table)) {
      return 'postgres';
    }
    return 'sqlite';
  }

  // Extract table name from query
  extractTableName(query) {
    const match = query.match(/(?:FROM|INTO|UPDATE|TABLE)\s+([^\s(,]+)/i);
    return match ? match[1].replace(/["`]/g, '') : null;
  }

  async run(query, params = []) {
    const tableName = this.extractTableName(query);
    const dbType = this.getDatabase(tableName);

    if (dbType === 'postgres') {
      return this.runPostgres(query, params);
    }
    return this.runSQLite(query, params);
  }

  async get(query, params = []) {
    const tableName = this.extractTableName(query);
    const dbType = this.getDatabase(tableName);

    if (dbType === 'postgres') {
      return this.getPostgres(query, params);
    }
    return this.getSQLite(query, params);
  }

  async all(query, params = []) {
    const tableName = this.extractTableName(query);
    const dbType = this.getDatabase(tableName);

    if (dbType === 'postgres') {
      return this.allPostgres(query, params);
    }
    return this.allSQLite(query, params);
  }

  // PostgreSQL methods
  async runPostgres(query, params) {
    const client = await this.pgPool.connect();
    try {
      let modifiedQuery = this.convertToPostgres(query);
      
      // Add RETURNING id for INSERT
      if (modifiedQuery.trim().toUpperCase().startsWith('INSERT') && 
          !modifiedQuery.toUpperCase().includes('RETURNING')) {
        modifiedQuery = modifiedQuery.replace(/;?\s*$/, ' RETURNING id');
      }
      
      const result = await client.query(modifiedQuery, params);
      return { 
        id: result.rows[0]?.id || result.rowCount,
        changes: result.rowCount 
      };
    } finally {
      client.release();
    }
  }

  async getPostgres(query, params) {
    const client = await this.pgPool.connect();
    try {
      const modifiedQuery = this.convertToPostgres(query);
      const result = await client.query(modifiedQuery, params);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async allPostgres(query, params) {
    const client = await this.pgPool.connect();
    try {
      const modifiedQuery = this.convertToPostgres(query);
      const result = await client.query(modifiedQuery, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  convertToPostgres(query) {
    let converted = query;
    
    // Convert ? to $1, $2, etc.
    let index = 1;
    converted = converted.replace(/\?/g, () => `$${index++}`);
    
    // Convert INSERT OR IGNORE
    if (converted.match(/INSERT\s+OR\s+IGNORE/i)) {
      converted = converted.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
      // Add ON CONFLICT for atr_documents (no unique constraint, so skip)
    }
    
    return converted;
  }

  // SQLite methods
  runSQLite(query, params) {
    return new Promise((resolve, reject) => {
      this.sqliteDb.run(query, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  getSQLite(query, params) {
    return new Promise((resolve, reject) => {
      this.sqliteDb.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  allSQLite(query, params) {
    return new Promise((resolve, reject) => {
      this.sqliteDb.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async close() {
    if (this.pgPool) {
      await this.pgPool.end();
      console.log('PostgreSQL connection closed');
    }
    if (this.sqliteDb) {
      this.sqliteDb.close((err) => {
        if (err) console.error('Error closing SQLite:', err.message);
        else console.log('SQLite connection closed');
      });
    }
  }
}

const database = new HybridDatabase();
module.exports = database;
