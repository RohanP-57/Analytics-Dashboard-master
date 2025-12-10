import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Eye, Trash2, Upload, Link as LinkIcon, Edit2, X, Check, FileText } from 'lucide-react';
import './UploadATR.css';

const UploadATR = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadComment, setUploadComment] = useState('');
  const [uploadHyperlink, setUploadHyperlink] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editingHyperlink, setEditingHyperlink] = useState(null);
  const [editValues, setEditValues] = useState({});

  const isAdmin = user?.role === 'admin' || user?.userType === 'admin' || user?.username === 'AEROVANIA MASTER';

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

  const departments = [
    'E&T Department',
    'Security Department',
    'Operation Department',
    'Survey Department',
    'Safety Department',
    'Admin',
    'Super Admin'
  ];

  const filteredDocuments = isAdmin && selectedDepartment !== 'all'
    ? documents.filter(doc => doc.department === selectedDepartment)
    : documents;

  // Modal drag and drop handlers
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
      setUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a PDF file');
      return;
    }

    if (uploadFile.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    if (uploadFile.size > 25 * 1024 * 1024) {
      toast.error('File size must be less than 25MB');
      return;
    }

    // Validate hyperlink if provided
    if (uploadHyperlink && !isValidUrl(uploadHyperlink)) {
      toast.error('Please enter a valid URL for the hyperlink');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('pdf', uploadFile);
      if (uploadComment) formData.append('comment', uploadComment);
      if (uploadHyperlink) formData.append('hyperlink', uploadHyperlink);

      await api.post('/atr/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('AI Report uploaded successfully!');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadComment('');
      setUploadHyperlink('');
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

  const handleUpdateComment = async (documentId) => {
    try {
      const comment = editValues[`comment_${documentId}`] || '';
      await api.patch(`/atr/${documentId}/comment`, { comment });
      toast.success('Comment updated');
      setEditingComment(null);
      fetchDocuments();
    } catch (error) {
      console.error('Update comment error:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleUpdateHyperlink = async (documentId) => {
    try {
      const hyperlink = editValues[`hyperlink_${documentId}`] || '';
      
      if (hyperlink && !isValidUrl(hyperlink)) {
        toast.error('Please enter a valid URL');
        return;
      }

      await api.patch(`/atr/${documentId}/hyperlink`, { hyperlink });
      toast.success('Hyperlink updated');
      setEditingHyperlink(null);
      fetchDocuments();
    } catch (error) {
      console.error('Update hyperlink error:', error);
      toast.error('Failed to update hyperlink');
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

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
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
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload AI Report</h2>
              <button 
                className="modal-close"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {/* File Drop Zone */}
              <div
                className={`modal-dropzone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploadFile ? (
                  <div className="file-selected">
                    <FileText size={48} />
                    <p className="file-name">{uploadFile.name}</p>
                    <p className="file-size">{formatFileSize(uploadFile.size)}</p>
                    <button 
                      className="change-file-button"
                      onClick={() => setUploadFile(null)}
                    >
                      Change File
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="upload-icon">📄</div>
                    <h3>Drop PDF file here or click to browse</h3>
                    <p>Maximum file size: 25MB</p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="file-input"
                      id="modal-file-input"
                    />
                    <label htmlFor="modal-file-input" className="browse-button">
                      Browse Files
                    </label>
                  </>
                )}
              </div>

              {/* Comment Field */}
              <div className="form-group">
                <label htmlFor="upload-comment">Comment (Optional)</label>
                <textarea
                  id="upload-comment"
                  value={uploadComment}
                  onChange={(e) => setUploadComment(e.target.value)}
                  placeholder="Add a comment about this report..."
                  maxLength={500}
                  rows={3}
                />
                <span className="char-count">{uploadComment.length}/500</span>
              </div>

              {/* Hyperlink Field */}
              <div className="form-group">
                <label htmlFor="upload-hyperlink">Hyperlink (Optional)</label>
                <input
                  type="url"
                  id="upload-hyperlink"
                  value={uploadHyperlink}
                  onChange={(e) => setUploadHyperlink(e.target.value)}
                  placeholder="https://drive.google.com/..."
                />
                <span className="field-hint">Google Drive link or any URL</span>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-button"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Cancel
              </button>
              <button 
                className="upload-button"
                onClick={handleUpload}
                disabled={uploading || !uploadFile}
              >
                {uploading ? (
                  <>
                    <div className="spinner-small"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <th>Comment</th>
                  <th>AI Report</th>
                  <th>Hyperlink</th>
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
                    
                    {/* Comment Column */}
                    <td className="comment-cell">
                      {editingComment === doc.id ? (
                        <div className="edit-field">
                          <input
                            type="text"
                            value={editValues[`comment_${doc.id}`] ?? doc.comment ?? ''}
                            onChange={(e) => setEditValues({...editValues, [`comment_${doc.id}`]: e.target.value})}
                            maxLength={500}
                            autoFocus
                          />
                          <button 
                            className="icon-button save"
                            onClick={() => handleUpdateComment(doc.id)}
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            className="icon-button cancel"
                            onClick={() => setEditingComment(null)}
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="view-field">
                          <span className="field-value">{doc.comment || '-'}</span>
                          {doc.canEdit && (
                            <button 
                              className="icon-button edit"
                              onClick={() => {
                                setEditingComment(doc.id);
                                setEditValues({...editValues, [`comment_${doc.id}`]: doc.comment || ''});
                              }}
                              title="Edit comment"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* AI Report Column */}
                    <td className="ai-report-cell">
                      {doc.ai_report_url ? (
                        <button 
                          className="icon-button view"
                          onClick={() => handleViewAiReport(doc.ai_report_url)}
                          title="View AI Report"
                        >
                          <Eye size={18} />
                        </button>
                      ) : doc.canEdit ? (
                        <label className="upload-ai-report-label">
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => e.target.files[0] && handleUploadAiReport(doc.id, e.target.files[0])}
                            style={{ display: 'none' }}
                          />
                          <Upload size={18} />
                        </label>
                      ) : (
                        <span>-</span>
                      )}
                    </td>

                    {/* Hyperlink Column */}
                    <td className="hyperlink-cell">
                      {editingHyperlink === doc.id ? (
                        <div className="edit-field">
                          <input
                            type="url"
                            value={editValues[`hyperlink_${doc.id}`] ?? doc.hyperlink ?? ''}
                            onChange={(e) => setEditValues({...editValues, [`hyperlink_${doc.id}`]: e.target.value})}
                            placeholder="https://..."
                            autoFocus
                          />
                          <button 
                            className="icon-button save"
                            onClick={() => handleUpdateHyperlink(doc.id)}
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            className="icon-button cancel"
                            onClick={() => setEditingHyperlink(null)}
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="view-field">
                          {doc.hyperlink ? (
                            <a 
                              href={doc.hyperlink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hyperlink-icon"
                              title={doc.hyperlink}
                            >
                              <LinkIcon size={18} />
                            </a>
                          ) : (
                            <span>-</span>
                          )}
                          {doc.canEdit && (
                            <button 
                              className="icon-button edit"
                              onClick={() => {
                                setEditingHyperlink(doc.id);
                                setEditValues({...editValues, [`hyperlink_${doc.id}`]: doc.hyperlink || ''});
                              }}
                              title="Edit hyperlink"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
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
    </div>
  );
};

export default UploadATR;
