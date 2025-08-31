import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

function TeacherListPage() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <div className="role-selection-container" style={{ marginTop: '5rem' }}>
          <div className="sessions-logo">
            <div className="logo-icon">
              <Sparkles className="logo-icon-svg" size={24} />
            </div>
            <h1 className="logo-text">Sessions</h1>
          </div>

          <h2
            className="select-role-text"
            style={{ marginTop: '0.05rem', marginBottom: '0.5rem' }}
          >
            Select your role to continue
          </h2>
        </div>
      </div>

      <div className="selection-container">
        <div className="selection-header">
          <h2 className="selection-title">Select Teacher Account</h2>
          <button className="back-button" onClick={() => navigate('/')}>
            Back
          </button>
        </div>

        {/* Updated grid layout for teacher cards */}
        <div className="students-grid">
          <div
            className="student-card"
            onClick={() => navigate('/teacher-dashboard/jaka')}
            style={{ cursor: 'pointer' }}
          >
            <div className="student-initial">J</div>
            <p className="student-name">Prof. Jaka Bavdek</p>
          </div>

          <div className="student-card">
            <div className="student-initial">S</div>
            <p className="student-name">Dr. Sarah Wilson</p>
          </div>

          <div className="student-card">
            <div className="student-initial">M</div>
            <p className="student-name">Prof. Michael Brown</p>
          </div>

          <div className="student-card">
            <div className="student-initial">E</div>
            <p className="student-name">Prof. Elizabeth Taylor</p>
          </div>

          <div className="student-card">
            <div className="student-initial">R</div>
            <p className="student-name">Dr. Robert Johnson</p>
          </div>

          <div className="student-card">
            <div className="student-initial">K</div>
            <p className="student-name">Prof. Karen Martinez</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherListPage;