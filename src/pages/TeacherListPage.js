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
<<<<<<< HEAD
            <p className="student-name">Prof. Jaka Bavdek</p>
=======
            <p className="student-name">Jaka Bavdek</p>
>>>>>>> 23ae73393bf464f748c2cdd93d6b667c7aef2783
          </div>

          <div className="student-card">
            <div className="student-initial">S</div>
<<<<<<< HEAD
            <p className="student-name">Dr. Sarah Wilson</p>
=======
            <p className="student-name">Sarah Wilson</p>
>>>>>>> 23ae73393bf464f748c2cdd93d6b667c7aef2783
          </div>

          <div className="student-card">
            <div className="student-initial">M</div>
<<<<<<< HEAD
            <p className="student-name">Prof. Michael Brown</p>
=======
            <p className="student-name">Michael Brown</p>
>>>>>>> 23ae73393bf464f748c2cdd93d6b667c7aef2783
          </div>

          <div className="student-card">
            <div className="student-initial">E</div>
<<<<<<< HEAD
            <p className="student-name">Prof. Elizabeth Taylor</p>
=======
            <p className="student-name">Elizabeth Taylor</p>
>>>>>>> 23ae73393bf464f748c2cdd93d6b667c7aef2783
          </div>

          <div className="student-card">
            <div className="student-initial">R</div>
<<<<<<< HEAD
            <p className="student-name">Dr. Robert Johnson</p>
=======
            <p className="student-name">Robert Johnson</p>
>>>>>>> 23ae73393bf464f748c2cdd93d6b667c7aef2783
          </div>

          <div className="student-card">
            <div className="student-initial">K</div>
<<<<<<< HEAD
            <p className="student-name">Prof. Karen Martinez</p>
=======
            <p className="student-name">Karen Martinez</p>
>>>>>>> 23ae73393bf464f748c2cdd93d6b667c7aef2783
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherListPage;