import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Eye, Trash2, Upload } from 'lucide-react';
import UploadModal from '../components/UploadModal';
import DetailsModal from '../components/DetailsModal';
import '../styles/UploadATR.css';

const UploadATR = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.userType === 'admin' || user?.username === 'AEROVANIA MASTER';

  const departments = [
    'E&T Department',
    'Security Department',
    'Operation Department',
    'Survey Department',
    'Safety Department',
    'Admin',
    'Super Admin'
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchDocuments();
    }
  }, [selectedDepartment, isAdmin]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = isAdmin && selectedDepartment !== 'all'
        ? { department: selectedDepartment }
        : {};

      const response = await api.get('/atr/list', { params });
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

  const filteredDocuments = isAdmin && selectedDepartment !== 'all'
    ? documents.filter(doc => doc.department === selectedDepartment)
    : documents;

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleUpload = async ({ file, comment, hyperlink }) => {
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
      if (comment) formData.append('comment', comment);
      if (hyperlink) formData.append('hyperlink', hyperlink);

      await api.post('/atr/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('AI Report uploaded successfully!');
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
      const response = await api.get(`/atr/view/${documentId}`);
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
      await api.delete(`/atr/${documentId}`);
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
      await api.patch(`/atr/${documentId}/comment`, { comment });
      toast.success('Comment updated');
      fetchDocuments();
      // Update selected document
      const response = await api.get('/atr/list');
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
      await api.patch(`/atr/${documentId}/hyperlink`, { hyperlink });
      toast.success('Hyperlink updated');
      fetchDocuments();
      // Update selected document
      const response = await api.get('/atr/list');
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
      await api.patch(`/atr/${documentId}/comment`, { comment: '' });
      toast.success('Comment deleted');
      fetchDocuments();
      // Update selected document
      const response = await api.get('/atr/list');
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
      await api.patch(`/atr/${documentId}/hyperlink`, { hyperlink: '' });
      toast.success('Hyperlink deleted');
      fetchDocuments();
      // Update selected document
      const response = await api.get('/atr/list');
      const updatedDoc = response.data?.documents?.find(d => d.id === documentId);
      if (updatedDoc) {
        setSelectedDocument(updatedDoc);
      }
    } catch (error) {
      console.error('Delete hyperlink error:', error);
      toast.error('Failed to delete hyperlink');
    }
  };

  const handleUploadAiReport = async (documentId, file) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size must be less than 25MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      await api.post(`/atr/${documentId}/ai-report`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('AI Report PDF uploaded successfully!');
      fetchDocuments();
      // Update selected document
      const response = await api.get('/atr/list');
      const updatedDoc = response.data?.documents?.find(d => d.id === documentId);
      if (updatedDoc) {
        setSelectedDocument(updatedDoc);
      }
    } catch (error) {
      console.error('Upload AI Report error:', error);
      toast.error('Failed to upload AI Report');
    }
  };

  const handleViewAiReport = (aiReportUrl) => {
    if (aiReportUrl) {
      window.open(aiReportUrl, '_blank');
    }
  };

  const handleDeleteAiReport = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this AI Report?')) return;

    try {
      await api.delete(`/atr/${documentId}/ai-report`);
      toast.success('AI Report deleted');
      fetchDocuments();
      // Update selected document
      const response = await api.get('/atr/list');
      const updatedDoc = response.data?.documents?.find(d => d.id === documentId);
      if (updatedDoc) {
        setSelectedDocument(updatedDoc);
      }
    } catch (error) {
      console.error('Delete AI Report error:', error);
      toast.error('Failed to delete AI Report');
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
      day: 'numeric'
    });
  };

  return (
    <div className="upload-atr-container">
      <div className="upload-atr-header">
        <h1>AI Reports</h1>
        <p>Upload and manage AI-generated reports for {user?.department || (isAdmin ? 'Admin' : 'your department')}</p>
      </div>

      {/* Upload Button */}
      <div className="upload-button-section">
        <button 
          className="upload-file-button"
          onClick={() => setShowUploadModal(true)}
          disabled={uploading}
        >
          <Upload size={20} />
          Upload File
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
            <h2>AI Reports</h2>
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
            <h3>No AI reports found</h3>
            <p>Upload your first AI report to get started</p>
          </div>
        ) : (
          <div className="documents-table-wrapper">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Department</th>
                  <th>Uploaded By</th>
                  <th>Upload Date</th>
                  <th>File Size</th>
                  <th>Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.filter(doc => doc && doc.id).map((doc) => (
                  <tr key={doc.id}>
                    <td className="filename-cell">
                      <div className="file-info">
                        <span className="file-icon">📄</span>
                        <span className="filename">{doc.filename || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>{doc.department || 'N/A'}</td>
                    <td>{(doc.uploaded_by || 'Unknown').replace(/_/g, ' ')}</td>
                    <td>{doc.upload_date ? formatDate(doc.upload_date) : 'N/A'}</td>
                    <td>{doc.file_size ? formatFileSize(doc.file_size) : 'N/A'}</td>
                    
                    {/* Details Column with Badges */}
                    <td className="details-cell">
                      <div className="details-badges">
                        {doc.comment && <span className="badge comment-badge" title="Has comment">💬</span>}
                        {doc.ai_report_url && <span className="badge ai-report-badge" title="Has AI report">📊</span>}
                        {doc.hyperlink && <span className="badge hyperlink-badge" title="Has hyperlink">🔗</span>}
                        {!doc.comment && !doc.ai_report_url && !doc.hyperlink && <span className="no-details">-</span>}
                      </div>
                      <button
                        onClick={() => openDetailsModal(doc)}
                        className="details-button"
                        title="View/Edit Details"
                      >
                        <Eye size={16} />
                        <span>Details</span>
                      </button>
                    </td>

                    {/* Actions Column */}
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
        onUploadAiReport={handleUploadAiReport}
        onDeleteAiReport={handleDeleteAiReport}
        onViewAiReport={handleViewAiReport}
      />
    </div>
  );
};

export default UploadATR;
