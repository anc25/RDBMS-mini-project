"use client";

// app/admin/page.js
// Admin-only page with three tabs built from React state:
//   1. Claim queue  - pending claims, Verify/Reject open a modal for the note
//   2. Stats        - counters, hotspots, category counts, stale items
//   3. Audit log    - read-only trigger-written events

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import {
  getAdminAudit,
  getAdminClaims,
  getAdminStats,
  rejectClaim,
  verifyClaim,
} from "@/lib/api";
import { showToast } from "@/lib/toast";

export default function AdminPage() {
  return <AuthGuard adminOnly>{() => <AdminBody />}</AuthGuard>;
}

function AdminBody() {
  const [tab, setTab] = useState("queue");

  return (
    <div>
      <h1 className="h3 mb-1">Admin</h1>
      <p className="text-muted">Review claims, watch the stats and check the audit log.</p>

      <ul className="nav nav-tabs mb-3" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "queue"}
            className={`nav-link${tab === "queue" ? " active" : ""}`}
            onClick={() => setTab("queue")}
          >
            Claim queue
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "stats"}
            className={`nav-link${tab === "stats" ? " active" : ""}`}
            onClick={() => setTab("stats")}
          >
            Stats
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "audit"}
            className={`nav-link${tab === "audit" ? " active" : ""}`}
            onClick={() => setTab("audit")}
          >
            Audit log
          </button>
        </li>
      </ul>

      {tab === "queue" && <ClaimQueue />}
      {tab === "stats" && <StatsTab />}
      {tab === "audit" && <AuditTab />}
    </div>
  );
}

