const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const AtrDocument = require('../models/AtrDocument');
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

// Helper function to get department folder name
const getDepartmentFolder = (department) => {
  const departmentMap = {
    'E&T Department': 'et-department',
    'Security Department': 'security-department',
    'Operation Department': 'operation-department',
    'Survey Department': 'survey-department',
    'Safety Department': 'safety-department'
  };
  return departmentMap[department] || 'general';
};

// Upload ATR document
router.post('/upload', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    console.log('🔍 ATR Upload Request Started');
    console.log('📤 User:', req.user?.username, 'Department:', req.user?.department);
    console.log('📁 File received:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');

    if (!req.file) {
      console.log('❌ No file provided in request');
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    if (!req.user.department) {
      console.log('❌ User has no department assigned');
      return res.status(400).json({ error: 'User department not found' });
    }

    const departmentFolder = getDepartmentFolder(req.user.department);
    const timestamp = Date.now();
    const filename = `${timestamp}_${req.file.originalname}`;

    console.log('📂 Department folder:', departmentFolder);
    console.log('📄 Generated filename:', filename);

    // Upload to Cloudinary
    console.log('☁️ Starting Cloudinary upload...');
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: `atr-documents/${departmentFolder}`,
          public_id: filename.replace('.pdf', ''),
          format: 'pdf'
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

    // Save to database
    console.log('💾 Saving to database...');
    const documentData = {
      filename: req.file.originalname,
      cloudinary_url: uploadResult.secure_url,
      cloudinary_public_id: uploadResult.public_id,
      department: req.user.department,
      uploaded_by: req.user.id,
      file_size: req.file.size
    };

    const document = await AtrDocument.createDocument(documentData);
    console.log('✅ Database save successful, document ID:', document.id);

    res.status(201).json({
      message: 'ATR document uploaded successfully',
      document: {
        id: document.id,
        filename: document.filename,
        department: document.department,
        upload_date: document.upload_date,
        file_size: document.file_size
      }
    });

    console.log('🎉 ATR Upload completed successfully');

  } catch (error) {
    console.error('❌ ATR Upload error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to upload document: ' + error.message });
  }
});

// Get ATR documents for user's department
router.get('/list', authenticateToken, async (req, res) => {
  try {
    let documents;

    // Admin can see all documents, users only see their department's documents
    if (req.user.role === 'admin' || req.user.userType === 'admin') {
      documents = await AtrDocument.getAllDocuments();
    } else {
      if (!req.user.department) {
        return res.status(400).json({ error: 'User department not found' });
      }
      documents = await AtrDocument.getDocumentsByDepartment(req.user.department);
    }

    res.json({
      documents: documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        department: doc.department,
        uploaded_by: doc.uploaded_by_name || 'Unknown',
        upload_date: doc.upload_date,
        file_size: doc.file_size,
        cloudinary_url: doc.cloudinary_url,
        canDelete: doc.uploaded_by === req.user.id || req.user.role === 'admin'
      }))
    });

  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents: ' + error.message });
  }
});

// View/Download ATR document
router.get('/view/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 ATR View Request - Document ID:', req.params.id);
    console.log('👤 User:', req.user?.username, 'Department:', req.user?.department);

    const document = await AtrDocument.getDocumentById(req.params.id);

    if (!document) {
      console.log('❌ Document not found:', req.params.id);
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if user can access this document
    const canAccess = req.user.role === 'admin' ||
      req.user.userType === 'admin' ||
      document.department === req.user.department;

    if (!canAccess) {
      console.log('❌ Access denied - User department:', req.user.department, 'Document department:', document.department);
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('📄 Document found:', document.filename);
    console.log('🔗 Cloudinary public_id:', document.cloudinary_public_id);
    console.log('🔗 Cloudinary URL:', document.cloudinary_url);

    // Generate signed URL for secure access (expires in 1 hour)
    // For raw files, we need to use url() method with sign_url option
    const signedUrl = cloudinary.url(document.cloudinary_public_id, {
      resource_type: 'raw',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour from now
      type: 'upload'
    });

    console.log('✅ Generated signed URL for secure access:', signedUrl);

    // Return the signed URL for secure access
    res.json({
      filename: document.filename,
      url: signedUrl,
      department: document.department,
      upload_date: document.upload_date,
      expires_in: '1 hour'
    });

  } catch (error) {
    console.error('❌ View document error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to access document: ' + error.message });
  }
});

// Delete ATR document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const document = await AtrDocument.getDocumentById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if user can delete this document
    const canDelete = req.user.role === 'admin' ||
      req.user.userType === 'admin' ||
      document.uploaded_by === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(document.cloudinary_public_id, {
      resource_type: 'raw'
    });

    // Delete from database
    const deleted = await AtrDocument.deleteDocument(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document deleted successfully' });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document: ' + error.message });
  }
});

module.exports = router;