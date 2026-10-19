// lib/dates.js
// Small date helpers shared by the client pages.

function pad(n) {
  return String(n).padStart(2, "0");
}

// Today as "YYYY-MM-DD" (used as the max value of date inputs).
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
