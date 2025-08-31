import React, { useState } from "react";
import { editSummary, editQuiz, editFeedback } from "../lib/services";

export default function EditControls({ studentId, courseId, sessionId }) {
  const [result, setResult] = useState(null);

  const saveSummary = async () => {
    const res = await editSummary({
      studentId, courseId, sessionId,
      content: "Tutor edit: tightened bullets; add one practice task."
    });
    setResult(res);
  };

  const saveQuiz = async () => {
    const res = await editQuiz({
      studentId, courseId, sessionId,
      questions: [{
        question: "Vertex of y=(x-4)^2-2?",
        options: ["A) (4,2)","B) (4,-2)","C) (-4,-2)","D) (2,-4)"],
        correct_answer: "B) (4,-2)"
      }]
    });
    setResult(res);
  };

  const saveFeedback = async () => {
    const res = await editFeedback({
      studentId, courseId, sessionId,
      insights: { note: "Emphasize completing the square; assign 2 problems." }
    });
    setResult(res);
  };

  return (
    <div style={{border:"1px solid #ddd", padding:12, borderRadius:8}}>
      <h3>Edit AI Outputs</h3>
      <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
        <button onClick={saveSummary}>Save Summary</button>
        <button onClick={saveQuiz}>Save Quiz</button>
        <button onClick={saveFeedback}>Save Feedback</button>
      </div>
      {result && <pre style={{marginTop:8}}>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
