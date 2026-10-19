"use client";

// components/Toast.js
// Global toast host, rendered once in app/layout.js. Pages call
// showToast(message, type) from lib/toast.js and this component listens
// for the event and shows a Bootstrap toast (no Bootstrap JS needed).

import { useEffect, useState } from "react";

export default function ToastHost() {
  const [toast, setToast] = useState(null); // { id, message, type }

  // Listen for showToast() events.
  useEffect(() => {
    function onToast(event) {
      setToast(event.detail);
    }
    window.addEventListener("app:toast", onToast);
    return () => window.removeEventListener("app:toast", onToast);
  }, []);

  // Auto-hide after 4 seconds.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const colorClass = toast.type === "error" ? "text-bg-danger" : "text-bg-success";
  return (
    <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
      <div className={`toast show align-items-center border-0 ${colorClass}`} role="alert" aria-live="assertive" aria-atomic="true">
        <div className="d-flex">
          <div className="toast-body">{toast.message}</div>
          <button
            type="button"
            className="btn-close btn-close-white me-2 m-auto"
            aria-label="Close notification"
            onClick={() => setToast(null)}
          ></button>
        </div>
      </div>
    </div>
  );
}
