// components/StatusBadge.js
// One consistent colour per status across the whole app:
//   open = blue, matched = purple, resolved/claimed/verified = green,
//   pending/claim_pending/unclaimed = amber, rejected/closed/disposed = grey.

const COLORS = {
  open: "bg-primary",
  matched: "badge-matched",
  resolved: "bg-success",
  claimed: "bg-success",
  verified: "bg-success",
  pending: "bg-warning text-dark",
  claim_pending: "bg-warning text-dark",
  unclaimed: "bg-warning text-dark",
  rejected: "bg-secondary",
  closed: "bg-secondary",
  disposed: "bg-secondary",
};

export default function StatusBadge({ status }) {
  const cls = COLORS[status] || "bg-secondary";
  return <span className={`badge ${cls}`}>{String(status).replace("_", " ")}</span>;
}
