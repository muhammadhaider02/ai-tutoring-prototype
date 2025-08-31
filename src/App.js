import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TeacherListPage from './pages/TeacherListPage';
import StudentListPage from './pages/StudentListPage';

function App() {
  return (
    <Router>
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/teachers" element={<TeacherListPage />} />
          <Route path="/students" element={<StudentListPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
