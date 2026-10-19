"use client";

// app/my-reports/page.js
// Table of the user's lost reports. Each row expands (React state) to
// show its matches with the score as a Bootstrap progress bar. Row
// buttons: "Re-run matching" and "Close report".

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import StatusBadge from "@/components/StatusBadge";
import { closeLostReport, getMatches, getMyLost, rematchReport } from "@/lib/api";
import { showToast } from "@/lib/toast";

export default function MyReportsPage() {
  return (
    <AuthGuard>
      {() => (
        <div>
          <h1 className="h3 mb-1">My lost reports</h1>
          <p className="text-muted">Click a row to see its possible matches.</p>
          <ReportsBody />
        </div>
      )}
    </AuthGuard>
  );
}

function ReportsBody() {
  const [reports, setReports] = useState(null); // null = loading
  const [expandedId, setExpandedId] = useState(null);
  const [matches, setMatches] = useState({}); // report_id -> match list
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let alive = true;
    getMyLost()
      .then((data) => alive && setReports(data))
      .catch((err) => {
        if (alive) setReports([]);
        showToast(err.message, "error");
      });
    return () => {
      alive = false;
    };
  }, []);

  // Expand a row and lazily fetch its matches the first time.
  async function toggleRow(report) {
    if (expandedId === report.report_id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(report.report_id);
    if (!matches[report.report_id]) {
      try {
        const list = await getMatches(report.report_id);
        setMatches((m) => ({ ...m, [report.report_id]: list }));
      } catch (err) {
        showToast(err.message, "error");
      }
    }
  }

  async function rerunMatching(report) {
    setBusyId(report.report_id);
    try {
      const res = await rematchReport(report.report_id);
      showToast(`${res.matches_created} new match(es) found`);
      // Refresh both the report statuses and the expanded match list.
      const [fresh, list] = await Promise.all([getMyLost(), getMatches(report.report_id)]);
      setReports(fresh);
      setMatches((m) => ({ ...m, [report.report_id]: list }));
      setExpandedId(report.report_id);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusyId(null);
    }
  }

  async function closeReport(report) {
    setBusyId(report.report_id);
    try {
      await closeLostReport(report.report_id);
      showToast("Report closed");
      setReports(await getMyLost());
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusyId(null);
    }
  }

  const active = (r) => r.status === "open" || r.status === "matched";

  if (reports === null) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: "var(--lf-accent)" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  if (reports.length === 0) {
    return (
      <div className="alert border">
        You have not reported any lost items yet.{" "}
        <Link href="/report-lost">Report one now</Link>.
      </div>
    );
  }

  return (
    <div className="card shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Category</th>
              <th scope="col">Location</th>
              <th scope="col">Date lost</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-center">Matches</th>
              <th scope="col" className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <ReportRows
                key={report.report_id}
                report={report}
                expanded={expandedId === report.report_id}
                matchList={matches[report.report_id]}
                busy={busyId === report.report_id}
                onToggle={() => toggleRow(report)}
                onRerun={() => rerunMatching(report)}
                onClose={() => closeReport(report)}
                isActive={() => active(report)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// One report renders as two <tr>s: the summary row and (optionally) an
// expanded row with the matches.
function ReportRows({ report, expanded, matchList, busy, onToggle, onRerun, onClose, isActive }) {
  return (
    <>
      <tr onClick={onToggle} style={{ cursor: "pointer" }}>
        <td>
          <span className="me-2">{expanded ? "▾" : "▸"}</span>
          {report.title}
        </td>
        <td>{report.category}</td>
        <td>{report.location}</td>
        <td>{report.date_lost}</td>
        <td><StatusBadge status={report.status} /></td>
        <td className="text-center">{report.match_count}</td>
        <td className="text-end" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-outline-accent btn-sm me-1"
            type="button"
            disabled={!isActive() || busy}
            onClick={onRerun}
          >
            {busy ? "..." : "Re-run matching"}
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            type="button"
            disabled={!isActive() || busy}
            onClick={onClose}
          >
            Close report
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-body-tertiary">
            {!matchList ? (
              <span className="text-muted small">Loading matches...</span>
            ) : matchList.length === 0 ? (
              <span className="text-muted small">
                No matches yet. Try Re-run matching after more items are handed in.
              </span>
            ) : (
              <ul className="list-group list-group-flush">
                {matchList.map((m) => (
                  <li key={m.match_id} className="list-group-item bg-body-tertiary">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <Link href={`/item/${m.item_id}`} className="fw-semibold">
                          {m.item_title}
                        </Link>
                        <div className="small text-muted">
                          {m.category} · {m.location} · found on {m.date_found}
                        </div>
                      </div>
                      <div className="progress" style={{ width: 160 }} role="progressbar"
                        aria-label={`Match score ${m.score} out of 100`}
                        aria-valuenow={m.score} aria-valuemin={0} aria-valuemax={100}>
                        <div className="progress-bar bg-success" style={{ width: `${m.score}%` }}>{m.score}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
