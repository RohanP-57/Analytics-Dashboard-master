import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Eye, Trash2, Upload, Search, Filter } from 'lucide-react';
import '../styles/UploadATR.css';

const UploadedATR = () => {
  const { user } = useAuth();
  const [atrDocuments, setAtrDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.userType === 'admin' || user?.username === 'AEROVANIA MASTER';

  // Sample sites - you may want to fetch these from backend
  const sites = [
    'Site A',
    'Site B', 
    'Site C',
    'Site D',
    'Site E'
  ];

  useEffect(() => {
    fetchATRDocuments();
  }, []);

  const fetchATRDocuments = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (dateFilter) params.startDate = dateFilter;
      if (siteFilter) params.site = siteFilter;
      
      const response = await api.get('/uploaded-atr/list', { params });
      const documentsData = response.data?.documents || [];
      setAtrDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (error) {
      console.error('Error fetching ATR documents:', error);
      setAtrDocuments([]);
      toast.error('Failed to load ATR documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadATR = async (formData) => {
    try {
      setUploading(true);
      await api.post('/uploaded-atr/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('ATR document uploaded successfully!');
      setShowUploadModal(false);
      fetchATRDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload ATR document';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleViewATR = (atrLink) => {
    if (atrLink) {
      window.open(atrLink, '_blank');
    }
  };

  const handleDeleteATR = async (documentId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      await api.delete(`/uploaded-atr/${documentId}`);
      toast.success('ATR document deleted successfully');
      fetchATRDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete ATR document';
      toast.error(errorMessage);
    }
  };

  const handleSearch = () => {
    // Implement search functionality
    console.log('Searching for:', searchTerm);
  };

  const filteredDocuments = atrDocuments.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || 
      new Date(doc.dateTime).toDateString() === new Date(dateFilter).toDateString();
    
    const matchesSite = !siteFilter || doc.siteName === siteFilter;

    return matchesSearch && matchesDate && matchesSite;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-atr-container">
      <div className="upload-atr-header">
        <h1>Uploaded ATR</h1>
        <p>View and manage Action Taken Reports for all sites</p>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by site name or file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button onClick={handleSearch} className="search-button">
              <Search size={18} />
              Search
            </button>
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label>Date Filter:</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="date-filter"
              />
            </div>
            
            <div className="filter-group">
              <label>Site Filter:</label>
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="site-filter"
              >
                <option value="">All Sites</option>
                {sites.map(site => (
                  <option key={site} value={site}>{site}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <div className="upload-button-section">
        <button 
          className="upload-file-button"
          onClick={() => setShowUploadModal(true)}
          disabled={uploading}
        >
          <Upload size={20} />
          Upload ATR
        </button>
      </div>

      {/* ATR Documents Table */}
      <div className="documents-section">
        <div className="documents-header">
          <div className="header-left">
            <h2>Action Taken Reports</h2>
            {isAdmin && (
              <span className="admin-badge">👑 Admin View</span>
            )}
          </div>
          <div className="header-right">
            <button onClick={fetchATRDocuments} className="refresh-button" disabled={loading}>
              {loading ? '🔄' : '↻'} Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading ATR documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>No ATR documents found</h3>
            <p>Upload your first ATR document to get started</p>
          </div>
        ) : (
          <div className="documents-table-wrapper">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>S. No.</th>
                  <th>Site Name</th>
                  <th>Date/Time</th>
                  <th>Video Link</th>
                  <th>Upload ATR</th>
                  <th>File Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.serialNo}</td>
                    <td>{doc.siteName}</td>
                    <td>{formatDate(doc.dateTime)}</td>
                    <td>
                      {doc.videoLink ? (
                        <a 
                          href={doc.videoLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="video-link"
                        >
                          View Video
                        </a>
                      ) : (
                        <span className="no-link">No Video</span>
                      )}
                    </td>
                    <td>
                      {doc.atrLink ? (
                        <button
                          onClick={() => handleViewATR(doc.atrLink)}
                          className="atr-link-button"
                        >
                          View ATR
                        </button>
                      ) : (
                        <span className="no-link">No ATR</span>
                      )}
                    </td>
                    <td className="file-details-cell">
                      <div className="file-details">
                        <div className="file-name">{doc.fileName}</div>
                        <div className="file-meta">
                          <span>{doc.department}</span> • 
                          <span>{doc.uploadedBy}</span> • 
                          <span>{formatFileSize(doc.fileSize)}</span>
                        </div>
                        {doc.comment && (
                          <div className="file-comment" title={doc.comment}>
                            💬 {doc.comment.length > 50 ? doc.comment.substring(0, 50) + '...' : doc.comment}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="actions-cell">
                      <button
                        onClick={() => handleViewATR(doc.atrLink)}
                        className="icon-button view"
                        title="View ATR Document"
                      >
                        <Eye size={18} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteATR(doc.id, doc.fileName)}
                          className="icon-button delete"
                          title="Delete ATR Document"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal - Placeholder for now */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload ATR Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <p>ATR Upload form will be implemented here</p>
              <p>Fields: Site Name, Date/Time, Video Link, PDF Upload, Comments</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowUploadModal(false)} className="cancel-button">
                Cancel
              </button>
              <button onClick={() => setShowUploadModal(false)} className="upload-button">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadedATR;