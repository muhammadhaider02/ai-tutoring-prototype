import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

function StudentListPage() {
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
            style={{ marginTop: '0.2rem', marginBottom: '0.5rem' }}
          >
            Select your role to continue
          </h2>
        </div>
      </div>

      <div className="selection-container">
        <div className="selection-header">
          <h2 className="selection-title">Select Student Account</h2>
          <button className="back-button" onClick={() => navigate('/')}>
            Back
          </button>
        </div>

        {/* Updated grid layout for student cards */}
        <div className="students-grid">
          <div className="student-card">
            <div className="student-initial">A</div>
            <p className="student-name">Alice Johnson</p>
          </div>

          <div className="student-card">
            <div className="student-initial">B</div>
            <p className="student-name">Bob Smith</p>
          </div>

          <div className="student-card">
            <div className="student-initial">C</div>
            <p className="student-name">Carol Williams</p>
          </div>

          <div className="student-card">
            <div className="student-initial">D</div>
            <p className="student-name">David Brown</p>
          </div>

          <div className="student-card">
            <div className="student-initial">E</div>
            <p className="student-name">Emma Davis</p>
          </div>

          <div className="student-card">
            <div className="student-initial">F</div>
            <p className="student-name">Frank Miller</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentListPage;
