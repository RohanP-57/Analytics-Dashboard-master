import React, { useState, useEffect } from 'react';
import { X, Check, Edit2, Trash2, Eye, Upload, FileText, Link as LinkIcon } from 'lucide-react';

const DetailsModal = ({ 
  show, 
  document, 
  onClose, 
  onUpdateComment,
  onUpdateHyperlink,
  onDeleteComment,
  onDeleteHyperlink,
  onUploadAiReport,
  onDeleteAiReport,
  onViewAiReport
}) => {
  const [detailsModalComment, setDetailsModalComment] = useState('');
  const [detailsModalHyperlink, setDetailsModalHyperlink] = useState('');
  const [isEditingInModal, setIsEditingInModal] = useState({ comment: false, hyperlink: false });

  useEffect(() => {
    if (document) {
      setDetailsModalComment(document.comment || '');
      setDetailsModalHyperlink(document.hyperlink || '');
      setIsEditingInModal({ comment: false, hyperlink: false });
    }
  }, [document]);

  const handleUpdateComment = async () => {
    await onUpdateComment(document.id, detailsModalComment);
    setIsEditingInModal({ ...isEditingInModal, comment: false });
  };

  const handleUpdateHyperlink = async () => {
    await onUpdateHyperlink(document.id, detailsModalHyperlink);
    setIsEditingInModal({ ...isEditingInModal, hyperlink: false });
  };

  const handleDeleteComment = async () => {
    await onDeleteComment(document.id);
    setDetailsModalComment('');
  };

  const handleDeleteHyperlink = async () => {
    await onDeleteHyperlink(document.id);
    setDetailsModalHyperlink('');
  };

  const handleUploadAiReport = async (file) => {
    await onUploadAiReport(document.id, file);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!show || !document) return null;

  return (
    <div className="modal-overlay details-modal-overlay" onClick={onClose}>
      <div className="modal-content details-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 AI Report Details</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body details-modal-body">
          <div className="document-info-header">
            <h3>{document.filename}</h3>
            <p className="document-meta">
              {document.department} • {formatDate(document.upload_date)} • {formatFileSize(document.file_size)}
            </p>
          </div>

          {/* Comment Section */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h4>💬 Comment</h4>
            </div>
            <div className="detail-card-body">
              {document.comment ? (
                <>
                  {isEditingInModal.comment ? (
                    <div className="edit-section">
                      <textarea
                        value={detailsModalComment}
                        onChange={(e) => setDetailsModalComment(e.target.value)}
                        maxLength={500}
                        rows={4}
                        className="modal-textarea"
                        autoFocus
                      />
                      <span className="char-count">{detailsModalComment.length}/500</span>
                      <div className="edit-actions">
                        <button className="btn-save" onClick={handleUpdateComment}>
                          <Check size={16} /> Save
                        </button>
                        <button className="btn-cancel" onClick={() => {
                          setIsEditingInModal({ ...isEditingInModal, comment: false });
                          setDetailsModalComment(document.comment || '');
                        }}>
                          <X size={16} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="view-section">
                      <p className="detail-text">{document.comment}</p>
                      {document.canEdit && (
                        <div className="view-actions">
                          <button className="btn-edit" onClick={() => setIsEditingInModal({ ...isEditingInModal, comment: true })}>
                            <Edit2 size={16} /> Edit
                          </button>
                          <button className="btn-delete" onClick={handleDeleteComment}>
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-section">
                  {document.canEdit ? (
                    isEditingInModal.comment ? (
                      <div className="edit-section">
                        <textarea
                          value={detailsModalComment}
                          onChange={(e) => setDetailsModalComment(e.target.value)}
                          maxLength={500}
                          rows={4}
                          className="modal-textarea"
                          placeholder="Enter your comment..."
                          autoFocus
                        />
                        <span className="char-count">{detailsModalComment.length}/500</span>
                        <div className="edit-actions">
                          <button className="btn-save" onClick={handleUpdateComment}>
                            <Check size={16} /> Save
                          </button>
                          <button className="btn-cancel" onClick={() => {
                            setIsEditingInModal({ ...isEditingInModal, comment: false });
                            setDetailsModalComment('');
                          }}>
                            <X size={16} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="empty-text">No comment added</p>
                        <button className="btn-add" onClick={() => setIsEditingInModal({ ...isEditingInModal, comment: true })}>
                          <Edit2 size={16} /> Add Comment
                        </button>
                      </>
                    )
                  ) : (
                    <p className="empty-text">No comment</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Report Section */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h4>📊 AI Report PDF</h4>
            </div>
            <div className="detail-card-body">
              {document.ai_report_url ? (
                <div className="view-section">
                  <div className="file-preview">
                    <FileText size={32} className="file-icon-large" />
                    <p className="file-label">AI Report Available</p>
                  </div>
                  <div className="view-actions">
                    <button className="btn-view" onClick={() => onViewAiReport(document.ai_report_url)}>
                      <Eye size={16} /> View Report
                    </button>
                    {document.canEdit && (
                      <button className="btn-delete" onClick={() => onDeleteAiReport(document.id)}>
                        <Trash2 size={16} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-section">
                  {document.canEdit ? (
                    <>
                      <p className="empty-text">No AI report uploaded</p>
                      <label className="btn-add">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => e.target.files[0] && handleUploadAiReport(e.target.files[0])}
                          style={{ display: 'none' }}
                        />
                        <Upload size={16} /> Upload AI Report
                      </label>
                    </>
                  ) : (
                    <p className="empty-text">No AI report</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Hyperlink Section */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h4>🔗 Hyperlink</h4>
            </div>
            <div className="detail-card-body">
              {document.hyperlink ? (
                <>
                  {isEditingInModal.hyperlink ? (
                    <div className="edit-section">
                      <input
                        type="url"
                        value={detailsModalHyperlink}
                        onChange={(e) => setDetailsModalHyperlink(e.target.value)}
                        className="modal-input"
                        placeholder="https://..."
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button className="btn-save" onClick={handleUpdateHyperlink}>
                          <Check size={16} /> Save
                        </button>
                        <button className="btn-cancel" onClick={() => {
                          setIsEditingInModal({ ...isEditingInModal, hyperlink: false });
                          setDetailsModalHyperlink(document.hyperlink || '');
                        }}>
                          <X size={16} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="view-section">
                      <a 
                        href={document.hyperlink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hyperlink-display"
                      >
                        <LinkIcon size={16} />
                        <span className="hyperlink-text">{document.hyperlink}</span>
                      </a>
                      {document.canEdit && (
                        <div className="view-actions">
                          <button className="btn-edit" onClick={() => setIsEditingInModal({ ...isEditingInModal, hyperlink: true })}>
                            <Edit2 size={16} /> Edit
                          </button>
                          <button className="btn-delete" onClick={handleDeleteHyperlink}>
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-section">
                  {document.canEdit ? (
                    isEditingInModal.hyperlink ? (
                      <div className="edit-section">
                        <input
                          type="url"
                          value={detailsModalHyperlink}
                          onChange={(e) => setDetailsModalHyperlink(e.target.value)}
                          className="modal-input"
                          placeholder="https://drive.google.com/..."
                          autoFocus
                        />
                        <div className="edit-actions">
                          <button className="btn-save" onClick={handleUpdateHyperlink}>
                            <Check size={16} /> Save
                          </button>
                          <button className="btn-cancel" onClick={() => {
                            setIsEditingInModal({ ...isEditingInModal, hyperlink: false });
                            setDetailsModalHyperlink('');
                          }}>
                            <X size={16} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="empty-text">No hyperlink added</p>
                        <button className="btn-add" onClick={() => setIsEditingInModal({ ...isEditingInModal, hyperlink: true })}>
                          <LinkIcon size={16} /> Add Hyperlink
                        </button>
                      </>
                    )
                  ) : (
                    <p className="empty-text">No hyperlink</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-close-modal" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;
