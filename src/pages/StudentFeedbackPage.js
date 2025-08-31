import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowLeft, 
  BarChart2,
  Loader
} from 'lucide-react';
import { getSessionResult } from '../lib/services';

function StudentFeedbackPage() {
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

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const result = await getSessionResult({
          teacherId,
          studentId: fixedStudentId,
          courseId: fixedCourseName,
          sessionId
        });
        if (result.feedback) {
          setFeedback(result.feedback);
        } else {
          setError('No feedback available for this session.');
        }
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('Failed to load feedback. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [teacherId, fixedStudentId, fixedCourseName, sessionId]);

  // Helper functions to extract strengths, weaknesses, and comments
  const getStrengths = () => {
    if (!feedback || !feedback.llm_eval) return [];
    try {
      const evalData = JSON.parse(feedback.llm_eval);
      if (evalData.concept_mastery) {
        return evalData.concept_mastery
          .filter(concept => concept.status === "understood" || concept.status === "partial")
          .map(concept => concept.concept);
      }
    } catch (e) {}
    return [];
  };

  const getWeaknesses = () => {
    if (!feedback || !feedback.llm_eval) return [];
    try {
      const evalData = JSON.parse(feedback.llm_eval);
      if (evalData.misconceptions) {
        return evalData.misconceptions;
      } else if (evalData.concept_mastery) {
        return evalData.concept_mastery
          .filter(concept => concept.status === "not understood")
          .map(concept => concept.concept);
      } else if (evalData.next_focus) {
        return evalData.next_focus;
      }
    } catch (e) {}
    return [];
  };

  const getInstructorComments = () => {
    if (!feedback || !feedback.llm_eval) return "";
    try {
      const evalData = JSON.parse(feedback.llm_eval);
      return evalData.progress || "";
    } catch (e) {}
    return "";
  };

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
        {/* Feedback Title */}
        <div className="lectures-header">
          <div className="lectures-header-title">
            <h1>Feedback: {sessionTitle}</h1>
          </div>
        </div>

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

        {!loading && !error && feedback && (
          <div className="info-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="progress-header">
              <div className="card-header">
                <div className="icon-container" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                  <BarChart2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: '0', fontSize: '1.25rem' }}>Progress Evaluation</h3>
                  <p style={{ margin: '0', fontSize: '0.875rem', color: 'var(--muted)' }}>Improvement from last session</p>
                </div>
              </div>
            </div>

            {/* Strengths */}
            <div style={{ marginBottom: '0.5rem', padding: '1rem' }}>
              <h4 className="section-heading">Strengths Observed:</h4>
              <div className="tag-container">
                {getStrengths().length > 0 ? (
                  getStrengths().map((strength, idx) => (
                    <span className="tag green" key={idx}>{strength}</span>
                  ))
                ) : (
                  <span className="tag green">No strengths data available</span>
                )}
              </div>
              {/* Optionally, you can add a summary sentence here if available */}
            </div>

            {/* Areas for Focus */}
            <div style={{ padding: '1rem', marginBottom: '0.5rem' }}>
              <h4 className="section-heading">Areas for Focus:</h4>
              <div className="tag-container">
                {getWeaknesses().length > 0 ? (
                  getWeaknesses().map((weakness, idx) => (
                    <span className="tag red" key={idx}>{weakness}</span>
                  ))
                ) : (
                  <span className="tag red">No areas for focus identified</span>
                )}
              </div>
            </div>
            
            {/* Instructor Comments */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
              <h4 className="section-heading">Instructor Comments:</h4>
              <p>
                {getInstructorComments() || "No instructor comments available."}
              </p>
            </div>
          </div>
        )}
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

export default StudentFeedbackPage;
