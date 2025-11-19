const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    const dbPath = path.join(__dirname, '../data/violations.db');

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.createTables();
      }
    });
  }

  createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createAdminTable = `
      CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        permissions TEXT DEFAULT 'all',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createUserTable = `
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        department TEXT,
        access_level TEXT DEFAULT 'basic',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createReportsTable = `
      CREATE TABLE IF NOT EXISTS reports (
        report_id TEXT PRIMARY KEY,
        drone_id TEXT NOT NULL,
        date TEXT NOT NULL,
        location TEXT NOT NULL,
        total_violations INTEGER,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(drone_id, date)
      )
    `;

    const createViolationsTable = `
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
    `;

    const createVideosLinksTable = `
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
    `;

    const createSitesTable = `
      CREATE TABLE IF NOT EXISTS sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.serialize(() => {
      this.db.run(createUsersTable, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
        } else {
          console.log('Users table ready');
        }
      });

      this.db.run(createAdminTable, (err) => {
        if (err) {
          console.error('Error creating admin table:', err.message);
        } else {
          console.log('Admin table ready');
        }
      });

      this.db.run(createUserTable, (err) => {
        if (err) {
          console.error('Error creating user table:', err.message);
        } else {
          console.log('User table ready');
        }
      });

      this.db.run(createReportsTable, (err) => {
        if (err) {
          console.error('Error creating reports table:', err.message);
        } else {
          console.log('Reports table ready');
          // Add new columns if they don't exist (for existing databases)
          this.db.run('ALTER TABLE reports ADD COLUMN total_violations INTEGER', (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error('Error adding total_violations column:', err.message);
            }
          });
        }
      });

      this.db.run(createViolationsTable, (err) => {
        if (err) {
          console.error('Error creating violations table:', err.message);
        } else {
          console.log('Violations table ready');
          // Add new columns if they don't exist (for existing databases)
          this.db.run('ALTER TABLE violations ADD COLUMN confidence REAL', (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error('Error adding confidence column:', err.message);
            }
          });
          this.db.run('ALTER TABLE violations ADD COLUMN frame_number INTEGER', (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error('Error adding frame_number column:', err.message);
            }
          });
        }
      });

      this.db.run(createVideosLinksTable, (err) => {
        if (err) {
          console.error('Error creating videos_links table:', err.message);
        } else {
          console.log('Videos Links table ready');
        }
      });

      this.db.run(createSitesTable, (err) => {
        if (err) {
          console.error('Error creating sites table:', err.message);
        } else {
          console.log('Sites table ready');
          this.insertDefaultSites();
        }
      });
    });
  }

  run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  insertDefaultSites() {
    const defaultSites = [
      'Bukaro',
      'BNK Mines',
      'Dhori',
      'Kathara'
    ];

    defaultSites.forEach(siteName => {
      this.db.run(
        'INSERT OR IGNORE INTO sites (name) VALUES (?)',
        [siteName],
        (err) => {
          if (err) {
            console.error(`Error inserting site ${siteName}:`, err.message);
          } else {
            console.log(`Site ${siteName} ready`);
          }
        }
      );
    });

    // Create default admin user
    this.createDefaultAdmin();
  }

  async createDefaultAdmin() {
    const bcrypt = require('bcryptjs');
    
    try {
      // Check if admin user already exists in admin table
      const existingAdmin = await this.get(
        'SELECT id FROM admin WHERE email = ?',
        ['admin@ccl.com']
      );

      if (!existingAdmin) {
        // Hash the default password
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Insert default admin user into admin table
        await this.run(
          'INSERT INTO admin (username, email, password_hash, full_name, permissions, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          ['admin', 'admin@ccl.com', hashedPassword, 'Administrator', 'all', new Date().toISOString()]
        );
        
        console.log('Default admin user created: admin@ccl.com / admin123');
      }
    } catch (err) {
      console.error('Error creating default admin:', err.message);
    }
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}


const database = new Database();

module.exports = database; 