// ---------------------------------------------------------------------
// Tab 1: claim queue
// ---------------------------------------------------------------------
function ClaimQueue() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [claims, setClaims] = useState(null); // null = loading
  const [modal, setModal] = useState(null); // { claim, action } | null
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getAdminClaims(statusFilter)
      .then((data) => alive && setClaims(data))
      .catch((err) => {
        if (alive) setClaims([]);
        showToast(err.message, "error");
      });
    return () => {
      alive = false;
    };
  }, [statusFilter]);

  function openModal(claim, action) {
    setModal({ claim, action });
    setNote("");
    setNoteError("");
  }

  async function confirmModal(event) {
    event.preventDefault();
    if (!note.trim()) {
      setNoteError("An admin note is required");
      return;
    }
    setBusy(true);
    try {
      if (modal.action === "verify") {
        await verifyClaim(modal.claim.claim_id, note.trim());
        showToast("Claim verified. Item marked as claimed and handover recorded.");
      } else {
        await rejectClaim(modal.claim.claim_id, note.trim());
        showToast("Claim rejected.");
      }
      setModal(null);
      setClaims(await getAdminClaims(statusFilter));
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-muted small">Showing: {statusFilter === "all" ? "all claims" : `${statusFilter} claims`}</span>
        <select
          className="form-select form-select-sm w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter claims by status"
        >
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {claims === null ? (
        <Loading />
      ) : claims.length === 0 ? (
        <div className="alert border">No claims here right now.</div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Claimant</th>
                  <th scope="col">Item</th>
                  <th scope="col">Linked report</th>
                  <th scope="col">Proof</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr key={c.claim_id}>
                    <td>{c.claim_id}</td>
                    <td>
                      <div>{c.claimant_name}</div>
                      <div className="small text-muted">{c.claimant_email}</div>
                    </td>
                    <td>
                      <Link href={`/item/${c.item_id}`}>{c.item_title}</Link>
                    </td>
                    <td>{c.report_title || <span className="text-muted">-</span>}</td>
                    <td style={{ maxWidth: 260 }}>
                      <span className="small">{c.proof_text}</span>
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="text-end">
                      {c.status === "pending" ? (
                        <>
                          <button className="btn btn-success btn-sm me-1" type="button" onClick={() => openModal(c, "verify")}>
                            Verify
                          </button>
                          <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => openModal(c, "reject")}>
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-muted small">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <Modal
          title={modal.action === "verify" ? `Verify claim #${modal.claim.claim_id}` : `Reject claim #${modal.claim.claim_id}`}
          onClose={() => setModal(null)}
        >
          <form onSubmit={confirmModal} noValidate>
            <p className="small text-muted">
              {modal.claim.claimant_name} claiming <strong>{modal.claim.item_title}</strong>:
              &ldquo;{modal.claim.proof_text}&rdquo;
            </p>
            <div className="mb-3">
              <label htmlFor="admin-note" className="form-label">Admin note</label>
              <textarea
                id="admin-note"
                className={`form-control${noteError ? " is-invalid" : ""}`}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              {noteError && <div className="invalid-feedback">{noteError}</div>}
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary" type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button
                className={`btn ${modal.action === "verify" ? "btn-success" : "btn-danger"}`}
                type="submit"
                disabled={busy}
              >
                {busy ? "Saving..." : modal.action === "verify" ? "Verify claim" : "Reject claim"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Tab 2: stats
// ---------------------------------------------------------------------
function StatsTab() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let alive = true;
    getAdminStats()
      .then((data) => alive && setStats(data))
      .catch((err) => showToast(err.message, "error"));
    return () => {
      alive = false;
    };
  }, []);

  if (!stats) return <Loading />;

  const maxHotspot = Math.max(1, ...stats.hotspots.map((h) => h.count));

  return (
    <div>
      <div className="row g-3 mb-4">
        <Counter label="Open reports" value={stats.counts.open} />
        <Counter label="Matched reports" value={stats.counts.matched} />
        <Counter label="Resolved reports" value={stats.counts.resolved} />
        <Counter label="Closed reports" value={stats.counts.closed} />
        <Counter label="Unclaimed items" value={stats.counts.unclaimed} />
        <Counter label="Claimed items" value={stats.counts.claimed} />
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-body fw-semibold">Hotspot locations (lost reports)</div>
            <ul className="list-group list-group-flush">
              {stats.hotspots.map((h) => (
                <li key={h.location} className="list-group-item d-flex align-items-center gap-3">
                  <span style={{ width: 140 }} className="small">{h.location}</span>
                  <div className="progress flex-grow-1" role="progressbar"
                    aria-label={`${h.location}: ${h.count} lost reports`}
                    aria-valuenow={h.count} aria-valuemin={0} aria-valuemax={maxHotspot}>
                    <div className="progress-bar" style={{ width: `${(h.count / maxHotspot) * 100}%` }}>{h.count}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-body fw-semibold">Reports by category (open / resolved)</div>
            <div className="table-responsive">
              <table className="table table-sm mb-0 align-middle">
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col" className="text-center">Open</th>
                    <th scope="col" className="text-center">Resolved</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.categories.map((c) => (
                    <tr key={c.category}>
                      <td>{c.category}</td>
                      <td className="text-center">{c.open}</td>
                      <td className="text-center">{c.resolved}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-body fw-semibold">Items unclaimed for more than 30 days</div>
            <div className="table-responsive">
              <table className="table table-sm mb-0 align-middle">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col" className="text-end">Days unclaimed</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.stale_items.length === 0 ? (
                    <tr><td colSpan={2} className="text-muted">Nothing stale - everything gets claimed.</td></tr>
                  ) : (
                    stats.stale_items.map((s) => (
                      <tr key={s.item_id}>
                        <td><Link href={`/item/${s.item_id}`}>{s.title}</Link></td>
                        <td className="text-end">{s.days_unclaimed}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Counter({ label, value }) {
  return (
    <div className="col-6 col-md-2">
      <div className="card shadow-sm stat-card">
        <div className="card-body text-center py-3">
          <div className="display-6">{value}</div>
          <div className="small text-muted">{label}</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Tab 3: audit log
// ---------------------------------------------------------------------
function AuditTab() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let alive = true;
    getAdminAudit()
      .then((data) => alive && setRows(data))
      .catch((err) => showToast(err.message, "error"));
    return () => {
      alive = false;
    };
  }, []);

  if (!rows) return <Loading />;

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-body fw-semibold">
        Audit log <span className="text-muted small ms-1">(written by the database triggers)</span>
      </div>
      <div className="table-responsive">
        <table className="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Table</th>
              <th scope="col">Action</th>
              <th scope="col">Record</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.log_id}>
                <td className="small text-nowrap">{row.performed_at}</td>
                <td className="small">{row.table_name}</td>
                <td className="small">{row.action}</td>
                <td className="small">{row.record_id}</td>
                <td className="small">{row.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="text-center py-5">
      <div className="spinner-border" style={{ color: "var(--lf-accent)" }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}
