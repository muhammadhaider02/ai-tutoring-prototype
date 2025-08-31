import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, LogOut, Users, BookOpen, Clock, TrendingUp, Calendar, Settings } from 'lucide-react';

function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { teacherId } = useParams();
  
  // Use this to get teacher name from ID or API call in a real app
  const teacherName = teacherId === 'jaka' ? 'Jaka Bavdek' : 'Teacher';
  const teacherInitial = teacherName.charAt(0);

  // Mock student data
  const students = [
    { id: 1, name: 'Amna Ahmad', course: 'Advanced Mathematics', status: 'Paid', lastSession: '2 days ago' },
    { id: 2, name: 'Bob Smith', course: 'Physics Fundamentals', status: 'Unpaid', lastSession: '1 week ago' },
    { id: 3, name: 'Carol Williams', course: 'Computer Science', status: 'Paid', lastSession: '1 day ago' },
    { id: 4, name: 'David Brown', course: 'Data Analysis', status: 'Paid', lastSession: '3 days ago' },
  ];

  // Function to handle student card click
  const handleStudentCardClick = (studentId, studentName) => {
    // Only navigate for Amna Ahmad (id 1)
    if (studentId === 1) {
      navigate(`/teacher/${teacherId}/student/${studentId}`, { state: { studentName } });
    }
  };

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
            <button className="action-button">
              <Calendar size={16} />
              Schedule Session
            </button>
            <button className="action-button">
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>
        
        <div className="students-dashboard-grid">
          {students.map(student => (
            <div 
              key={student.id} 
              className="student-dashboard-card"
              onClick={() => handleStudentCardClick(student.id, student.name)}
              style={{ cursor: student.id === 1 ? 'pointer' : 'default' }}
            >
              <div className={`status-pill ${student.status.toLowerCase()}`}>
                {student.status}
              </div>
              <h3 className="student-dashboard-name">{student.name}</h3>
              <div className="student-dashboard-course">Course: {student.course}</div>
              <div className="student-dashboard-session">Last session: {student.lastSession}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboardPage;
