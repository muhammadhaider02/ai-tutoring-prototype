import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TeacherListPage from './pages/TeacherListPage';
import StudentListPage from './pages/StudentListPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import StudentLecturesPage from './pages/StudentLecturesPage';

function App() {
  return (
    <Router>
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/teachers" element={<TeacherListPage />} />
          <Route path="/students" element={<StudentListPage />} />
          <Route path="/student-dashboard/:studentId" element={<StudentDashboardPage />} />
          
          {/* Keep both old and new routes for teacher dashboard */}
          <Route path="/teacher-dashboard/:teacherId" element={<TeacherDashboardPage />} />
          <Route path="/teacher/:teacherId" element={<TeacherDashboardPage />} />
          
          {/* Student lectures page */}
          <Route path="/teacher/:teacherId/student/:studentId" element={<StudentLecturesPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
