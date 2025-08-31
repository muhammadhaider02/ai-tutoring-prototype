import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, LogOut } from 'lucide-react';

function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { teacherId } = useParams();
  
  // Use this to get teacher name from ID or API call in a real app
  const teacherName = teacherId === 'jaka' ? 'Jaka Bavdek' : 'Teacher';
  const teacherInitial = teacherName.charAt(0);

  return (
    <div className="dashboard-page">
      {/* Top Navigation Bar */}
      <div className="dashboard-navbar">
        {/* Logo and Brand - reusing existing styles */}
        <div className="sessions-logo">
          <div className="logo-icon">
            <Sparkles className="logo-icon-svg" size={24} />
          </div>
          <h1 className="logo-text">Sessions</h1>
        </div>

        {/* User Info and Logout - Rearranged */}
        <div className="user-controls">
          {/* Name and role on the left */}
          <div className="user-info">
            <span className="user-name">{teacherName}</span>
            <span className="user-role">Teacher Dashboard</span>
          </div>
          
          {/* Icon in the middle */}
          <div className="student-initial" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
            {teacherInitial}
          </div>
          
          {/* Logout button on the right */}
          <button className="icon-button" onClick={() => navigate('/')}>
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        <h1>Welcome, {teacherName}</h1>
        <p>Your teacher dashboard is under construction.</p>
      </div>
    </div>
  );
}

export default TeacherDashboardPage;
