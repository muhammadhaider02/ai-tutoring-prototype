import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Sparkles, ArrowLeft, Plus, FileText, Clock, Calendar, Check, Star, BarChart3 } from 'lucide-react';

function StudentLecturesPage() {
  const navigate = useNavigate();
  const { teacherId, studentId } = useParams();
  const location = useLocation();
  
  // Get student name from location state or use default
  const studentName = location.state?.studentName || 'Amna Ahmad';
  const studentInitial = studentName.charAt(0);
  const courseName = 'Advanced Mathematics';

  // Handle back button click
  const handleBackClick = () => {
    navigate(`/teacher/${teacherId}`);
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
          <button className="upload-button">
            <Plus size={16} />
            Upload Recording
          </button>
        </div>
        
        {/* Session Recording Entry - Updated Design */}
        <div className="recording-card">
          <div className="recording-main">
            {/* Left Side - Session Info */}
            <div className="recording-info">
              <div className="recording-icon-container">
                <FileText className="recording-icon" size={24} />
                <span className="notification-badge">1</span>
              </div>
              <div className="recording-title-container">
                <h3 className="recording-title">Introduction to Calculus – Session 1</h3>
                <div className="recording-metadata">
                  <div className="metadata-item">
                    <Clock size={14} />
                    <span>Duration: 45 min</span>
                  </div>
                  <div className="metadata-item">
                    <Calendar size={14} />
                    <span>Upload date: 15/01/2024</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Actions & Status - Reordered to move Processed to the right */}
            <div className="recording-actions">
              <div className="action-status-row">
                <div className="action-pills">
                  <button className="action-pill">
                    <FileText size={12} />
                    <span>Transcript</span>
                  </button>
                  <button className="action-pill">
                    <Star size={12} />
                    <span>AI Summary</span>
                  </button>
                  <button className="action-pill">
                    <BarChart3 size={12} />
                    <span>Quiz</span>
                  </button>
                </div>
                <button className="status-badge processed">
                  <Check size={14} />
                  <span>Processed</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Bottom Row - AI Feedback - In a single line now */}
          <div className="recording-feedback">
            <div className="feedback-inline">
              <span className="feedback-label">AI Feedback:</span>
              <p className="feedback-text">Excellent engagement with derivative concepts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentLecturesPage;
