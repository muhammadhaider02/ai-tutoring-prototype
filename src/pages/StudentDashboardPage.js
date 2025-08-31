import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, LogOut, BookOpen, Clock, TrendingUp, Layers, Calendar, Settings } from 'lucide-react';

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
        
        {/* Key Stats Section */}
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
          {/* Course cards with similar styling to student cards */}
          <div 
            className="student-dashboard-card"
            onClick={() => navigate(`/student/${studentId}/course/math/videos`, {
              state: {
                courseName: 'Advanced Mathematics',
                instructorName: 'Prof. Jaka Bavdek',
                studentName: studentName
              }
            })}
            style={{ cursor: 'pointer' }}
          >
            <div className="status-pill paid">
              Paid
            </div>
            <h3 className="student-dashboard-name">Advanced Mathematics</h3>
            <div className="student-dashboard-course">Instructor: Prof. Jaka Bavdek</div>
            <div className="student-dashboard-session">Next session: Tomorrow</div>
          </div>

          <div className="student-dashboard-card">
            <div className="status-pill paid">
              Paid
            </div>
            <h3 className="student-dashboard-name">Physics Fundamentals</h3>
            <div className="student-dashboard-course">Instructor: Dr. Sarah Johnson</div>
            <div className="student-dashboard-session">Next session: 3 days</div>
          </div>

          <div className="student-dashboard-card">
            <div className="status-pill paid">
              Paid
            </div>
            <h3 className="student-dashboard-name">Computer Science</h3>
            <div className="student-dashboard-course">Instructor: Prof. Michael Chen</div>
            <div className="student-dashboard-session">Next session: 4 days</div>
          </div>

          <div className="student-dashboard-card">
            <div className="status-pill unpaid">
              Pending
            </div>
            <h3 className="student-dashboard-name">Data Analysis</h3>
            <div className="student-dashboard-course">Instructor: Dr. Lisa Zhang</div>
            <div className="student-dashboard-session">Next session: Not scheduled</div>
          </div>

          <div className="student-dashboard-card">
            <div className="status-pill paid">
              Paid
            </div>
            <h3 className="student-dashboard-name">English Literature</h3>
            <div className="student-dashboard-course">Instructor: Prof. James Wilson</div>
            <div className="student-dashboard-session">Next session: 1 week</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboardPage;
