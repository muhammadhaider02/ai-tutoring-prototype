import React, { useState } from "react";
import { createShare, getShareByToken, revokeShare } from "../lib/services";

export default function ShareControls({ studentId, courseId, sessionId }) {
  const [shareUrl, setShareUrl] = useState(null);
  const [sharedPayload, setSharedPayload] = useState(null);
  const [error, setError] = useState(null);

  const doCreate = async () => {
    setError(null);
    setSharedPayload(null);
    const res = await createShare({
      student_id: studentId,
      course_id: courseId,
      session_id: sessionId,
      scope: ["summary", "quiz", "feedback"],
      ttl_minutes: 60
    }).catch(e => setError(e?.response?.data || e.message));
    if (res?.share_url) setShareUrl(res.share_url);
  };

  const doFetch = async () => {
    if (!shareUrl) return alert("Create a share first.");
    const token = shareUrl.split("/").pop();
    const data = await getShareByToken(token)
      .catch(e => setError(e?.response?.data || e.message));
    if (data) setSharedPayload(data);
  };

  const doRevoke = async () => {
    await revokeShare(studentId, courseId, sessionId)
      .catch(e => setError(e?.response?.data || e.message));
  };

  return (
    <div style={{border:"1px solid #ddd", padding:12, borderRadius:8}}>
      <h3>Share Session</h3>
      <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
        <button onClick={doCreate}>Create Share</button>
        <button onClick={doFetch} disabled={!shareUrl}>Fetch Shared Payload</button>
        <button onClick={doRevoke}>Revoke Share</button>
      </div>
      {shareUrl && <p style={{marginTop:8}}>URL: <a href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a></p>}
      {sharedPayload && <pre>{JSON.stringify(sharedPayload, null, 2)}</pre>}
      {error && <p style={{color:"crimson"}}>Error: {typeof error==="string" ? error : JSON.stringify(error)}</p>}
    </div>
  );
}
