import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Sparkles, ArrowLeft, FileText, Clock, Calendar, Check, BarChart3, MessageSquare } from 'lucide-react';

function StudentCourseVideosPage() {
  const navigate = useNavigate();
  const { studentId, courseId } = useParams();
  const location = useLocation();
  
  // Use Prof. Jaka Bavdek's name directly
  const studentName = 'Prof. Jaka Bavdek';
  const studentInitial = studentName.charAt(0);
  const courseName = location.state?.courseName || 'Advanced Mathematics';

  // Handle back button click
  const handleBackClick = () => {
    navigate(`/student-dashboard/${studentId}`);
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
              <p className="lectures-subtitle">Session Recordings</p>
            </div>
          </div>
          {/* Upload button removed */}
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
                  <button 
                    className="action-pill"
                    onClick={() => navigate(`/student/${studentId}/course/${courseId}/feedback`, { 
                      state: { studentName, courseName } 
                    })}
                  >
                    <MessageSquare size={12} />
                    <span>Feedback</span>
                  </button>
                  <button 
                    className="action-pill"
                    onClick={() => navigate(`/student/${studentId}/course/${courseId}/student-quiz`, { 
                      state: { studentName, courseName } 
                    })}
                  >
                    <BarChart3 size={12} />
                    <span>Quiz</span>
                  </button>
                </div>
                <button className="status-badge processed">
                  <Check size={14} />
                  <span>Completed</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* AI Feedback section removed */}
        </div>
      </div>
    </div>
  );
}

export default StudentCourseVideosPage;
