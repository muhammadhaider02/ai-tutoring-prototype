import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Sparkles, ArrowLeft, Plus, FileText, Clock, Calendar, Check, Star, BarChart3, Upload, RefreshCw, AlertCircle, School } from 'lucide-react';
import { uploadSessionVideo, getProcessingStatus, getSessionResult, getSessionsList } from '../lib/services';

function TeacherCourseVideoPage() {
  const navigate = useNavigate();
  const { teacherId, studentId } = useParams();
  const location = useLocation();
  
  // Get student name from location state or use default
  const studentName = location.state?.studentName || 'Amna Ahmad';
  const studentInitial = studentName.charAt(0);
  const courseName = 'Advanced Mathematics';

  // State for file upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState({
    teacherId: teacherId || '',
    studentId: studentId || '',
    courseId: courseName,
    sessionId: '',
  });
  const [processingStatus, setProcessingStatus] = useState({
    transcription: false,
    storing: false,
    summary: false,
    quiz: false,
    evaluation: false,
  });
  const [pollingInterval, setPollingInterval] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, [teacherId, studentId, courseName]);
  
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const sessionsData = await getSessionsList({
        teacherId: teacherId || '',
        studentId: studentId || '',
        courseId: courseName
      });
      
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Handle back button click
  const handleBackClick = () => {
    navigate(`/teacher/${teacherId}`);
  };

  // Open upload modal
  const openUploadModal = () => {
    setShowUploadModal(true);
  };

  // Close upload modal
  const closeUploadModal = () => {
    setShowUploadModal(false);
    setFile(null);
    setError(null);
    setSessionData({
      teacherId: teacherId || '',
      studentId: studentId || '',
      courseId: courseName,
      sessionId: '',
    });
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSessionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate form data - remove sessionName check
  const validateForm = () => {
    const { sessionId } = sessionData;
    if (!sessionId) {
      setError('Session ID is required');
      return false;
    }
    if (!file) {
      setError('Please select a file to upload');
      return false;
    }
    return true;
  };

  // Upload and process the file
  const handleUpload = async () => {
    if (!validateForm()) return;

    try {
      setUploading(true);
      setProcessingStatus({
        transcription: false,
        storing: false,
        summary: false,
        quiz: false,
        evaluation: false,
      });
      setError(null);

      // Upload the file to the backend
      const uploadResponse = await uploadSessionVideo(file, {
        teacherId: sessionData.teacherId,
        studentId: sessionData.studentId,
        courseId: sessionData.courseId,
        sessionId: sessionData.sessionId,
        sessionDate: new Date().toISOString()
      });

      if (uploadResponse.error) {
        throw new Error(uploadResponse.error);
      }

      // File uploaded, now poll for processing status
      setUploading(false);
      setProcessing(true);
      
      // Start polling for status
      const interval = setInterval(async () => {
        try {
          const statusResponse = await getProcessingStatus({
            teacherId: sessionData.teacherId,
            studentId: sessionData.studentId,
            courseId: sessionData.courseId,
            sessionId: sessionData.sessionId,
          });
          
          setProcessingStatus(statusResponse);
          
          // If all processing is complete
          if (statusResponse.transcription && statusResponse.storing && 
              statusResponse.summary && statusResponse.quiz && statusResponse.evaluation) {
            clearInterval(interval);
            setPollingInterval(null);
            setProcessing(false);
            
            // Refresh sessions list to include the new session
            await fetchSessions();
            closeUploadModal();
          }
        } catch (error) {
          console.error('Error checking processing status:', error);
        }
      }, 5000); // Check every 5 seconds
      
      setPollingInterval(interval);
      
      // Cleanup the interval after 10 minutes to prevent infinite polling
      setTimeout(() => {
        if (interval) {
          clearInterval(interval);
          setPollingInterval(null);
          if (processing) {
            setProcessing(false);
            setError('Processing timed out. The session may still be processing in the background.');
          }
        }
      }, 10 * 60 * 1000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
      setProcessing(false);
      setError(error.message || 'An error occurred during upload');
    }
  };

  return (
    <div className="dashboard-page">
      {/* Top Navigation Bar */}
      <div className="dashboard-navbar">
        <div className="navbar-left">
          {/* Back button */}
          <button className="icon-button" onClick={handleBackClick}>
            <ArrowLeft size={20} />
          </button>
          
          {/* Logo and Brand */}
          <div className="sessions-logo" style={{ marginLeft: '1rem' }}>
            <div className="logo-icon">
              <Sparkles className="logo-icon-svg" size={24} />
            </div>
            <h1 className="logo-text">Sessions</h1>
          </div>
        </div>

        {/* Student Info - Removed avatar */}
        <div className="user-controls">
          {/* Name and role */}
          <div className="user-info">
            <span className="user-name">{studentName}</span>
            <span className="user-role">{courseName}</span>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="dashboard-content">
        {/* Main Section Header - With avatar added beside student name */}
        <div className="lectures-header">
          <div className="lectures-header-title-with-avatar">
            {/* Avatar moved from navbar to here */}
            <div className="student-initial lectures-avatar">
              {studentInitial}
            </div>
            <div>
              <h1 className="lectures-title-smaller">{studentName}</h1>
              <p className="lectures-subtitle">Session Recordings & AI Analysis</p>
            </div>
          </div>
          <button className="upload-button" onClick={openUploadModal}>
            <Plus size={16} />
            Upload Recording
          </button>
        </div>
        
        {/* Loading state */}
        {loading && <div className="loading-message">Loading sessions...</div>}
        
        {/* Empty state */}
        {!loading && sessions.length === 0 && (
          <div className="empty-state">
            <p>No sessions found. Upload your first recording to get started.</p>
          </div>
        )}
        
        {/* Session Recordings List */}
        {sessions.map(session => (
          <div className="recording-card" key={session.id}>
            <div className="recording-main">
              {/* Left Side - Session Info */}
              <div className="recording-info">
                <div className="recording-icon-container">
                  <FileText className="recording-icon" size={24} />
                  <span className="notification-badge">{session.id}</span>
                </div>
                <div className="recording-title-container">
                  <h3 className="recording-title">{session.title}</h3>
                  <div className="recording-metadata">
                    <div className="metadata-item">
                      <Calendar size={14} />
                      <span>Upload date: {session.date}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Actions & Status */}
              <div className="recording-actions">
                <div className="action-status-row">
                  <div className="action-pills">
                    <button 
                      className="action-pill"
                      onClick={() => navigate(`/teacher/${teacherId}/student/${studentId}/ai-summary`, { 
                        state: { studentName, courseName, sessionId: session.id } 
                      })}
                    >
                      <Star size={12} />
                      <span>AI Summary</span>
                    </button>
                    <button 
                      className="action-pill"
                      onClick={() => navigate(`/teacher/${teacherId}/student/${studentId}/quiz`, { 
                        state: { studentName, courseName, sessionId: session.id } 
                      })}
                    >
                      <BarChart3 size={12} />
                      <span>Quiz</span>
                    </button>
                  </div>
                  <button className={`status-badge ${session.processed ? 'processed' : 'processing'}`}>
                    <Check size={14} />
                    <span>{session.processed ? 'Processed' : 'Processing'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-title">
                <Upload size={20} className="modal-icon" />
                <h2>Upload New Recording</h2>
              </div>
              <button className="close-button" onClick={closeUploadModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Session ID</label>
                <input 
                  type="text" 
                  name="sessionId" 
                  value={sessionData.sessionId} 
                  onChange={handleInputChange}
                  placeholder="e.g., 2"
                />
              </div>
              
              <div className="form-group">
                <label>Course</label>
                <div className="course-display">
                  <School size={16} />
                  <span>{sessionData.courseId}</span>
                </div>
              </div>
              
              <div className="form-group">
                <label>Video File</label>
                <div className="file-input-container">
                  <input 
                    type="file" 
                    id="video-upload"
                    onChange={handleFileChange}
                    accept="video/*, audio/*"
                    className="file-input"
                  />
                  <label htmlFor="video-upload" className="file-input-label">
                    <Upload size={16} />
                    Choose File
                  </label>
                  {file && (
                    <div className="file-preview">
                      <FileText size={14} />
                      <span className="file-name">{file.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              {/* Processing Status */}
              {(uploading || processing) && (
                <div className="processing-status">
                  <h3>Processing Status</h3>
                  
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Object.values(processingStatus).filter(Boolean).length * 20}%` 
                      }}
                    ></div>
                  </div>
                  
                  <div className="status-items">
                    <div className="status-item">
                      <span>Transcription</span> 
                      <span className={processingStatus.transcription ? 'completed' : 'pending'}>
                        {processingStatus.transcription ? <Check size={16} /> : '⋯'}
                      </span>
                    </div>
                    <div className="status-item">
                      <span>Storing</span> 
                      <span className={processingStatus.storing ? 'completed' : 'pending'}>
                        {processingStatus.storing ? <Check size={16} /> : '⋯'}
                      </span>
                    </div>
                    <div className="status-item">
                      <span>Summary</span> 
                      <span className={processingStatus.summary ? 'completed' : 'pending'}>
                        {processingStatus.summary ? <Check size={16} /> : '⋯'}
                      </span>
                    </div>
                    <div className="status-item">
                      <span>Quiz</span> 
                      <span className={processingStatus.quiz ? 'completed' : 'pending'}>
                        {processingStatus.quiz ? <Check size={16} /> : '⋯'}
                      </span>
                    </div>
                    <div className="status-item">
                      <span>Evaluation</span> 
                      <span className={processingStatus.evaluation ? 'completed' : 'pending'}>
                        {processingStatus.evaluation ? <Check size={16} /> : '⋯'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button" 
                onClick={closeUploadModal}
                disabled={uploading || processing}
              >
                Cancel
              </button>
              <button 
                className="upload-button" 
                onClick={handleUpload}
                disabled={uploading || processing}
              >
                {uploading ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    Uploading...
                  </>
                ) : processing ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload & Process
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for the new components */}
      <style jsx>{`
        .loading-message, .empty-state {
          text-align: center;
          padding: 2rem;
          color: var(--muted);
          background: var(--card);
          border: 1px solid var(--card-border);
          border-radius: var(--radius);
          margin-bottom: 1rem;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(3px);
        }
        
        .modal-container {
          background: var(--card);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          width: 550px;
          max-width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
          animation: modal-appear 0.3s ease-out;
          backdrop-filter: blur(12px);
        }
        
        @keyframes modal-appear {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--card-border);
        }
        
        .modal-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .modal-icon {
          color: #4285f4;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--muted);
          height: 32px;
          width: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        
        .close-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .modal-body {
          padding: 24px;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid var(--card-border);
          gap: 12px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text);
        }
        
        .form-group input[type="text"] {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--card-border);
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.3s;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text);
        }
        
        .form-group input[type="text"]:focus {
          border-color: #4285f4;
          outline: none;
          box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.1);
        }
        
        .course-display {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
        }
        
        .file-input-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .file-input {
          position: absolute;
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
          overflow: hidden;
          z-index: -1;
        }
        
        .file-input-label {
          background-color: rgba(255, 255, 255, 0.05);
          color: var(--text);
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px dashed var(--card-border);
          transition: all 0.2s;
          width: fit-content;
        }
        
        .file-input-label:hover {
          background-color: rgba(59, 130, 246, 0.1);
          border-color: #4285f4;
          color: #4285f4;
        }
        
        .file-preview {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          background-color: rgba(59, 130, 246, 0.1);
          border-radius: 8px;
          font-size: 14px;
          color: #4285f4;
          margin-top: 5px;
        }
        
        .file-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 250px;
        }
        
        .error-message {
          color: #e53935;
          margin-top: 16px;
          padding: 12px 16px;
          background-color: rgba(229, 57, 53, 0.08);
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }
        
        .cancel-button {
          padding: 10px 18px;
          background-color: rgba(255, 255, 255, 0.05);
          color: var(--text);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
          font-size: 14px;
          font-weight: 500;
        }
        
        .cancel-button:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .upload-button {
          padding: 10px 18px;
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .upload-button:hover:not(:disabled) {
          background-color: #3367d6;
        }
        
        .upload-button:disabled, .cancel-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .spinning {
          animation: spin 1.5s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .processing-status {
          margin-top: 24px;
          padding: 16px;
          background-color: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          border: 1px solid var(--card-border);
        }
        
        .processing-status h3 {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 16px;
          font-weight: 500;
          color: var(--text);
        }
        
        .progress-bar {
          height: 6px;
          width: 100%;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          margin-bottom: 16px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background-color: #4285f4;
          transition: width 0.5s ease-out;
        }
        
        .status-items {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .completed {
          color: #34a853;
          font-weight: 500;
          display: flex;
          align-items: center;
        }
        
        .pending {
          color: #fbbc05;
        }

        /* Reduce card height by adjusting padding and margins */
        .recording-card {
          padding: 0.75rem 1.25rem;
          margin-bottom: 1rem;
        }
        
        .recording-main {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}

export default TeacherCourseVideoPage;
