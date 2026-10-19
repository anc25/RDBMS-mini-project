"use client";

// components/ThemeToggle.js
// Light/dark switch. Clicking flips data-theme on <html> and remembers the
// choice in localStorage ("lf-theme"). app/globals.css swaps every colour
// from that attribute - and also picks which icon (sun/moon) is visible,
// so this component needs no React state at all.
//
// The theme is applied BEFORE first paint by a tiny inline script in
// app/layout.js, so a dark-mode reload has no white flash.

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("lf-theme", next);
    } catch {
      // Private mode may block storage; the theme still works for this visit.
    }
  }

  return (
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm lf-theme-toggle"
      onClick={toggle}
      aria-label="Toggle light and dark mode"
      title="Toggle light and dark mode"
    >
      <span className="lf-icon-moon"><MoonIcon /></span>
      <span className="lf-icon-sun"><SunIcon /></span>
    </button>
  );
}
