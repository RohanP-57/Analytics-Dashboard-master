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
        filename: doc.filename,
        siteName: doc.site_name,
        cloudinaryUrl: doc.cloudinary_url,
        department: doc.department,
        uploadedBy: doc.uploaded_by_name || 'Unknown',
        uploadDate: doc.upload_date,
        fileSize: doc.file_size,
        canDelete: req.user.role === 'admin' || req.user.userType === 'admin',
        canEdit: req.user.role === 'admin' || req.user.userType === 'admin' || doc.uploaded_by === req.user.id
      }))
    });

  } catch (error) {
    console.error('❌ List ATR documents error:', error);
    res.status(500).json({ error: 'Failed to fetch ATR documents: ' + error.message });
  }
});

// Note: Upload functionality removed - ATR documents are managed through atr_documents table

// View ATR document
router.get('/view/:id', authenticateToken, async (req, res) => {
  try {
    const document = await UploadedATR.getATRDocumentById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'ATR document not found' });
    }

    res.json({
      filename: document.filename,
      url: document.cloudinary_url,
      department: document.department,
      upload_date: document.upload_date
    });

  } catch (error) {
    console.error('❌ View ATR document error:', error);
    res.status(500).json({ error: 'Failed to access document: ' + error.message });
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

    // Delete from Cloudinary
    if (document.cloudinary_public_id) {
      try {
        await cloudinary.uploader.destroy(document.cloudinary_public_id, {
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

module.exports = router;