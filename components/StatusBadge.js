// components/StatusBadge.js
// One consistent colour per status across the whole app, readable in BOTH
// themes: Bootstrap's "-subtle" background with "-emphasis" text adapts
// automatically to data-bs-theme:
//   open = blue, matched = purple, resolved/claimed/verified = green,
//   pending/claim_pending/unclaimed = amber, rejected/closed/disposed = grey.

const COLORS = {
  open: "bg-primary-subtle text-primary-emphasis",
  matched: "badge-matched",
  resolved: "bg-success-subtle text-success-emphasis",
  claimed: "bg-success-subtle text-success-emphasis",
  verified: "bg-success-subtle text-success-emphasis",
  pending: "bg-warning-subtle text-warning-emphasis",
  claim_pending: "bg-warning-subtle text-warning-emphasis",
  unclaimed: "bg-warning-subtle text-warning-emphasis",
  rejected: "bg-secondary-subtle text-secondary-emphasis",
  closed: "bg-secondary-subtle text-secondary-emphasis",
  disposed: "bg-secondary-subtle text-secondary-emphasis",
};

export default function StatusBadge({ status }) {
  const cls = COLORS[status] || "bg-secondary-subtle text-secondary-emphasis";
  return <span className={`badge ${cls}`}>{String(status).replace("_", " ")}</span>;
}
