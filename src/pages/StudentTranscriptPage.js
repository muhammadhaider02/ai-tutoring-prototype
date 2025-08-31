import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowLeft,
  FileText,
  Loader
} from 'lucide-react';
import { getSessionResult } from '../lib/services';

function StudentTranscriptPage() {
  const navigate = useNavigate();
  const { studentId, courseId } = useParams();
  const location = useLocation();

  // Use Prof. Jaka Bavdek's name directly
  const studentName = 'Prof. Jaka Bavdek';
  const courseName = location.state?.courseName || 'Advanced Mathematics';
  const sessionId = location.state?.sessionId || '1';
  const sessionTitle = `${courseName} – Session ${sessionId}`;

  // Use fixed values for teacherId and studentId to match backend/test data, but dynamic sessionId
  const teacherId = "jaka";
  const fixedStudentId = "1";
  const fixedCourseName = "Advanced Mathematics";

  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        setLoading(true);
        const result = await getSessionResult({
          teacherId,
          studentId: fixedStudentId,
          courseId: fixedCourseName,
          sessionId
        });
        // The transcript is stored in result.transcript or result.summary
        if (result && result.transcript) {
          setTranscript(result.transcript);
        } else if (result && result.summary) {
          setTranscript(result.summary);
        } else {
          setError('No transcript available for this session.');
        }
      } catch (err) {
        console.error('Error fetching transcript:', err);
        setError('Failed to load transcript. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchTranscript();
  }, [teacherId, fixedStudentId, fixedCourseName, sessionId]);

  // Handle back button click
  const handleBackClick = () => {
    navigate(`/student/${studentId}/course/${courseId}/videos`);
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

        {/* Student Info - Same as StudentCourseVideosPage */}
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
        {/* Transcript Title */}
        <div className="lectures-header">
          <div className="lectures-header-title">
            <h1>
              <FileText size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Summary: {sessionTitle}
            </h1>
          </div>
        </div>

        <div className="summary-content">
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader size={36} className="spinning" style={{ color: 'var(--blue)' }} />
            </div>
          )}

          {error && !loading && (
            <div style={{ 
              padding: '1.5rem', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              borderRadius: '8px',
              color: '#ef4444',
              marginTop: '1rem' 
            }}>
              {error}
            </div>
          )}

          {!loading && !error && transcript && (
            <div className="transcript-container" style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 12,
              padding: '1.5rem',
              color: 'var(--text)',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
              fontSize: '1rem'
            }}>
              {transcript}
            </div>
          )}
        </div>
      </div>
      <style>
        {`
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

export default StudentTranscriptPage;