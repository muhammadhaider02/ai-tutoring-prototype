import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowLeft, 
  FileText, 
  Share2, 
  Clock, 
  Calendar, 
  Edit2, 
  Brain, 
  BarChart2, 
  Tag 
} from 'lucide-react';

function AISummaryPage() {
  const navigate = useNavigate();
  const { studentId, teacherId } = useParams();
  const location = useLocation();
  
  // Get student name from location state or use default
  const studentName = location.state?.studentName || 'Amna Ahmad';
  const courseName = location.state?.courseName || 'Advanced Mathematics';
  const sessionTitle = 'Introduction to Calculus – Session 1';

  // Handle back button click
  const handleBackClick = () => {
    navigate(-1);
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

        {/* Header Title and Action Buttons */}
        <div className="page-title" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>{sessionTitle}</h1>
          <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--muted)' }}>{studentName}</p>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="action-button" 
            style={{ 
              background: 'rgb(59, 130, 246)',
              color: 'white',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgb(37, 99, 235)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgb(59, 130, 246)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={() => alert('Export PDF clicked')}
          >
            <FileText size={16} />
            <span>Export PDF</span>
          </button>
          <button 
            className="action-button"
            style={{ 
              background: 'rgb(59, 130, 246)',
              color: 'white',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgb(37, 99, 235)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgb(59, 130, 246)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={() => alert('Share clicked')}
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div className="dashboard-content">
        {/* Session Metadata Card */}
        <div className="metadata-card">
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} />
              <span>45 min duration</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} />
              <span>15/01/2025</span>
            </div>
          </div>
          <button 
            className="action-button" 
            style={{ 
              marginLeft: 'auto', 
              background: 'rgb(59, 130, 246)',
              color: 'white',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgb(37, 99, 235)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgb(59, 130, 246)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={() => alert('Edit AI Outputs clicked')}
          >
            <Edit2 size={16} />
            <span>Edit AI Outputs</span>
          </button>
        </div>

        {/* AI-Generated Summary */}
        <div className="summary-header">
          <div className="icon-container">
            <Brain size={20} />
          </div>
          <h2>AI-Generated Summary</h2>
        </div>

        <div className="summary-content">
          <h3>Session Overview:</h3>
          <p>Fundamental concepts of limits and derivatives.</p>
          
          <h3>Key Topics Covered:</h3>
          <ul>
            <li>Limits</li>
            <li>Derivatives as rates of change</li>
            <li>Power rule</li>
            <li>Applications</li>
          </ul>
          
          <h3>Student Performance:</h3>
          <p>Amna showed strong conceptual understanding, especially applying power rule.</p>
          
          <h3>Areas of Excellence:</h3>
          <p>Quick grasp of limit concepts.</p>
        </div>

        {/* Two-column cards layout */}
        <div className="card-grid">
          {/* Left Card: Progress Evaluation */}
          <div className="info-card">
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
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 className="section-heading">Strengths Observed:</h4>
              <div className="tag-container">
                <span className="tag green" onClick={() => alert('Conceptual Understanding selected')}>Conceptual Understanding</span>
                <span className="tag green" onClick={() => alert('Problem Solving selected')}>Problem Solving</span>
              </div>
            </div>

            {/* Areas for Focus */}
            <div>
              <h4 className="section-heading">Areas for Focus:</h4>
              <div className="tag-container">
                <span className="tag red" onClick={() => alert('Complex Applications selected')}>Complex Applications</span>
                <span className="tag red" onClick={() => alert('Theoretical Foundations selected')}>Theoretical Foundations</span>
              </div>
            </div>
          </div>

          {/* Right Card: Extracted Topics */}
          <div className="info-card">
            <div className="card-header">
              <div className="icon-container">
                <Tag size={18} />
              </div>
              <h3 style={{ margin: '0', fontSize: '1.25rem' }}>Extracted Topics</h3>
            </div>

            <div className="tag-container">
              {['Limits and Continuity', 'Derivative Definition', 'Power Rule', 'Real-world Applications', 'Mathematical Reasoning'].map((topic, index) => (
                <span 
                  key={index} 
                  className="tag blue"
                  onClick={() => alert(`${topic} selected`)}
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AISummaryPage;
