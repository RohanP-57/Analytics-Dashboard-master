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
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    siteName: '',
    dateTime: '',
    videoLink: '',
    comment: '',
    file: null
  });

  const isAdmin = user?.role === 'admin' || user?.userType === 'admin' || user?.username === 'AEROVANIA MASTER';

  // Available sites
  const sites = [
    'Site A',
    'Site B', 
    'Site C',
    'Bukaro',
    'BNK Mines',
    'Dhori',
    'Kathara'
  ];

  useEffect(() => {
    fetchATRDocuments();
  }, []);

  useEffect(() => {
    fetchATRDocuments();
  }, [searchTerm, dateFilter, siteFilter]);

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

  const handleUploadATR = async () => {
    if (!uploadForm.siteName || !uploadForm.dateTime) {
      toast.error('Site name and date/time are required');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('siteName', uploadForm.siteName);
      formData.append('dateTime', uploadForm.dateTime);
      if (uploadForm.videoLink) formData.append('videoLink', uploadForm.videoLink);
      if (uploadForm.comment) formData.append('comment', uploadForm.comment);
      if (uploadForm.file) formData.append('pdf', uploadForm.file);

      await api.post('/uploaded-atr/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('ATR document uploaded successfully!');
      setShowUploadModal(false);
      setUploadForm({
        siteName: '',
        dateTime: '',
        videoLink: '',
        comment: '',
        file: null
      });
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
    fetchATRDocuments();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setSiteFilter('');
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm(prev => ({
        ...prev,
        file: e.target.files[0]
      }));
    }
  };

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
              placeholder="Search by site name, file name, or comment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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

            <button onClick={handleClearFilters} className="clear-filters-button">
              <Filter size={16} />
              Clear Filters
            </button>
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
        ) : atrDocuments.length === 0 ? (
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {atrDocuments.map((doc) => (
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
                          🎥 View Video
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
                          📄 View ATR
                        </button>
                      ) : (
                        <span className="no-link">No ATR</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button
                        onClick={() => handleViewATR(doc.atrLink)}
                        className="icon-button view"
                        title="View ATR Document"
                        disabled={!doc.atrLink}
                      >
                        <Eye size={18} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteATR(doc.id, doc.fileName || `ATR ${doc.serialNo}`)}
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload ATR Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="site-name">Site Name *</label>
                <select
                  id="site-name"
                  value={uploadForm.siteName}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, siteName: e.target.value }))}
                  required
                >
                  <option value="">Select a site...</option>
                  {sites.map(site => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="date-time">Date/Time *</label>
                <input
                  type="datetime-local"
                  id="date-time"
                  value={uploadForm.dateTime}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, dateTime: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="video-link">Video Link (Optional)</label>
                <input
                  type="url"
                  id="video-link"
                  value={uploadForm.videoLink}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, videoLink: e.target.value }))}
                  placeholder="https://example.com/video.mp4"
                />
              </div>

              <div className="form-group">
                <label htmlFor="atr-file">ATR PDF File (Optional)</label>
                <input
                  type="file"
                  id="atr-file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                />
                {uploadForm.file && (
                  <div className="file-selected">
                    📄 {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="comment">Comment (Optional)</label>
                <textarea
                  id="comment"
                  value={uploadForm.comment}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Add any comments about this ATR..."
                  rows={3}
                  maxLength={500}
                />
                <span className="char-count">{uploadForm.comment.length}/500</span>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowUploadModal(false)} 
                className="cancel-button"
                disabled={uploading}
              >
                Cancel
              </button>
              <button 
                onClick={handleUploadATR} 
                className="upload-button"
                disabled={uploading || !uploadForm.siteName || !uploadForm.dateTime}
              >
                {uploading ? (
                  <>
                    <div className="spinner-small"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload ATR
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadedATR;