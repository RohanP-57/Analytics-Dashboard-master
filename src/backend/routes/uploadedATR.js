const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const UploadedATR = require('../models/UploadedATR');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dgf5874nz',
  api_key: process.env.CLOUDINARY_API_KEY || '873245158622578',
  api_secret: process.env.CLOUDINARY_API_SECRET || '3DF8o9ZZD-WIzuSKfS6kFQoVzp4'
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Get all ATR documents
router.get('/list', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching ATR documents...');
    
    const { site, startDate, endDate, search } = req.query;
    let documents;

    if (search) {
      documents = await UploadedATR.searchATRDocuments(search);
    } else if (site) {
      documents = await UploadedATR.getATRDocumentsBySite(site);
    } else if (startDate && endDate) {
      documents = await UploadedATR.getATRDocumentsByDateRange(startDate, endDate);
    } else {
      documents = await UploadedATR.getAllATRDocuments();
    }

    res.json({
      documents: documents.map(doc => ({
        id: doc.id,
        serialNo: doc.serial_no,
        siteName: doc.site_name,
        dateTime: doc.date_time,
        videoLink: doc.video_link,
        atrLink: doc.atr_link,
        fileName: doc.file_name,
        department: doc.department,
        uploadedBy: doc.uploaded_by_name || 'Unknown',
        uploadDate: doc.upload_date,
        fileSize: doc.file_size,
        comment: doc.comment,
        canDelete: req.user.role === 'admin' || req.user.userType === 'admin',
        canEdit: req.user.role === 'admin' || req.user.userType === 'admin' || doc.uploaded_by === req.user.id
      }))
    });

  } catch (error) {
    console.error('❌ List ATR documents error:', error);
    res.status(500).json({ error: 'Failed to fetch ATR documents: ' + error.message });
  }
});

// Upload new ATR document
router.post('/upload', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    console.log('🔍 ATR Document Upload Request Started');
    console.log('📤 User:', req.user?.username, 'Department:', req.user?.department);

    const { siteName, dateTime, videoLink, comment } = req.body;

    if (!siteName || !dateTime) {
      return res.status(400).json({ error: 'Site name and date/time are required' });
    }

    let atrLink = null;
    let fileName = null;
    let fileSize = null;

    // If PDF file is uploaded
    if (req.file) {
      console.log('📁 File received:', `${req.file.originalname} (${req.file.size} bytes)`);

      // Determine department based on user role
      let department = req.user.department;
      if (!department) {
        if (req.user.role === 'admin' || req.user.userType === 'admin') {
          department = 'Admin';
        } else if (req.user.username === 'AEROVANIA MASTER' || req.user.role === 'super_admin') {
          department = 'Super Admin';
        } else {
          return res.status(400).json({ error: 'User department not found' });
        }
      }

      const timestamp = Date.now();
      const filename = `atr_${timestamp}_${req.file.originalname}`;

      console.log('☁️ Starting Cloudinary upload...');
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            folder: `uploaded-atr/${siteName.replace(/\s+/g, '-').toLowerCase()}`,
            public_id: filename.replace('.pdf', ''),
            format: 'pdf',
            type: 'upload',
            access_mode: 'public'
          },
          (error, result) => {
            if (error) {
              console.log('❌ Cloudinary upload failed:', error.message);
              reject(error);
            } else {
              console.log('✅ Cloudinary upload successful:', result.secure_url);
              resolve(result);
            }
          }
        ).end(req.file.buffer);
      });

      atrLink = uploadResult.secure_url;
      fileName = req.file.originalname;
      fileSize = req.file.size;
    }

    // Get next serial number
    const serialNo = await UploadedATR.getNextSerialNumber();

    // Save to database
    console.log('💾 Saving to database...');
    const atrData = {
      serial_no: serialNo,
      site_name: siteName,
      date_time: dateTime,
      video_link: videoLink || null,
      atr_link: atrLink,
      file_name: fileName,
      department: req.user.department || 'Admin',
      uploaded_by: req.user.id,
      file_size: fileSize,
      comment: comment || null
    };

    const document = await UploadedATR.createATRDocument(atrData);
    console.log('✅ Database save successful, document ID:', document.id);

    res.status(201).json({
      message: 'ATR document uploaded successfully',
      document: {
        id: document.id,
        serialNo: document.serial_no,
        siteName: document.site_name,
        dateTime: document.date_time,
        videoLink: document.video_link,
        atrLink: document.atr_link,
        fileName: document.file_name,
        department: document.department,
        uploadDate: document.upload_date,
        fileSize: document.file_size,
        comment: document.comment
      }
    });

    console.log('🎉 ATR Document Upload completed successfully');

  } catch (error) {
    console.error('❌ ATR Document Upload error:', error);
    res.status(500).json({ error: 'Failed to upload ATR document: ' + error.message });
  }
});

// Get ATR document by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const document = await UploadedATR.getATRDocumentById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'ATR document not found' });
    }

    res.json({
      id: document.id,
      serialNo: document.serial_no,
      siteName: document.site_name,
      dateTime: document.date_time,
      videoLink: document.video_link,
      atrLink: document.atr_link,
      fileName: document.file_name,
      department: document.department,
      uploadedBy: document.uploaded_by_name || 'Unknown',
      uploadDate: document.upload_date,
      fileSize: document.file_size,
      comment: document.comment
    });

  } catch (error) {
    console.error('❌ Get ATR document error:', error);
    res.status(500).json({ error: 'Failed to fetch ATR document: ' + error.message });
  }
});

// Update ATR document
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const document = await UploadedATR.getATRDocumentById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'ATR document not found' });
    }

    // Check if user can edit
    const canEdit = req.user.role === 'admin' ||
      req.user.userType === 'admin' ||
      document.uploaded_by === req.user.id;

    if (!canEdit) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { siteName, dateTime, videoLink, atrLink, fileName, comment } = req.body;

    const updateData = {
      site_name: siteName || document.site_name,
      date_time: dateTime || document.date_time,
      video_link: videoLink !== undefined ? videoLink : document.video_link,
      atr_link: atrLink !== undefined ? atrLink : document.atr_link,
      file_name: fileName || document.file_name,
      comment: comment !== undefined ? comment : document.comment
    };

    const updated = await UploadedATR.updateATRDocument(req.params.id, updateData);

    if (!updated) {
      return res.status(404).json({ error: 'ATR document not found' });
    }

    res.json({ message: 'ATR document updated successfully' });

  } catch (error) {
    console.error('❌ Update ATR document error:', error);
    res.status(500).json({ error: 'Failed to update ATR document: ' + error.message });
  }
});

// Delete ATR document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const document = await UploadedATR.getATRDocumentById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'ATR document not found' });
    }

    // Check if user can delete
    const canDelete = req.user.role === 'admin' ||
      req.user.userType === 'admin' ||
      document.uploaded_by === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Delete from Cloudinary if ATR file exists
    if (document.atr_link && document.atr_link.includes('cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = document.atr_link.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        const folderPath = `uploaded-atr/${document.site_name.replace(/\s+/g, '-').toLowerCase()}/${publicId}`;
        
        await cloudinary.uploader.destroy(folderPath, {
          resource_type: 'raw'
        });
        console.log('✅ ATR file deleted from Cloudinary');
      } catch (deleteError) {
        console.log('⚠️ Failed to delete ATR file from Cloudinary:', deleteError.message);
      }
    }

    // Delete from database
    const deleted = await UploadedATR.deleteATRDocument(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'ATR document not found' });
    }

    res.json({ message: 'ATR document deleted successfully' });

  } catch (error) {
    console.error('❌ Delete ATR document error:', error);
    res.status(500).json({ error: 'Failed to delete ATR document: ' + error.message });
  }
});

// Get available sites
router.get('/sites/list', authenticateToken, async (req, res) => {
  try {
    // Get unique site names from uploaded ATR documents
    const sites = await UploadedATR.getAllATRDocuments();
    const uniqueSites = [...new Set(sites.map(doc => doc.site_name))].sort();

    res.json({ sites: uniqueSites });

  } catch (error) {
    console.error('❌ Get sites error:', error);
    res.status(500).json({ error: 'Failed to fetch sites: ' + error.message });
  }
});

module.exports = router;