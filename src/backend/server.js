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

const app = express();
const PORT = process.env.PORT || 5000;

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
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
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

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({ error: error.message || 'Internal Server Error' });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Ready to receive real violation data via /api/upload endpoints.');
});