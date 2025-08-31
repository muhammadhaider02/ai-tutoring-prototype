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
  Loader,
  X
} from 'lucide-react';
import { getSessionResult, editQuiz } from '../lib/services';

function QuizPage() {
  const navigate = useNavigate();
  const { studentId, teacherId } = useParams();
  const location = useLocation();
  
  // Get student name from location state or use default
  const studentName = location.state?.studentName || 'Amna Ahmad';
  const courseName = location.state?.courseName || 'Advanced Mathematics';
  const sessionId = location.state?.sessionId || '1';

  // Add state for quiz data and loading
  const [quizArr, setQuizArr] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionTitle, setSessionTitle] = useState('Loading Session...');

  // Modal state for editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [editIndex, setEditIndex] = useState(0); // which question is being edited
  const [editQuestion, setEditQuestion] = useState('');
  const [editOptions, setEditOptions] = useState(['', '', '', '']);
  const [editCorrect, setEditCorrect] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);

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

  // When opening modal, load the current question
  useEffect(() => {
    if (!showEditModal || !quizArr || quizArr.length === 0) return;
    const q = quizArr[editIndex];
    setEditQuestion(q.question || '');
    setEditOptions(q.options ? [...q.options] : ['', '', '', '']);
    setEditCorrect(q.correct_answer || '');
    setEditError(null);
  // eslint-disable-next-line
  }, [showEditModal, editIndex]);

  // Save handler for Done button
  const handleSaveEdit = async () => {
    setSaving(true);
    setEditError(null);
    try {
      const newQuizArr = quizArr.map((q, idx) =>
        idx === editIndex
          ? {
              ...q,
              question: editQuestion,
              options: editOptions,
              correct_answer: editCorrect || q.correct_answer // fallback to previous if not selected
            }
          : q
      );
      // Store as array, not as { quiz: [...] }
      await editQuiz({
        studentId: studentId,
        courseId: courseName,
        sessionId: sessionId,
        questions: newQuizArr
      });
      // Refetch updated quiz data instead of reloading the page
      const result = await getSessionResult({
        teacherId: teacherId || 'default_teacher',
        studentId: studentId,
        courseId: courseName,
        sessionId: sessionId
      });
      let quizRaw = result.quiz;
      let quizList = [];
      if (Array.isArray(quizRaw)) {
        quizList = quizRaw;
      } else if (quizRaw && Array.isArray(quizRaw.quiz)) {
        quizList = quizRaw.quiz;
      }
      if (quizList.length > 0) {
        setQuizArr(quizList);
      }
      setShowEditModal(false);
    } catch (e) {
      setEditError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 600, minHeight: 340 }}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Edit2 size={20} style={{ color: '#3B82F6' }} />
                <h2 style={{ margin: 0, fontSize: 18 }}>Edit Quiz Question</h2>
              </div>
              <button className="close-button" onClick={() => setShowEditModal(false)}>
                <X size={22} />
              </button>
            </div>
            <div style={{ display: 'flex', minHeight: 220 }}>
              {/* Vertical Nav Bar for questions */}
              <div className="edit-nav" style={{ minWidth: 160, borderRight: '1px solid var(--card-border)', padding: '1.5rem 0.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {quizArr && quizArr.map((q, idx) => (
                  <button
                    key={idx}
                    className={`edit-nav-btn${editIndex === idx ? ' active' : ''}`}
                    onClick={() => setEditIndex(idx)}
                  >
                    <CheckSquare size={16} style={{ marginRight: 8 }} />
                    Q{idx + 1}
                  </button>
                ))}
              </div>
              {/* Edit Area */}
              <div style={{ flex: 1, padding: '1.5rem' }}>
                <h3>Edit Question {editIndex + 1}</h3>
                <textarea
                  value={editQuestion}
                  onChange={e => setEditQuestion(e.target.value)}
                  rows={3}
                  style={{ width: '100%', fontSize: '1rem', borderRadius: 8, padding: 10, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', marginBottom: 12 }}
                />
                <div style={{ marginBottom: 12 }}>
                  {editOptions.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ width: 18 }}>{String.fromCharCode(65 + i)})</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...editOptions];
                          newOpts[i] = e.target.value;
                          setEditOptions(newOpts);
                        }}
                        style={{ flex: 1, fontSize: '1rem', borderRadius: 6, padding: 6, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)' }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontWeight: 500, marginRight: 8 }}>Correct Answer:</label>
                  <select
                    value={editCorrect || quizArr[editIndex]?.correct_answer || ""}
                    onChange={e => setEditCorrect(e.target.value)}
                    style={{
                      fontSize: '1rem',
                      borderRadius: 6,
                      padding: 6,
                      border: '1px solid var(--card-border)',
                      background: 'rgba(30,40,60,0.95)',
                      color: 'var(--text)'
                    }}
                  >
                    {/* Default option is the current correct answer */}
                    <option value={quizArr[editIndex]?.correct_answer || ""}>
                      {quizArr[editIndex]?.correct_answer || "Select"}
                    </option>
                    {editOptions.map((opt, i) => {
                      const val = `${opt}`;
                      // Don't repeat the current correct answer as an option
                      if (val === quizArr[editIndex]?.correct_answer) return null;
                      return (
                        <option key={i} value={val}>{val}</option>
                      );
                    })}
                  </select>
                </div>
                {editError && (
                  <div style={{ color: '#ef4444', marginTop: 10 }}>{editError}</div>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button
                    className="action-button"
                    style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--card-border)' }}
                    onClick={() => setShowEditModal(false)}
                    disabled={saving}
                  >
                    Back
                  </button>
                  <button
                    className="action-button"
                    style={{ background: 'rgb(59, 130, 246)', color: 'white' }}
                    onClick={handleSaveEdit}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Done'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            onClick={() => setShowEditModal(true)}
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
                  <div className="correct-answer" style={{ marginTop: '0.5rem', color: '#22c55e', fontStyle: 'italic' }}>
                    Correct Answer: {question.correct_answer}
                  </div>
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
      <style>
        {`
        .spinning {
          animation: spin 1.5s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
          width: 600px;
          max-width: 95vw;
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
        .edit-nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .edit-nav-btn {
          background: none;
          border: none;
          color: var(--muted);
          font-size: 1rem;
          font-weight: 500;
          padding: 8px 0;
          text-align: left;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s, color 0.2s;
          display: flex;
          align-items: center;
        }
        .edit-nav-btn.active,
        .edit-nav-btn:hover {
          background: rgba(59,130,246,0.12);
          color: var(--blue);
        }
        `}
      </style>
    </div>
  );
}

export default QuizPage;
