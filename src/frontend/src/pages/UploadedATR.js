import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Eye, Trash2, Search, Filter } from 'lucide-react';
import '../styles/UploadATR.css';

const UploadedATR = () => {
  const { user } = useAuth();
  const [atrDocuments, setAtrDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');

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

    </div>
  );
};

export default UploadedATR;