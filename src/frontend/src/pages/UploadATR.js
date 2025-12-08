import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './UploadATR.css';

const UploadATR = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchDocuments();
    }
  }, [selectedDepartment]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = isAdmin && selectedDepartment !== 'all' 
        ? { department: selectedDepartment } 
        : {};
      
      const response = await api.get('/api/atr/list', { params });
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

  const isAdmin = user?.role === 'admin' || user?.userType === 'admin';
  
  const departments = [
    'E&T Department',
    'Security Department', 
    'Operation Department',
    'Survey Department',
    'Safety Department'
  ];

  const filteredDocuments = isAdmin && selectedDepartment !== 'all' 
    ? documents.filter(doc => doc.department === selectedDepartment)
    : documents;

  const getDepartmentColor = (department) => {
    const colors = {
      'E&T Department': '#3b82f6',
      'Security Department': '#ef4444', 
      'Operation Department': '#10b981',
      'Survey Department': '#f59e0b',
      'Safety Department': '#8b5cf6'
    };
    return colors[department] || '#6b7280';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await api.post('/api/atr/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('ATR document uploaded successfully!');
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (documentId) => {
    try {
      const response = await api.get(`/api/atr/view/${documentId}`);
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
      await api.delete(`/api/atr/${documentId}`);
      toast.success('Document deleted successfully');
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  return (
    <div className="upload-atr-container">
      <div className="upload-atr-header">
        <h1>Upload ATR Documents</h1>
        <p>Upload and manage ATR (Accident/Incident Report) documents for {user?.department || 'your department'}</p>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <div 
          className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="upload-progress">
              <div className="spinner"></div>
              <p>Uploading document...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📄</div>
              <h3>Drop PDF files here or click to browse</h3>
              <p>Maximum file size: 10MB</p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="file-input"
                disabled={uploading}
              />
              <button className="browse-button" disabled={uploading}>
                Browse Files
              </button>
            </>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div className="documents-section">
        <div className="documents-header">
          <div className="header-left">
            <h2>ATR Documents</h2>
            {isAdmin && (
              <span className="admin-badge">👑 Admin View</span>
            )}
          </div>
          <div className="header-right">
            {isAdmin && (
              <select 
                value={selectedDepartment} 
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="department-filter"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            )}
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
            <h3>No ATR documents found</h3>
            <p>Upload your first ATR document to get started</p>
          </div>
        ) : (
          <div className="documents-table">
            <table>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Department</th>
                  <th>Uploaded By</th>
                  <th>Upload Date</th>
                  <th>File Size</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.filter(doc => doc && doc.id).map((doc) => (
                  <tr key={doc.id || Math.random()}>
                    <td className="filename-cell">
                      <div className="file-info">
                        <span className="file-icon">📄</span>
                        <span className="filename">{doc.filename || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="department-badge" 
                        style={{ backgroundColor: getDepartmentColor(doc.department) }}
                      >
                        {doc.department || 'N/A'}
                      </span>
                    </td>
                    <td>{doc.uploaded_by || 'Unknown'}</td>
                    <td>{doc.upload_date ? formatDate(doc.upload_date) : 'N/A'}</td>
                    <td>{doc.file_size ? formatFileSize(doc.file_size) : 'N/A'}</td>
                    <td className="actions-cell">
                      <button
                        onClick={() => handleView(doc.id)}
                        className="action-button view-button"
                        title="View PDF"
                        disabled={!doc.id}
                      >
                        👁️ View
                      </button>
                      {doc.canDelete && (
                        <button
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          className="action-button delete-button"
                          title="Delete PDF"
                          disabled={!doc.id}
                        >
                          🗑️ Delete
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

export default UploadATR;