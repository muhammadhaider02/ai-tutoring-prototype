import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowLeft, 
  FileText, 
  Share2, 
  Calendar, 
  Edit2, 
  CheckSquare,
  Loader
} from 'lucide-react';
import { getSessionResult } from '../lib/services';

function QuizPage() {
  const navigate = useNavigate();
  const { studentId, teacherId } = useParams();
  const location = useLocation();
  
  // Get student name from location state or use default
  const studentName = location.state?.studentName || 'Amna Ahmad';
  const courseName = location.state?.courseName || 'Advanced Mathematics';
  const sessionId = location.state?.sessionId || '1';

  // Add state for quiz data and loading
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionTitle, setSessionTitle] = useState('Loading Session...');

  // Fetch quiz data when component mounts
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const result = await getSessionResult({
          teacherId: teacherId || 'default_teacher',
          studentId: studentId,
          courseId: courseName,
          sessionId: sessionId
        });
        
        // Check if quiz data exists
        if (result.quiz && result.quiz.quiz && result.quiz.quiz.length > 0) {
          setQuizData(result.quiz);
          setSessionTitle(`${courseName} – Session ${sessionId}`);
        } else {
          setError('No quiz data available for this session.');
        }
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError('Failed to load quiz data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [teacherId, studentId, courseName, sessionId]);

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
              <Calendar size={18} />
              <span>Session {sessionId}</span>
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

        {/* Generated Quiz */}
        <div className="summary-header">
          <div className="icon-container" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <CheckSquare size={20} />
          </div>
          <h2>Generated Quiz</h2>
        </div>

        <div className="summary-content">
          <h3>Quiz Title: {sessionTitle}</h3>
          
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
          
          {!loading && !error && quizData && quizData.quiz && (
            <div className="quiz-container">
              {quizData.quiz.map((question, index) => (
                <div className="quiz-question" key={index}>
                  <h4>Question {index + 1}:</h4>
                  <p>{question.question}</p>
                  <div className="quiz-options">
                    {question.options.map((option, optIndex) => (
                      <div className="quiz-option" key={optIndex}>
                        <input 
                          type="radio" 
                          id={`q${index+1}-${String.fromCharCode(97 + optIndex)}`} 
                          name={`q${index+1}`} 
                        />
                        <label htmlFor={`q${index+1}-${String.fromCharCode(97 + optIndex)}`}>
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="correct-answer" style={{ marginTop: '0.5rem', color: '#22c55e', fontStyle: 'italic' }}>
                    Correct Answer: {question.correct_answer}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && !error && quizData && quizData.quiz && quizData.quiz.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
              <button 
                className="action-button"
                style={{ 
                  background: 'rgb(59, 130, 246)',
                  color: 'white',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem'
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
                onClick={() => alert('Share Quiz clicked')}
              >
                <CheckSquare size={20} />
                <span>Share Quiz</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add spinner animation for loading state */}
      <style jsx>{`
        .spinning {
          animation: spin 1.5s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default QuizPage;
