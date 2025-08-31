import React, { useState, useEffect } from 'react';
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
  Tag,
  Loader,
  X
} from 'lucide-react';
import { getSessionResult, editSummary, editFeedback, editQuiz } from '../lib/services';

function AISummaryPage() {
  const navigate = useNavigate();
  const { studentId, teacherId } = useParams();
  const location = useLocation();
  
  // Get student name from location state or use default
  const studentName = location.state?.studentName || 'Amna Ahmad';
  const courseName = location.state?.courseName || 'Advanced Mathematics';
  const sessionId = location.state?.sessionId || '1';

  // Add state for summary data and loading
  const [summaryData, setSummaryData] = useState('');
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionTitle, setSessionTitle] = useState('Loading Session...');

  // Parse summary sections from raw text
  const [parsedSections, setParsedSections] = useState({
    overview: '',
    topics: [],
    performance: '',
    excellence: [],
    quickSummary: []
  });

  // Modal state for editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTab, setEditTab] = useState('summary'); // 'summary', 'progress', 'topics'
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  // Fetch summary data when component mounts
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        const result = await getSessionResult({
          teacherId: teacherId || 'default_teacher',
          studentId: studentId,
          courseId: courseName,
          sessionId: sessionId
        });
        
        // Check if summary data exists
        if (result.summary) {
          setSummaryData(result.summary);
          setSessionTitle(`${courseName} – Session ${sessionId}`);
          
          // Parse the summary text into sections
          parseSummary(result.summary);
        } else {
          setError('No summary data available for this session.');
        }

        // Get feedback/insights data if available
        if (result.feedback) {
          setFeedbackData(result.feedback);
        }
      } catch (err) {
        console.error('Error fetching summary data:', err);
        setError('Failed to load summary data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [teacherId, studentId, courseName, sessionId]);

  // Parse summary text into sections
  const parseSummary = (text) => {
    // Initial empty sections
    const sections = {
      overview: '',
      topics: [],
      performance: '',
      excellence: [],
      quickSummary: []
    };

    // Split by common section headers in the summary
    const lines = text.split('\n');
    let currentSection = null;

    for (const line of lines) {
      // Clean up the line
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) continue;

      // Check for section headers
      if (trimmed.toLowerCase().includes('session overview')) {
        currentSection = 'overview';
        continue;
      } else if (trimmed.toLowerCase().includes('key topics')) {
        currentSection = 'topics';
        continue;
      } else if (trimmed.toLowerCase().includes('student performance')) {
        currentSection = 'performance';
        continue;
      } else if (trimmed.toLowerCase().includes('areas of excellence')) {
        currentSection = 'excellence';
        continue;
      } else if (trimmed.toLowerCase().includes('quick summary')) {
        currentSection = 'quickSummary';
        continue;
      }

      // Process content based on current section
      if (currentSection === 'overview') {
        sections.overview = trimmed;
      } else if (currentSection === 'topics' && trimmed.startsWith('-')) {
        sections.topics.push(trimmed.substring(1).trim());
      } else if (currentSection === 'performance') {
        sections.performance = trimmed;
      } else if (currentSection === 'excellence' && trimmed.startsWith('-')) {
        sections.excellence.push(trimmed.substring(1).trim());
      } else if (currentSection === 'quickSummary' && trimmed.startsWith('-')) {
        sections.quickSummary.push(trimmed.substring(1).trim());
      }
    }

    // Update state with parsed sections
    setParsedSections(sections);
  };

  // Extract data from feedback
  const getStrengths = () => {
    if (!feedbackData || !feedbackData.llm_eval) return [];
    try {
      const evalData = JSON.parse(feedbackData.llm_eval);
      if (evalData.concept_mastery) {
        return evalData.concept_mastery
          .filter(concept => concept.status === "understood" || concept.status === "partial")
          .map(concept => concept.concept);
      }
    } catch (e) {
      console.error("Error parsing strengths:", e);
    }
    return [];
  };

  const getWeaknesses = () => {
    if (!feedbackData || !feedbackData.llm_eval) return [];
    try {
      const evalData = JSON.parse(feedbackData.llm_eval);
      if (evalData.misconceptions) {
        return evalData.misconceptions;
      } else if (evalData.concept_mastery) {
        return evalData.concept_mastery
          .filter(concept => concept.status === "not understood")
          .map(concept => concept.concept);
      } else if (evalData.next_focus) {
        return evalData.next_focus;
      }
    } catch (e) {
      console.error("Error parsing weaknesses:", e);
    }
    return [];
  };

  const getTopics = () => {
    if (!feedbackData || !feedbackData.topic_drift) return [];
    try {
      if (feedbackData.topic_drift.current) {
        return feedbackData.topic_drift.current.slice(0, 5);
      }
    } catch (e) {
      console.error("Error parsing topics:", e);
    }
    return [];
  };

  // Handle back button click
  const handleBackClick = () => {
    navigate(-1);
  };

  // When opening modal, load the current value for the selected tab
  useEffect(() => {
    if (!showEditModal) return;
    if (editTab === 'summary') {
      setEditValue(summaryData || '');
    } else if (editTab === 'progress') {
      // Progress evaluation: instructor comments (progress field in llm_eval)
      if (feedbackData && feedbackData.llm_eval) {
        try {
          const evalData = JSON.parse(feedbackData.llm_eval);
          setEditValue(evalData.progress || '');
        } catch {
          setEditValue('');
        }
      } else {
        setEditValue('');
      }
    } else if (editTab === 'topics') {
      // Extracted topics: topic_drift.current (array)
      if (feedbackData && feedbackData.topic_drift && Array.isArray(feedbackData.topic_drift.current)) {
        setEditValue(feedbackData.topic_drift.current.join('\n'));
      } else {
        setEditValue('');
      }
    }
  // eslint-disable-next-line
  }, [showEditModal, editTab, summaryData, feedbackData]);

  // Save handler for Done button
  const handleSaveEdit = async () => {
    setSaving(true);
    setEditError(null);
    try {
      if (editTab === 'summary') {
        await editSummary({
          studentId: studentId,
          courseId: courseName,
          sessionId: sessionId,
          content: editValue
        });
      } else if (editTab === 'progress') {
        // Update only the progress field in llm_eval
        let llm_eval = {};
        if (feedbackData && feedbackData.llm_eval) {
          try {
            llm_eval = JSON.parse(feedbackData.llm_eval);
          } catch {}
        }
        llm_eval.progress = editValue;
        await editFeedback({
          studentId: studentId,
          courseId: courseName,
          sessionId: sessionId,
          insights: { llm_eval: JSON.stringify(llm_eval), topic_drift: feedbackData?.topic_drift }
        });
      } else if (editTab === 'topics') {
        // Update only the topic_drift.current array
        let topic_drift = feedbackData?.topic_drift || {};
        topic_drift.current = editValue.split('\n').map(s => s.trim()).filter(Boolean);
        await editFeedback({
          studentId: studentId,
          courseId: courseName,
          sessionId: sessionId,
          insights: { llm_eval: feedbackData?.llm_eval, topic_drift }
        });
      }
      setShowEditModal(false);
      // Optionally, reload data after save
      window.location.reload();
    } catch (e) {
      setEditError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
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
                <h2 style={{ margin: 0, fontSize: 18 }}>Edit AI Outputs</h2>
              </div>
              <button className="close-button" onClick={() => setShowEditModal(false)}>
                <X size={22} />
              </button>
            </div>
            <div style={{ display: 'flex', minHeight: 220 }}>
              {/* Vertical Nav Bar */}
              <div className="edit-nav" style={{ minWidth: 160, borderRight: '1px solid var(--card-border)', padding: '1.5rem 0.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  className={`edit-nav-btn${editTab === 'summary' ? ' active' : ''}`}
                  onClick={() => setEditTab('summary')}
                >
                  <FileText size={16} style={{ marginRight: 8 }} />
                  Summary
                </button>
                <button
                  className={`edit-nav-btn${editTab === 'progress' ? ' active' : ''}`}
                  onClick={() => setEditTab('progress')}
                >
                  <BarChart2 size={16} style={{ marginRight: 8 }} />
                  Progress Evaluation
                </button>
                <button
                  className={`edit-nav-btn${editTab === 'topics' ? ' active' : ''}`}
                  onClick={() => setEditTab('topics')}
                >
                  <Tag size={16} style={{ marginRight: 8 }} />
                  Extracted Topics
                </button>
              </div>
              {/* Edit Area */}
              <div style={{ flex: 1, padding: '1.5rem' }}>
                {editTab === 'summary' && (
                  <>
                    <h3>Edit Summary</h3>
                    <textarea
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      rows={10}
                      style={{ width: '100%', fontSize: '1rem', borderRadius: 8, padding: 10, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)' }}
                    />
                  </>
                )}
                {editTab === 'progress' && (
                  <>
                    <h3>Edit Progress Evaluation</h3>
                    <textarea
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      rows={8}
                      style={{ width: '100%', fontSize: '1rem', borderRadius: 8, padding: 10, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)' }}
                    />
                  </>
                )}
                {editTab === 'topics' && (
                  <>
                    <h3>Edit Extracted Topics</h3>
                    <textarea
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      rows={8}
                      style={{ width: '100%', fontSize: '1rem', borderRadius: 8, padding: 10, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)' }}
                    />
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 6 }}>
                      Enter one topic per line.
                    </div>
                  </>
                )}
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

        {/* AI-Generated Summary */}
        <div className="summary-header">
          <div className="icon-container">
            <Brain size={20} />
          </div>
          <h2>AI-Generated Summary</h2>
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

        {!loading && !error && (
          <div className="summary-content">
            <h3>Session Overview:</h3>
            <p>{parsedSections.overview || "No overview available."}</p>
            
            <h3>Key Topics Covered:</h3>
            {parsedSections.topics.length > 0 ? (
              <ul>
                {parsedSections.topics.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            ) : (
              <p>No topics available.</p>
            )}
            
            <h3>Student Performance:</h3>
            <p>{parsedSections.performance || "No performance data available."}</p>
            
            <h3>Areas of Excellence:</h3>
            {parsedSections.excellence.length > 0 ? (
              <ul>
                {parsedSections.excellence.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No areas of excellence identified.</p>
            )}
            
            <h3>Quick Summary:</h3>
            {parsedSections.quickSummary.length > 0 ? (
              <ul>
                {parsedSections.quickSummary.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No summary points available.</p>
            )}
          </div>
        )}

        {!loading && !error && (
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
                  {getStrengths().length > 0 ? (
                    getStrengths().map((strength, index) => (
                      <span key={index} className="tag green" onClick={() => alert(`${strength} selected`)}>
                        {strength}
                      </span>
                    ))
                  ) : (
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No strengths data available</p>
                  )}
                </div>
              </div>

              {/* Areas for Focus */}
              <div>
                <h4 className="section-heading">Areas for Focus:</h4>
                <div className="tag-container">
                  {getWeaknesses().length > 0 ? (
                    getWeaknesses().map((weakness, index) => (
                      <span key={index} className="tag red" onClick={() => alert(`${weakness} selected`)}>
                        {weakness}
                      </span>
                    ))
                  ) : (
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No areas for focus identified</p>
                  )}
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
                {getTopics().length > 0 ? (
                  getTopics().map((topic, index) => (
                    <span 
                      key={index} 
                      className="tag blue"
                      onClick={() => alert(`${topic} selected`)}
                    >
                      {topic}
                    </span>
                  ))
                ) : (
                  <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No topics extracted</p>
                )}
              </div>
            </div>
          </div>
        )}
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

        .section-heading {
          font-size: 1rem;
          margin-bottom: 0.75rem;
          color: var(--text);
        }

        .tag-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag {
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tag.green {
          background-color: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .tag.red {
          background-color: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .tag.blue {
          background-color: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        .tag:hover {
          transform: translateY(-2px);
        }

        .card-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .info-card {
          background: var(--card);
          border: 1px solid var(--card-border);
          border-radius: var(--radius);
          padding: 1.25rem;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .icon-container {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
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

        @media (max-width: 768px) {
          .card-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default AISummaryPage;
