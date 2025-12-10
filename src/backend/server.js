const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const uploadRoutes = require('./routes/upload');
const violationsRoutes = require('./routes/violations');
const analyticsRoutes = require('./routes/analytics');
const boundariesRoutes = require('./routes/boundaries');
const authRoutes = require('./routes/auth');
const featuresRoutes = require('./routes/features');
const videoLinksRoutes = require('./routes/videoLinks');
const sitesRoutes = require('./routes/sites');
const atrRoutes = require('./routes/atr');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"], // Allow images from any HTTPS/HTTP source
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https://res.cloudinary.com", "https://player.cloudinary.com"], // Allow Cloudinary media
      frameSrc: ["'self'", "https://player.cloudinary.com"], // Allow Cloudinary player iframe
    },
  },
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static('uploads'));

app.use('/api/upload', uploadRoutes);
app.use('/api/violations', violationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/boundaries', boundariesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/video-links', videoLinksRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/atr', atrRoutes);

// Image proxy route to handle Google Drive CORS issues
app.get('/api/image-proxy', async (req, res) => {
  try {
    let { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Decode the URL in case it's double-encoded
    url = decodeURIComponent(url);

    console.log('Image proxy request for:', url);

    // Import fetch dynamically (for Node.js compatibility)
    const fetch = (await import('node-fetch')).default;

    // For Google Drive URLs, ensure proper format
    if (url.includes('drive.google.com')) {
      // Use the same processing logic as imageUtils for consistency
      const { processImageUrl } = require('./utils/imageUtils');
      const processedUrl = processImageUrl(url);
      
      if (processedUrl !== url) {
        url = processedUrl;
        console.log('Image proxy: Using processed Google Drive URL:', url);
      }
    }

    // Set timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site'
      },
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`Image proxy failed with status ${response.status} for URL: ${url}`);

      // For Google Drive, try alternative formats
      if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
        // Extract file ID again for fallback attempts
        let fileId = null;
        const originalUrl = req.query.url;
        const patterns = [
          /\/file\/d\/([a-zA-Z0-9_-]+)\//, // sharing URL format
          /id=([a-zA-Z0-9_-]+)/, // thumbnail/uc format
          /\/d\/([a-zA-Z0-9_-]+)/ // direct format or googleusercontent format
        ];

        for (const pattern of patterns) {
          const match = originalUrl.match(pattern);
          if (match) {
            fileId = match[1];
            break;
          }
        }

        if (fileId && response.status === 403) {
          console.log('Trying alternative Google Drive formats...');

          // Try different formats
          const fallbackUrls = [
            `https://drive.google.com/uc?export=view&id=${fileId}`,
            `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000-h1000`,
            `https://lh3.googleusercontent.com/d/${fileId}=w800-h600`,
            `https://drive.google.com/uc?id=${fileId}`
          ];

          for (const fallbackUrl of fallbackUrls) {
            try {
              console.log(`Trying fallback URL: ${fallbackUrl}`);
              const fallbackResponse = await fetch(fallbackUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                  'Accept': 'image/*,*/*;q=0.8',
                  'Referer': 'https://drive.google.com/'
                },
                signal: controller.signal,
                redirect: 'follow'
              });

              if (fallbackResponse.ok) {
                const fallbackContentType = fallbackResponse.headers.get('content-type');
                if (fallbackContentType && fallbackContentType.startsWith('image/')) {
                  console.log(`Success with fallback URL: ${fallbackUrl}`);
                  res.set({
                    'Content-Type': fallbackContentType,
                    'Cache-Control': 'public, max-age=3600',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type'
                  });
                  return fallbackResponse.body.pipe(res);
                }
              }
            } catch (fallbackError) {
              console.log(`Fallback URL failed: ${fallbackUrl}`, fallbackError.message);
              continue;
            }
          }
        }

        // For 500 errors, try one more fallback format
        if (response.status === 500 && fileId) {
          console.log('Google Drive returned 500 error, trying final fallback...');
          try {
            const finalFallbackUrl = `https://lh3.googleusercontent.com/d/${fileId}=w800-h600`;
            const finalResponse = await fetch(finalFallbackUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*,*/*;q=0.8'
              },
              signal: controller.signal
            });
            
            if (finalResponse.ok) {
              const finalContentType = finalResponse.headers.get('content-type');
              if (finalContentType && finalContentType.startsWith('image/')) {
                console.log(`Final fallback successful: ${finalFallbackUrl}`);
                res.set({
                  'Content-Type': finalContentType,
                  'Cache-Control': 'public, max-age=3600',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET',
                  'Access-Control-Allow-Headers': 'Content-Type'
                });
                return finalResponse.body.pipe(res);
              }
            }
          } catch (finalError) {
            console.log('Final fallback also failed:', finalError.message);
          }
        }

        return res.status(403).json({
          error: 'Google Drive access denied',
          suggestion: 'This specific Google Drive file may have server-side issues. Try re-uploading the image to Google Drive with a new file ID.',
          originalUrl: req.query.url,
          fileId: fileId,
          googleDriveStatus: response.status
        });
      }

      return res.status(response.status).json({ error: `Failed to fetch image: ${response.statusText}` });
    }

    // Check if response is actually an image or if it's a Google Drive error page
    const contentType = response.headers.get('content-type');

    // Google Drive sometimes returns HTML error pages
    if (contentType && contentType.includes('text/html')) {
      console.log(`Google Drive returned HTML page for URL: ${url}`);
      return res.status(403).json({
        error: 'Google Drive access denied',
        suggestion: 'Image may be private or require authentication'
      });
    }

    if (contentType && !contentType.startsWith('image/')) {
      console.log(`Non-image content type received: ${contentType} for URL: ${url}`);
      return res.status(400).json({ error: 'URL does not point to an image' });
    }

    // Set appropriate headers
    res.set({
      'Content-Type': contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    console.log(`Successfully proxying image: ${url}`);

    // Pipe the image data
    response.body.pipe(res);
  } catch (error) {
    console.error('Image proxy error for URL:', req.query.url, error.message);

    if (error.name === 'AbortError') {
      return res.status(408).json({ error: 'Request timeout' });
    }

    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database status endpoint
app.get('/api/debug/database', (req, res) => {
  const database = require('./utils/database');
  res.json({
    status: 'OK',
    database_type: database.usePostgres ? 'PostgreSQL' : 'SQLite',
    postgres_available: !!database.pgPool,
    sqlite_available: !!database.sqliteDb,
    timestamp: new Date().toISOString()
  });
});

// Read SQLite data to see what users exist
app.get('/api/debug/read-sqlite-users', async (req, res) => {
  try {
    const database = require('./utils/database');
    
    let result = {
      admin_users: [],
      regular_users: [],
      legacy_users: [],
      atr_documents: []
    };
    
    // Read admin table
    try {
      const admins = await database.allSQLite('SELECT * FROM admin');
      result.admin_users = admins.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        permissions: user.permissions,
        created_at: user.created_at,
        has_password: !!user.password_hash
      }));
      console.log(`Found ${admins.length} admin users in SQLite`);
    } catch (err) {
      console.log('No admin table in SQLite:', err.message);
    }
    
    // Read user table
    try {
      const users = await database.allSQLite('SELECT * FROM "user"');
      result.regular_users = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        department: user.department,
        access_level: user.access_level,
        created_at: user.created_at,
        has_password: !!user.password_hash
      }));
      console.log(`Found ${users.length} regular users in SQLite`);
    } catch (err) {
      console.log('No user table in SQLite:', err.message);
    }
    
    // Read legacy users table
    try {
      const legacyUsers = await database.allSQLite('SELECT * FROM users');
      result.legacy_users = legacyUsers.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        has_password: !!user.password_hash
      }));
      console.log(`Found ${legacyUsers.length} legacy users in SQLite`);
    } catch (err) {
      console.log('No legacy users table in SQLite:', err.message);
    }
    
    // Read ATR documents (just count)
    try {
      const atrDocs = await database.allSQLite('SELECT COUNT(*) as count FROM atr_documents');
      result.atr_documents_count = atrDocs[0]?.count || 0;
      console.log(`Found ${result.atr_documents_count} ATR documents in SQLite`);
    } catch (err) {
      console.log('No ATR documents table in SQLite:', err.message);
      result.atr_documents_count = 0;
    }
    
    res.json({
      success: true,
      message: 'SQLite data read successfully',
      data: result,
      total_users: result.admin_users.length + result.regular_users.length + result.legacy_users.length
    });
    
  } catch (error) {
    console.error('Read SQLite error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Migrate users from SQLite to PostgreSQL (one-time use) - GET version for easy access
app.get('/api/debug/migrate-users', async (req, res) => {
  try {
    const database = require('./utils/database');
    
    if (!database.usePostgres) {
      return res.status(400).json({ error: 'PostgreSQL not available for migration' });
    }
    
    let migratedCount = 0;
    let errors = [];
    
    // Migrate admin users from SQLite to PostgreSQL
    try {
      const sqliteAdmins = await database.allSQLite('SELECT * FROM admin');
      console.log(`Found ${sqliteAdmins.length} admin users in SQLite`);
      
      for (const admin of sqliteAdmins) {
        try {
          await database.runPostgres(
            'INSERT INTO admin (username, email, password_hash, full_name, permissions, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
            [admin.username, admin.email, admin.password_hash, admin.full_name, admin.permissions || 'all', admin.created_at]
          );
          migratedCount++;
          console.log(`✅ Migrated admin: ${admin.username}`);
        } catch (err) {
          console.error(`❌ Failed to migrate admin ${admin.username}:`, err.message);
          errors.push(`Admin ${admin.username}: ${err.message}`);
        }
      }
    } catch (err) {
      console.log('No admin table in SQLite or error reading:', err.message);
    }
    
    // Migrate regular users from SQLite to PostgreSQL
    try {
      const sqliteUsers = await database.allSQLite('SELECT * FROM "user"');
      console.log(`Found ${sqliteUsers.length} regular users in SQLite`);
      
      for (const user of sqliteUsers) {
        try {
          await database.runPostgres(
            'INSERT INTO "user" (username, email, password_hash, full_name, department, access_level, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [user.username, user.email, user.password_hash, user.full_name, user.department, user.access_level || 'basic', user.created_at]
          );
          migratedCount++;
          console.log(`✅ Migrated user: ${user.username}`);
        } catch (err) {
          console.error(`❌ Failed to migrate user ${user.username}:`, err.message);
          errors.push(`User ${user.username}: ${err.message}`);
        }
      }
    } catch (err) {
      console.log('No user table in SQLite or error reading:', err.message);
    }
    
    // Also migrate any users from the legacy 'users' table
    try {
      const legacyUsers = await database.allSQLite('SELECT * FROM users');
      console.log(`Found ${legacyUsers.length} legacy users in SQLite`);
      
      for (const user of legacyUsers) {
        try {
          // Determine if this should go to admin or user table based on role
          if (user.role === 'admin') {
            await database.runPostgres(
              'INSERT INTO admin (username, email, password_hash, permissions, created_at) VALUES ($1, $2, $3, $4, $5)',
              [user.username, user.email, user.password_hash, 'all', user.created_at]
            );
          } else {
            await database.runPostgres(
              'INSERT INTO "user" (username, email, password_hash, access_level, created_at) VALUES ($1, $2, $3, $4, $5)',
              [user.username, user.email, user.password_hash, 'basic', user.created_at]
            );
          }
          migratedCount++;
          console.log(`✅ Migrated legacy user: ${user.username} (${user.role})`);
        } catch (err) {
          console.error(`❌ Failed to migrate legacy user ${user.username}:`, err.message);
          errors.push(`Legacy user ${user.username}: ${err.message}`);
        }
      }
    } catch (err) {
      console.log('No legacy users table in SQLite or error reading:', err.message);
    }
    
    // Also migrate ATR documents from SQLite to PostgreSQL
    try {
      const sqliteATRDocs = await database.allSQLite('SELECT * FROM atr_documents');
      console.log(`Found ${sqliteATRDocs.length} ATR documents in SQLite`);
      
      for (const doc of sqliteATRDocs) {
        try {
          await database.runPostgres(
            'INSERT INTO atr_documents (filename, cloudinary_url, cloudinary_public_id, department, uploaded_by, file_size, upload_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [doc.filename, doc.cloudinary_url, doc.cloudinary_public_id, doc.department, doc.uploaded_by, doc.file_size, doc.upload_date]
          );
          migratedCount++;
          console.log(`✅ Migrated ATR document: ${doc.filename}`);
        } catch (err) {
          console.error(`❌ Failed to migrate ATR document ${doc.filename}:`, err.message);
          errors.push(`ATR document ${doc.filename}: ${err.message}`);
        }
      }
    } catch (err) {
      console.log('No ATR documents table in SQLite or error reading:', err.message);
    }

    // If no users were migrated, create default admin account
    if (migratedCount === 0) {
      console.log('No users found in SQLite, creating default admin account...');
      const bcrypt = require('bcryptjs');
      
      try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await database.runPostgres(
          'INSERT INTO admin (username, email, password_hash, permissions, created_at) VALUES ($1, $2, $3, $4, $5)',
          ['AEROVANIA MASTER', 'admin@aerovania.com', hashedPassword, 'all', new Date().toISOString()]
        );
        migratedCount++;
        console.log('✅ Created default admin account: AEROVANIA MASTER / admin123');
      } catch (err) {
        console.error('❌ Failed to create default admin:', err.message);
        errors.push(`Default admin creation: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Migration completed! ${migratedCount} users and ATR documents migrated to PostgreSQL`,
      migrated_count: migratedCount,
      errors: errors.length > 0 ? errors : null,
      note: migratedCount === 1 && errors.length === 0 ? 'Default admin created: AEROVANIA MASTER / admin123' : null
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check frontend files
app.get('/api/debug/frontend', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const publicPath = path.join(__dirname, 'public');
  
  try {
    const exists = fs.existsSync(publicPath);
    let files = [];
    let indexExists = false;
    
    if (exists) {
      files = fs.readdirSync(publicPath);
      indexExists = fs.existsSync(path.join(publicPath, 'index.html'));
    }
    
    res.json({
      status: 'OK',
      publicPath,
      directoryExists: exists,
      indexHtmlExists: indexExists,
      files: files,
      environment: process.env.NODE_ENV,
      port: PORT
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      publicPath,
      environment: process.env.NODE_ENV
    });
  }
});

// Serve React app for all non-API routes (production only)
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const publicPath = path.join(__dirname, 'public');
  
  console.log(`🎯 Setting up static file serving from: ${publicPath}`);
  
  // Check if public directory exists
  const fs = require('fs');
  if (fs.existsSync(publicPath)) {
    console.log('✅ Public directory exists');
    const files = fs.readdirSync(publicPath);
    console.log('📁 Files in public directory:', files);
  } else {
    console.error('❌ Public directory does not exist!');
  }
  
  // Serve static files with proper headers
  app.use(express.static(publicPath, {
    maxAge: '1d',
    etag: false
  }));
  
  // Handle React Router - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    console.log(`🔍 Serving index.html for route: ${req.path}`);
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error('❌ index.html not found!');
      res.status(404).send('Frontend not built properly - index.html missing');
    }
  });
} else {
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found - development mode' });
  });
}

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({ error: error.message || 'Internal Server Error' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Analytics Dashboard API ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Railway URL: ${process.env.RAILWAY_STATIC_URL || 'Not set'}`);
  
  if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    console.log(`🎯 Frontend served from: ${path.join(__dirname, 'public')}`);
  }
  
  console.log('Ready to receive real violation data via /api/upload endpoints.');
});

// Graceful shutdown for Railway
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});