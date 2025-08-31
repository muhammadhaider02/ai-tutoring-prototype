import React from "react";
import { exportReport } from "../lib/services";

export default function ExportButton({ studentId, courseId, sessionId }) {
  const handleExport = async () => {
    const { blob, contentType } = await exportReport({ studentId, courseId, sessionId });
    if (contentType.includes("application/pdf")) {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      const text = await new Response(blob).text();
      try {
        const { html } = JSON.parse(text);
        const w = window.open("", "_blank", "noopener,noreferrer");
        w.document.write(html);
        w.document.close();
      } catch {
        alert("Unexpected export response; see console");
        console.log(text);
      }
    }
  };

  return <button onClick={handleExport}>Export Session</button>;
}
