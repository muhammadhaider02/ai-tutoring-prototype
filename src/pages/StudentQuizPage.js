import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowLeft, 
  CheckSquare,
  Loader
} from 'lucide-react';
import { getSessionResult } from '../lib/services';

function StudentQuizPage() {
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

  // State for quiz data and loading
  const [quizArr, setQuizArr] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch quiz data from database
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const result = await getSessionResult({
          teacherId,
          studentId: fixedStudentId,
          courseId: fixedCourseName,
          sessionId
        });
        // Accept both {quiz: [...]} and [...] as quiz data
        let quizRaw = result.quiz;
        let quizList = [];
        if (Array.isArray(quizRaw)) {
          quizList = quizRaw;
        } else if (quizRaw && Array.isArray(quizRaw.quiz)) {
          quizList = quizRaw.quiz;
        }
        if (quizList.length > 0) {
          setQuizArr(quizList);
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
        {/* Quiz Title */}
        <div className="lectures-header">
          <div className="lectures-header-title">
            <h1>Quiz: {sessionTitle}</h1>
          </div>
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

          {!loading && !error && quizArr && quizArr.length > 0 && (
            <div className="quiz-container">
              {quizArr.map((question, index) => (
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
                  {/* Removed correct answer display */}
                </div>
              ))}
            </div>
          )}

          {!loading && !error && quizArr && quizArr.length > 0 && (
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
                onClick={() => alert('Quiz submitted')}
              >
                <CheckSquare size={20} />
                <span>Submit Quiz</span>
              </button>
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

export default StudentQuizPage;