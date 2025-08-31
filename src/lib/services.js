// src/lib/services.js
import { api } from "./api";

// ---- Sessions & Sharing ----
export const getSharedSessions = (studentId) =>
  api.get("/sessions/shared", { params: { student_id: studentId } })
     .then(r => r.data);

export const createShare = (payload) =>
  api.post("/share", payload).then(r => r.data);
// payload = { student_id, course_id, session_id, scope: ["summary","quiz","feedback"], ttl_minutes }

export const getShareByToken = (token) =>
  api.get(`/share/${token}`).then(r => r.data);

export const revokeShare = (studentId, courseId, sessionId) =>
  api.post("/share/revoke", { student_id: studentId, course_id: courseId, session_id: sessionId })
     .then(r => r.data);

// ---- Tutor profile ----
export const upsertTutorProfile = (teacherId, calendlyUrl) =>
  api.put("/tutor/profile", { teacher_id: teacherId, calendly_url: calendlyUrl })
     .then(r => r.data);

export const getTutorProfile = (teacherId) =>
  api.get("/tutor/profile", { params: { teacher_id: teacherId } })
     .then(r => r.data);

// ---- Session metadata (sharing flags, paid) ----
export const patchSessionMeta = ({ studentId, courseId, sessionId, sharedWith, paid }) =>
  api.patch("/sessions/meta", null, {
    params: {
      student_id: studentId,
      course_id: courseId,
      session_id: sessionId,
      shared_with: JSON.stringify(sharedWith), // backend normalizes this JSON string
      paid
    }
  }).then(r => r.data);

// ---- Concepts comparison ----
export const compareConcepts = ({ studentId, courseId, sessionId1, sessionId2 }) =>
  api.get("/progress/concepts", {
    params: {
      student_id: studentId,
      course_id: courseId,
      session_id_1: sessionId1,
      session_id_2: sessionId2
    }
  }).then(r => r.data);

// ---- Export (PDF or HTML fallback) ----
export const exportReport = async ({ studentId, courseId, sessionId }) => {
  const res = await api.get("/export/pdf", {
    params: { student_id: studentId, course_id: courseId, session_id: sessionId },
    responseType: "blob",
  });
  const contentType = res.headers["content-type"] || "";
  return { blob: new Blob([res.data], { type: contentType }), contentType };
};

// ---- Edits ----
export const editSummary = ({ studentId, courseId, sessionId, content }) =>
  api.put(`/sessions/${encodeURIComponent(studentId)}/${encodeURIComponent(courseId)}/${encodeURIComponent(sessionId)}/summary`,
    { content }
  ).then(r => r.data);

export const editQuiz = ({ studentId, courseId, sessionId, questions }) =>
  api.put(`/sessions/${encodeURIComponent(studentId)}/${encodeURIComponent(courseId)}/${encodeURIComponent(sessionId)}/quiz`,
    { questions }
  ).then(r => r.data);

export const editFeedback = ({ studentId, courseId, sessionId, insights }) =>
  api.put(`/sessions/${encodeURIComponent(studentId)}/${encodeURIComponent(courseId)}/${encodeURIComponent(sessionId)}/feedback`,
    { insights }
  ).then(r => r.data);

// ---- Video Upload ----
export const uploadSessionVideo = async (file, metadata) => {
  // Create form data with file and metadata
  const formData = new FormData();
  formData.append('file', file);
  formData.append('teacher_id', metadata.teacherId);
  formData.append('student_id', metadata.studentId);
  formData.append('course_id', metadata.courseId);
  formData.append('session_id', metadata.sessionId);
  formData.append('session_date', metadata.sessionDate || new Date().toISOString());

  return api.post("/upload", formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(r => r.data);
};

export const getProcessingStatus = (metadata) =>
  api.get("/processing/status", {
    params: {
      teacher_id: metadata.teacherId,
      student_id: metadata.studentId,
      course_id: metadata.courseId,
      session_id: metadata.sessionId
    }
  }).then(r => r.data);

export const getSessionResult = (metadata) =>
  api.get("/sessions/result", {
    params: {
      teacher_id: metadata.teacherId,
      student_id: metadata.studentId,
      course_id: metadata.courseId,
      session_id: metadata.sessionId
    }
  }).then(r => r.data);

// ---- Sessions listing ----
export const getSessionsList = ({ teacherId, studentId, courseId }) =>
  api.get("/sessions/list", {
    params: {
      teacher_id: teacherId,
      student_id: studentId,
      course_id: courseId
    }
  }).then(r => r.data);
