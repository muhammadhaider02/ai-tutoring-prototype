import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TeacherListPage from './pages/TeacherListPage';
import StudentListPage from './pages/StudentListPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import TeacherCourseVideoPage from './pages/TeacherCourseVideoPage';
import AISummaryPage from './pages/AISummaryPage';
import QuizPage from './pages/QuizPage';
import StudentCourseVideosPage from './pages/StudentCourseVideosPage';
import StudentQuizPage from './pages/StudentQuizPage';
import StudentFeedbackPage from './pages/StudentFeedbackPage';
import './styles/styles.css';
import './styles/styles-ai-summary.css';
import './styles/styles-quiz.css';

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
          
          {/* Teacher course video page */}
          <Route path="/teacher/:teacherId/student/:studentId" element={<TeacherCourseVideoPage />} />
          
          {/* New pages for AI Summary and Quiz */}
          <Route path="/teacher/:teacherId/student/:studentId/ai-summary" element={<AISummaryPage />} />
          <Route path="/teacher/:teacherId/student/:studentId/quiz" element={<QuizPage />} />
          
          {/* Student course videos page */}
          <Route path="/student/:studentId/course/:courseId/videos" element={<StudentCourseVideosPage />} />
          
          {/* Student quiz page */}
          <Route path="/student/:studentId/course/:courseId/student-quiz" element={<StudentQuizPage />} />
          
          {/* Student feedback page */}
          <Route path="/student/:studentId/course/:courseId/feedback" element={<StudentFeedbackPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
