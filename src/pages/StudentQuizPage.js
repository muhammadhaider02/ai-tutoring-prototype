import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowLeft, 
  CheckSquare
} from 'lucide-react';

function StudentQuizPage() {
  const navigate = useNavigate();
  const { studentId, courseId } = useParams();
  const location = useLocation();
  
  // Use Prof. Jaka Bavdek's name directly
  const studentName = 'Prof. Jaka Bavdek';
  const courseName = location.state?.courseName || 'Advanced Mathematics';
  const sessionTitle = 'Introduction to Calculus – Session 1';

  // Handle back button click
  const handleBackClick = () => {
    navigate(`/student/${studentId}/course/${courseId}/videos`);
  };

  return (
    <div className="dashboard-page">
      {/* Top Navigation Bar */}
      <div className="dashboard-navbar">
        <div className="navbar-left">
          {/* Back button */}
          <button className="icon-button" onClick={handleBackClick}>
            <ArrowLeft size={20} />
          </button>
          
          {/* Logo and Brand */}
          <div className="sessions-logo" style={{ marginLeft: '1rem' }}>
            <div className="logo-icon">
              <Sparkles className="logo-icon-svg" size={24} />
            </div>
            <h1 className="logo-text">Sessions</h1>
          </div>
        </div>

        {/* Student Info - Same as StudentCourseVideosPage */}
        <div className="user-controls">
          {/* Name and role */}
          <div className="user-info">
            <span className="user-name">{studentName}</span>
            <span className="user-role">{courseName}</span>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="dashboard-content">
        {/* Quiz Title */}
        <div className="lectures-header">
          <div className="lectures-header-title">
            <h1>Quiz: {sessionTitle}</h1>
          </div>
        </div>

        <div className="summary-content">
          <h3>Quiz Title: Introduction to Calculus – Session 1</h3>
          
          <div className="quiz-container">
            <div className="quiz-question">
              <h4>Question 1:</h4>
              <p>Given a dataset, what is the best method to find the median value?</p>
              <div className="quiz-options">
                <div className="quiz-option">
                  <input type="radio" id="q1-a" name="q1" />
                  <label htmlFor="q1-a">A) Add all values and divide by the number of values</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q1-b" name="q1" />
                  <label htmlFor="q1-b">B) Arrange the values in order and select the middle one</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q1-c" name="q1" />
                  <label htmlFor="q1-c">C) Find the most frequently occurring value</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q1-d" name="q1" />
                  <label htmlFor="q1-d">D) Multiply the largest and smallest values</label>
                </div>
              </div>
            </div>
            
            <div className="quiz-question">
              <h4>Question 2:</h4>
              <p>A cylinder has a volume of 432 cubic centimeters and a base area of 24 square centimeters. What reasoning leads you to the formula for its height?</p>
              <div className="quiz-options">
                <div className="quiz-option">
                  <input type="radio" id="q2-a" name="q2" />
                  <label htmlFor="q2-a">A) The height is the square root of the base area</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q2-b" name="q2" />
                  <label htmlFor="q2-b">B) The height is the volume divided by the base area</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q2-c" name="q2" />
                  <label htmlFor="q2-c">C) The height is the base area divided by the volume</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q2-d" name="q2" />
                  <label htmlFor="q2-d">D) The height is the volume multiplied by the base area</label>
                </div>
              </div>
            </div>
            
            <div className="quiz-question">
              <h4>Question 3:</h4>
              <p>If a quadratic equation has no real solutions, what does this imply about its graph?</p>
              <div className="quiz-options">
                <div className="quiz-option">
                  <input type="radio" id="q3-a" name="q3" />
                  <label htmlFor="q3-a">A) The graph crosses the x-axis at two points</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q3-b" name="q3" />
                  <label htmlFor="q3-b">B) The graph touches the x-axis at one point</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q3-c" name="q3" />
                  <label htmlFor="q3-c">C) The graph does not intersect the x-axis</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q3-d" name="q3" />
                  <label htmlFor="q3-d">D) The graph is a straight line</label>
                </div>
              </div>
            </div>
            
            <div className="quiz-question">
              <h4>Question 4:</h4>
              <p>If a line has a slope of 7, what is the slope of a line perpendicular to it?</p>
              <div className="quiz-options">
                <div className="quiz-option">
                  <input type="radio" id="q4-a" name="q4" />
                  <label htmlFor="q4-a">A) 7</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q4-b" name="q4" />
                  <label htmlFor="q4-b">B) -7</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q4-c" name="q4" />
                  <label htmlFor="q4-c">C) 1/7</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q4-d" name="q4" />
                  <label htmlFor="q4-d">D) -1/7</label>
                </div>
              </div>
            </div>
            
            <div className="quiz-question">
              <h4>Question 5:</h4>
              <p>When a system of two linear equations has no solution, what must be true about the relationship between their coefficients?</p>
              <div className="quiz-options">
                <div className="quiz-option">
                  <input type="radio" id="q5-a" name="q5" />
                  <label htmlFor="q5-a">A) The lines have the same slope and same y-intercept</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q5-b" name="q5" />
                  <label htmlFor="q5-b">B) The lines have different slopes</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q5-c" name="q5" />
                  <label htmlFor="q5-c">C) The lines have the same slope but different y-intercepts</label>
                </div>
                <div className="quiz-option">
                  <input type="radio" id="q5-d" name="q5" />
                  <label htmlFor="q5-d">D) The lines are perpendicular</label>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <button 
              className="action-button"
              style={{ 
                background: 'rgb(59, 130, 246)',
                color: 'white',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgb(37, 99, 235)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgb(59, 130, 246)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={() => alert('Quiz submitted')}
            >
              <CheckSquare size={20} />
              <span>Submit Quiz</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentQuizPage;
