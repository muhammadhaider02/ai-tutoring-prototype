import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

function HomePage() {
  const navigate = useNavigate();

  const handleTeacherClick = () => {
    navigate('/teachers');
  };

  const handleStudentClick = () => {
    navigate('/students');
  };

  return (
    <div className="home-page">
      <div className="role-selection-container">
        <div className="sessions-logo">
          <div className="logo-icon">
            <Sparkles className="logo-icon-svg" size={24} />
          </div>
          <h1 className="logo-text">Sessions</h1>
        </div>
        
        <h2 className="select-role-text" style={{ marginTop: '0.2rem', marginBottom: '2.5rem' }}>
          Select your role to continue
        </h2>
        
        <div className="role-cards-container">
          <div className="role-card" onClick={handleStudentClick}>
            <div className="role-icon student-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 8C17 10.7614 14.7614 13 12 13C9.23858 13 7 10.7614 7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8Z" stroke="#3B82F6" strokeWidth="1.5"/>
                <path d="M3 21C3 17.134 7.02944 14 12 14C16.9706 14 21 17.134 21 21" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="role-title">Student</h3>
            <p className="role-description">Access your courses and sessions</p>
          </div>
          
          <div className="role-card" onClick={handleTeacherClick}>
            <div className="role-icon teacher-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L20 8.44444L12 13.8889L4 8.44444L12 3Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 13.8889L12 19.3333L4 13.8889" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 8.44444V15.6667" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="role-title">Teacher</h3>
            <p className="role-description">Manage students and create content</p>
          </div>
        </div>
        
        <footer className="auth-footer">
          <div className="footer-links">
            <a href="#" className="footer-link">Help</a>
            <span className="footer-divider">•</span>
            <a href="#" className="footer-link">Privacy</a>
            <span className="footer-divider">•</span>
            <a href="#" className="footer-link">Terms</a>
          </div>
          <div className="footer-copyright">© 2025 Sessions Learning</div>
        </footer>
      </div>
    </div>
  );
}

export default HomePage;
