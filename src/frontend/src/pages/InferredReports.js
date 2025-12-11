import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Eye, Trash2, Upload, Search, Filter } from 'lucide-react';
import UploadModal from '../components/UploadModal';
import DetailsModal from '../components/DetailsModal';
import '../styles/UploadATR.css';

const InferredReports = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedSite, setSelectedSite] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.userType === 'admin' || user?.username === 'AEROVANIA MASTER';

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
    fetchDocuments();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [selectedSite, searchTerm]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      
      // Add filters to params
      if (selectedSite !== 'all') {
        params.site = selectedSite;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await api.get('/inferred-reports/list', { params });
      const documentsData = response.data?.documents || [];
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDocuments();
  };

  const handleClearFilters = () => {
    setSelectedSite('all');
    setSearchTerm('');
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleUpload = async ({ file, siteName, comment, hyperlink }) => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size must be less than 25MB');
      return;
    }

    if (hyperlink && !isValidUrl(hyperlink)) {
      toast.error('Please enter a valid URL for the hyperlink');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('pdf', file);
      if (siteName) formData.append('siteName', siteName);
      if (comment) formData.append('comment', comment);
      if (hyperlink) formData.append('hyperlink', hyperlink);

      await api.post('/inferred-reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Inferred Report uploaded successfully!');
      setShowUploadModal(false);
      fetchDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload document';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (documentId) => {
    try {
      const response = await api.get(`/inferred-reports/view/${documentId}`);
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error('View error:', error);
      toast.error('Failed to open document');
    }
  };

  const handleDelete = async (documentId, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      await api.delete(`/inferred-reports/${documentId}`);
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete document');
    }
  };

  const openDetailsModal = (doc) => {
    setSelectedDocument(doc);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedDocument(null);
  };

  const handleUpdateComment = async (documentId, comment) => {
    try {
      await api.patch(`/inferred-reports/${documentId}/comment`, { comment });
      toast.success('Comment updated');
      fetchDocuments();
      const response = await api.get('/inferred-reports/list');
      const updatedDoc = response.data?.documents?.find(d => d.id === documentId);
      if (updatedDoc) {
        setSelectedDocument(updatedDoc);
      }
    } catch (error) {
      console.error('Update comment error:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleUpdateHyperlink = async (documentId, hyperlink) => {
    if (hyperlink && !isValidUrl(hyperlink)) {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
      await api.patch(`/inferred-reports/${documentId}/hyperlink`, { hyperlink });
      toast.success('Hyperlink updated');
      fetchDocuments();
      const response = await api.get('/inferred-reports/list');
      const updatedDoc = response.data?.documents?.find(d => d.id === documentId);
      if (updatedDoc) {
        setSelectedDocument(updatedDoc);
      }
    } catch (error) {
      console.error('Update hyperlink error:', error);
      toast.error('Failed to update hyperlink');
    }
  };

  const handleDeleteComment = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.patch(`/inferred-reports/${documentId}/comment`, { comment: '' });
      toast.success('Comment deleted');
      fetchDocuments();
      const response = await api.get('/inferred-reports/list');
      const updatedDoc = response.data?.documents?.find(d => d.id === documentId);
      if (updatedDoc) {
        setSelectedDocument(updatedDoc);
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleDeleteHyperlink = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this hyperlink?')) return;

    try {
      await api.patch(`/inferred-reports/${documentId}/hyperlink`, { hyperlink: '' });
      toast.success('Hyperlink deleted');
      fetchDocuments();
      const response = await api.get('/inferred-reports/list');
      const updatedDoc = response.data?.documents?.find(d => d.id === documentId);
      if (updatedDoc) {
        setSelectedDocument(updatedDoc);
      }
    } catch (error) {
      console.error('Delete hyperlink error:', error);
      toast.error('Failed to delete hyperlink');
    }
  };

  const handleUploadAtr = async (documentId, file, site, department, comment) => {
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('siteName', site);
      formData.append('department', department);
      if (comment) formData.append('comment', comment);

      await api.post(`/inferred-reports/${documentId}/upload-atr`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('ATR uploaded successfully!');
      closeDetailsModal();
      fetchDocuments();
    } catch (error) {
      console.error('Upload ATR error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload ATR';
      toast.error(errorMessage);
      throw error;
    }
  };

  return (
    <div className="upload-atr-container">
      <div className="upload-atr-header">
        <h1>Inferred Reports</h1>
        <p>Upload and manage inferred reports for {user?.department || (isAdmin ? 'Admin' : 'your department')}</p>
      </div>

      {/* Filters and Search Section */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by filename, site, or comment..."
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
              <label>Site Filter:</label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="site-filter"
              >
                <option value="all">All Sites</option>
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
          Upload Inferred Report
        </button>
      </div>

      {/* Upload Modal */}
      <UploadModal
        showModal={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
        uploading={uploading}
      />

      {/* Documents List */}
      <div className="documents-section">
        <div className="documents-header">
          <div className="header-left">
            <h2>Inferred Reports</h2>
            {isAdmin && (
              <span className="admin-badge">👑 Admin View</span>
            )}
          </div>
          <div className="header-right">
            <button onClick={fetchDocuments} className="refresh-button" disabled={loading}>
              {loading ? '🔄' : '↻'} Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading documents...</p>
          </div>
        ) : !Array.isArray(documents) || documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>No inferred reports found</h3>
            <p>Upload your first inferred report to get started</p>
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
                {documents.filter(doc => doc && doc.id).map((doc, index) => (
                  <tr key={doc.id}>
                    <td>{index + 1}</td>
                    <td>{doc.site_name || 'N/A'}</td>
                    <td>{doc.upload_date ? new Date(doc.upload_date).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}</td>
                    <td className="video-link-cell">
                      {doc.hyperlink ? (
                        <a 
                          href={doc.hyperlink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="video-link"
                          title="Open video link"
                        >
                          🔗 Link
                        </a>
                      ) : (
                        <span className="no-link">-</span>
                      )}
                    </td>
                    <td className="upload-atr-cell">
                      <button
                        onClick={() => openDetailsModal(doc)}
                        className="upload-atr-button"
                        title="Upload ATR Document"
                      >
                        <Upload size={16} />
                        <span>Upload ATR</span>
                      </button>
                    </td>
                    <td className="actions-cell">
                      <button
                        onClick={() => handleView(doc.id)}
                        className="icon-button view"
                        title="View Document"
                      >
                        <Eye size={18} />
                      </button>
                      {doc.canDelete && (
                        <button
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          className="icon-button delete"
                          title="Delete Document"
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

      {/* Details Modal */}
      <DetailsModal
        show={showDetailsModal}
        document={selectedDocument}
        onClose={closeDetailsModal}
        onUpdateComment={handleUpdateComment}
        onUpdateHyperlink={handleUpdateHyperlink}
        onDeleteComment={handleDeleteComment}
        onDeleteHyperlink={handleDeleteHyperlink}
        onUploadAtr={handleUploadAtr}
      />
    </div>
  );
};

export default InferredReports;