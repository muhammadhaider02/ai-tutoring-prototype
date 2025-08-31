import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowLeft, 
  BarChart2
} from 'lucide-react';

function StudentFeedbackPage() {
  const navigate = useNavigate();
  const { studentId, courseId } = useParams();
  const location = useLocation();
  
  // Use Prof. Jaka Bavdek's name directly
  const studentName = 'Prof. Jaka Bavdek';
  const courseName = location.state?.courseName || 'Advanced Mathematics';
  const sessionTitle = 'Introduction to Calculus – Session 1';

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

        {/* Progress Evaluation Card */}
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
              <span className="tag green">Conceptual Understanding</span>
              <span className="tag green">Problem Solving</span>
              <span className="tag green">Critical Thinking</span>
            </div>
            
            <p style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
              Your understanding of derivative concepts is excellent. You demonstrated strong 
              problem-solving skills when working through complex applications, particularly 
              with the power rule and chain rule. Your ability to connect abstract concepts 
              with real-world applications shows a deep level of conceptual understanding.
            </p>
          </div>

          {/* Areas for Focus */}
          <div style={{ padding: '1rem', marginBottom: '0.5rem' }}>
            <h4 className="section-heading">Areas for Focus:</h4>
            <div className="tag-container">
              <span className="tag red">Complex Applications</span>
              <span className="tag red">Theoretical Foundations</span>
            </div>
            
            <p style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
              While your application of basic derivatives is strong, consider working on more 
              complex applications involving product and quotient rules. Additionally, strengthening
              your understanding of theoretical foundations would help you tackle more advanced 
              problems in the future. I recommend reviewing the limit definition of derivatives 
              and practicing problems that require this fundamental understanding.
            </p>
          </div>
          
          {/* Instructor Comments */}
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
            <h4 className="section-heading">Instructor Comments:</h4>
            <p>
              You've made excellent progress since our last session. Your enthusiasm for the subject 
              is evident, and you're asking thoughtful questions that demonstrate your engagement. 
              For our next session, I recommend reviewing the practice problems I've assigned and 
              coming prepared with questions on any areas you find challenging.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentFeedbackPage;
