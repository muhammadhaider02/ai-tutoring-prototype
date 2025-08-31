import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, LogOut, Users, BookOpen, Clock, TrendingUp, Calendar, Settings, Copy, Edit2, X } from 'lucide-react';
import { getTutorProfile } from '../lib/services';

function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { teacherId } = useParams();
  const [calendlyLoading, setCalendlyLoading] = useState(false);
  const [calendlyUrl, setCalendlyUrl] = useState(null);
  const [showCalendlyModal, setShowCalendlyModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Use this to get teacher name from ID or API call in a real app
  const teacherName = teacherId === 'jaka' ? 'Prof. Jaka Bavdek' : 'Teacher';
  const teacherInitial = teacherName.charAt(0);

  // Mock student data
  const students = [
    { id: 1, name: 'Amna Ahmad', course: 'Advanced Mathematics', status: 'Paid', lastSession: '2 days ago' },
    { id: 2, name: 'Bob Smith', course: 'Physics Fundamentals', status: 'Unpaid', lastSession: '1 week ago' },
    { id: 3, name: 'Carol Williams', course: 'Computer Science', status: 'Paid', lastSession: '1 day ago' },
    { id: 4, name: 'David Brown', course: 'Data Analysis', status: 'Paid', lastSession: '3 days ago' },
  ];

  const handleStudentCardClick = (studentId, studentName) => {
    // Only navigate for Amna Ahmad (id 1)
    if (studentId === 1) {
      navigate(`/teacher/${teacherId}/student/${studentId}`, { state: { studentName } });
    }
  };

  const handleScheduleSession = async () => {
    setCalendlyLoading(true);
    try {
      const profile = await getTutorProfile(teacherId);
      let url = profile && profile.calendly_url;
      if (!url) {
        url = "https://cal.com/jakabavdek";
      }
      setCalendlyUrl(url);
      setShowCalendlyModal(true);
    } catch (e) {
      alert("Failed to fetch Calendly link.");
    } finally {
      setCalendlyLoading(false);
    }
  };

  const handleCopy = () => {
    if (calendlyUrl) {
      navigator.clipboard.writeText(calendlyUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1200);
    }
  };

  const handleEdit = () => {
    // Placeholder for edit functionality
    alert("Edit Calendly link (coming soon)");
  };

  // Teacher name and initial based on ID
  // const teacherName = teacherId === 'jaka' ? 'Prof. Jaka Bavdek' : 'Teacher';
  // const teacherInitial = teacherName.charAt(0);

  return (
    <div className="dashboard-page">
      {/* Top Navigation Bar */}
      <div className="dashboard-navbar">
        {/* Logo and Brand */}
        <div className="sessions-logo">
          <div className="logo-icon">
            <Sparkles className="logo-icon-svg" size={24} />
          </div>
          <h1 className="logo-text">Sessions</h1>
        </div>

        {/* User Info and Logout */}
        <div className="user-controls">
          <div className="user-info">
            <span className="user-name">{teacherName}</span>
            <span className="user-role">Teacher Dashboard</span>
          </div>

          <div className="student-initial" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
            {teacherInitial}
          </div>

          <button className="icon-button" onClick={() => navigate('/')}>
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Key Stats Section */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <Users size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">4</div>
              <div className="stat-label">Total Students</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <BookOpen size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">14</div>
              <div className="stat-label">Active Sessions</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <Clock size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">156</div>
              <div className="stat-label">Hours Taught</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <TrendingUp size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">4.9</div>
              <div className="stat-label">Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Students Section */}
        <div className="section-header">
          <h2 className="section-title">Your Students</h2>
          <div className="section-actions">
            <button className="action-button" onClick={handleScheduleSession} disabled={calendlyLoading}>
              <Calendar size={16} />
              {calendlyLoading ? "Loading..." : "Schedule Session"}
            </button>
            <button className="action-button">
              <Settings size={16} />
              Settings
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
                  <button className="calendly-edit-btn" onClick={handleEdit} title="Edit link">
                    <Edit2 size={16} />
                    <span style={{marginLeft:4}}>Edit</span>
                  </button>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
                  Share this link with your students to let them book a session with you.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="students-dashboard-grid">
          {students.map((student) => (
            <div
              key={student.id}
              className="student-dashboard-card"
              onClick={() => handleStudentCardClick(student.id, student.name)}
              style={{ cursor: student.id === 1 ? 'pointer' : 'default' }}
            >
              <div className={`status-pill ${student.status.toLowerCase()}`}>{student.status}</div>
              <h3 className="student-dashboard-name">{student.name}</h3>
              <div className="student-dashboard-course">Course: {student.course}</div>
              <div className="student-dashboard-session">Last session: {student.lastSession}</div>
            </div>
          ))}
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

export default TeacherDashboardPage;
