// lib/toast.js
// Tiny event-based helper so any page can pop a toast without prop
// drilling. showToast() dispatches a window event; <ToastHost /> in the
// layout listens for it and renders the Bootstrap toast.

/**
 * Show a toast. type is "success" (green) or "error" (red).
 * @param {string} message
 * @param {"success"|"error"} type
 */
export function showToast(message, type = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("app:toast", { detail: { id: Date.now(), message, type } })
  );
}
