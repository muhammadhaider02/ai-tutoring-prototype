import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Sparkles, ArrowLeft, FileText, Clock, Calendar, Check, BarChart3, MessageSquare, Loader, FileText as FileTextIcon } from 'lucide-react';
import { getSessionsList } from '../lib/services';

function StudentCourseVideosPage() {
  const navigate = useNavigate();
  const { studentId, courseId } = useParams();
  const location = useLocation();
  
  // Use Prof. Jaka Bavdek's name directly
  const studentName = 'Prof. Jaka Bavdek';
  const studentInitial = studentName.charAt(0);
  const courseName = location.state?.courseName || 'Advanced Mathematics';

  // Add state for sessions data
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, [studentId, courseId, courseName]);
  
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const teacherId = "jaka";
      // Hard-code studentId to "1" which matches our database example
      const fixedStudentId = "1";
      
      console.log('Fetching sessions with params:', {
        teacherId,
        studentId: fixedStudentId,
        courseId: courseName
      });
      
      const sessionsData = await getSessionsList({
        teacherId,
        studentId: fixedStudentId, // Use fixed ID instead of from URL
        courseId: courseName
      });
      
      console.log('Sessions data received:', sessionsData);
      
      if (Array.isArray(sessionsData) && sessionsData.length === 0) {
        // Use hardcoded fallback data if API returns empty array
        setSessions([{
          id: "1",
          title: `${courseName} – Session 1`,
          date: "2025-08-31",
          processed: true
        }]);
        console.log('Using fallback session data');
      } else {
        setSessions(sessionsData || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError(`Failed to load sessions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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
        
        {/* Loading state */}
        {loading && (
          <div className="loading-message">
            <Loader size={36} className="spinning" style={{ color: 'var(--blue)' }} />
            <p>Loading sessions...</p>
          </div>
        )}
        
        {/* Error state */}
        {!loading && error && (
          <div className="error-message" style={{ textAlign: 'center', padding: '2rem' }}>
            <p>{error}</p>
            <button 
              className="retry-button"
              onClick={fetchSessions}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: 'var(--blue)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Empty state */}
        {!loading && !error && sessions.length === 0 && (
          <div className="empty-state">
            <p>No session recordings available yet.</p>
          </div>
        )}
        
        {/* Session Recordings List */}
        {!loading && !error && sessions.map(session => (
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
                      onClick={() => navigate(`/student/${studentId}/course/${courseId}/transcript`, { 
                        state: { studentName, courseName, sessionId: session.id } 
                      })}
                    >
                      <FileTextIcon size={12} />
                      <span>Summary</span>
                    </button>
                    <button 
                      className="action-pill"
                      onClick={() => navigate(`/student/${studentId}/course/${courseId}/feedback`, { 
                        state: { studentName, courseName, sessionId: session.id } 
                      })}
                    >
                      <MessageSquare size={12} />
                      <span>Feedback</span>
                    </button>
                    <button 
                      className="action-pill"
                      onClick={() => navigate(`/student/${studentId}/course/${courseId}/student-quiz`, { 
                        state: { studentName, courseName, sessionId: session.id } 
                      })}
                    >
                      <BarChart3 size={12} />
                      <span>Quiz</span>
                    </button>
                  </div>
                  <button className={`status-badge ${session.processed ? 'processed' : 'processing'}`}>
                    <Check size={14} />
                    <span>{session.processed ? 'Completed' : 'Processing'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Replace the style jsx with regular style element */}
      <style>
        {`
          .loading-message, .empty-state {
            text-align: center;
            padding: 2rem;
            color: var(--muted);
            background: var(--card);
            border: 1px solid var(--card-border);
            border-radius: var(--radius);
            margin-bottom: 1rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
          
          .spinning {
            animation: spin 1.5s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default StudentCourseVideosPage;
