import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, LogOut } from 'lucide-react';

function StudentDashboardPage() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  
  // Use this to get student name from ID or API call in a real app
  const studentName = studentId === 'amna' ? 'Amna Ahmad' : 'Student';
  const studentInitial = studentName.charAt(0);

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
            <span className="user-name">{studentName}</span>
            <span className="user-role">Student Dashboard</span>
          </div>
          
          {/* Icon in the middle */}
          <div className="student-initial" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
            {studentInitial}
          </div>
          
          {/* Logout button on the right */}
          <button className="icon-button" onClick={() => navigate('/')}>
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        <h1>Welcome, {studentName}</h1>
        <p>Your student dashboard is under construction.</p>
      </div>
    </div>
  );
}

export default StudentDashboardPage;
