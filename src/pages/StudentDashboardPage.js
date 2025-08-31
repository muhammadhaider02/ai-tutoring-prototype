import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Sparkles,
  LogOut,
  Layers,
  BookOpen,
  Clock,
  TrendingUp,
  Calendar,
  Settings,
  Copy,
  ExternalLink,
  X
} from 'lucide-react';

function StudentDashboardPage() {
  const navigate = useNavigate();
  const { studentId } = useParams();

  // Simple name lookup (replace with real data later)
  const studentName = studentId === 'amna' ? 'Amna Ahmad' : 'Student';
  const studentInitial = studentName.charAt(0);

  // Calendly modal state
  const [showCalendlyModal, setShowCalendlyModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const calendlyUrl = "https://cal.com/jakabavdek";

  const handleScheduledSession = () => {
    setShowCalendlyModal(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(calendlyUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1200);
  };

  const handleOpen = () => {
    window.open(calendlyUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="dashboard-page">
      {/* Top Navigation Bar */}
      <div className="dashboard-navbar">
        {/* Logo / Brand */}
        <div className="sessions-logo">
          <div className="logo-icon">
            <Sparkles className="logo-icon-svg" size={24} />
          </div>
          <h1 className="logo-text">Sessions</h1>
        </div>

        {/* User Info + Logout */}
        <div className="user-controls">
          <div className="user-info">
            <span className="user-name">{studentName}</span>
            <span className="user-role">Student Dashboard</span>
          </div>

          <div
            className="student-initial"
            style={{ width: '36px', height: '36px', fontSize: '1rem' }}
          >
            {studentInitial}
          </div>

          <button className="icon-button" onClick={() => navigate('/')}>
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        <h1>Welcome, {studentName}</h1>
        <p className="muted">Here’s a quick look at your learning.</p>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <Layers size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">5</div>
              <div className="stat-label">Enrolled Courses</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <BookOpen size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">57</div>
              <div className="stat-label">Lessons Completed</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <Clock size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">42h</div>
              <div className="stat-label">Study Time</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <TrendingUp size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">4.8</div>
              <div className="stat-label">Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="section-header">
          <h2 className="section-title">Your Courses</h2>
          <div className="section-actions">
            <button className="action-button" onClick={handleScheduledSession}>
              <Calendar size={16} />
              <span>Schedule Session</span>
            </button>
            <button className="action-button">
              <Settings size={16} />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Calendly Modal */}
        {showCalendlyModal && (
          <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: 480 }}>
              <div className="modal-header">
                <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Calendar size={20} style={{ color: '#3B82F6' }} />
                  <h2 style={{ margin: 0, fontSize: 18 }}>Schedule Session Link</h2>
                </div>
                <button className="close-button" onClick={() => setShowCalendlyModal(false)}>
                  <X size={22} />
                </button>
              </div>
              <div className="modal-body">
                <div className="calendly-link-row" style={{ marginBottom: 16 }}>
                  <span className="calendly-link-text">{calendlyUrl}</span>
                  <button className="calendly-copy-btn" onClick={handleCopy} title="Copy link">
                    <Copy size={16} />
                    {copySuccess ? <span style={{marginLeft:4, color:'#22c55e'}}>Copied!</span> : <span style={{marginLeft:4}}>Copy</span>}
                  </button>
                  <button className="calendly-edit-btn" onClick={handleOpen} title="Open link">
                    <ExternalLink size={16} />
                    <span style={{marginLeft:4}}>Open</span>
                  </button>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
                  Use this link to book a session with your instructor.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="students-dashboard-grid">
          {/* Example clickable course */}
          <div
            className="student-dashboard-card"
            onClick={() =>
              navigate(`/student/${studentId}/course/math/videos`, {
                state: {
                  courseName: 'Advanced Mathematics',
                  instructorName: 'Prof. Jaka Bavdek',
                  studentName: studentName,
                },
              })
            }
            style={{ cursor: 'pointer' }}
          >
            <div className="status-pill paid">Paid</div>
            <h3 className="student-dashboard-name">Advanced Mathematics</h3>
            <div className="student-dashboard-course">
              Instructor: Prof. Jaka Bavdek
            </div>
            <div className="student-dashboard-session">Next session: Tomorrow</div>
          </div>

          <div className="student-dashboard-card">
            <div className="status-pill paid">Paid</div>
            <h3 className="student-dashboard-name">Physics Fundamentals</h3>
            <div className="student-dashboard-course">
              Instructor: Dr. Sarah Johnson
            </div>
            <div className="student-dashboard-session">Next session: 3 days</div>
          </div>

          <div className="student-dashboard-card">
            <div className="status-pill paid">Paid</div>
            <h3 className="student-dashboard-name">Computer Science</h3>
            <div className="student-dashboard-course">
              Instructor: Prof. Michael Chen
            </div>
            <div className="student-dashboard-session">Next session: 4 days</div>
          </div>

          <div className="student-dashboard-card">
            <div className="status-pill unpaid">Pending</div>
            <h3 className="student-dashboard-name">Data Analysis</h3>
            <div className="student-dashboard-course">
              Instructor: Dr. Lisa Zhang
            </div>
            <div className="student-dashboard-session">Next session: Not scheduled</div>
          </div>

          <div className="student-dashboard-card">
            <div className="status-pill paid">Paid</div>
            <h3 className="student-dashboard-name">English Literature</h3>
            <div className="student-dashboard-course">
              Instructor: Prof. James Wilson
            </div>
            <div className="student-dashboard-session">Next session: 1 week</div>
          </div>
        </div>
      </div>
      <style>
        {`
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
            width: 480px;
            max-width: 90%;
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
          .modal-body {
            padding: 24px;
          }
          .calendly-link-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
          }
          .calendly-link-text {
            color: var(--blue);
            font-size: 1rem;
            font-weight: 500;
            word-break: break-all;
            flex: 1;
            padding-right: 0.5rem;
          }
          .calendly-copy-btn, .calendly-edit-btn {
            background: rgba(59,130,246,0.15);
            color: var(--blue);
            border: none;
            border-radius: 8px;
            padding: 0.375rem 0.75rem;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            transition: background 0.2s, color 0.2s;
          }
          .calendly-copy-btn:hover, .calendly-edit-btn:hover {
            background: rgba(59,130,246,0.25);
            color: #2563eb;
          }
        `}
      </style>
    </div>
  );
}

export default StudentDashboardPage;
