"use client";

// app/item/[id]/page.js
// Full detail of one found item, plus the "Claim this item" form.
// The claim form is disabled (and a badge shown instead) when the item
// is not unclaimed or claim_pending.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import StatusBadge from "@/components/StatusBadge";
import { getFoundItem, getMyLost, submitClaim } from "@/lib/api";
import { showToast } from "@/lib/toast";

export default function ItemPage() {
  return (
    <AuthGuard>
      {() => <ItemBody />}
    </AuthGuard>
  );
}

function ItemBody() {
  const params = useParams();
  const itemId = params.id;

  const [item, setItem] = useState(null);
  const [missing, setMissing] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [proof, setProof] = useState("");
  const [reportId, setReportId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getFoundItem(itemId);
        if (!alive) return;
        setItem(data);
      } catch (err) {
        if (alive) setMissing(true);
      }
      try {
        const mine = await getMyLost();
        if (!alive) return;
        // Only reports that are still active can be linked to a claim.
        setMyReports(mine.filter((r) => r.status === "open" || r.status === "matched"));
      } catch {
        // Non-fatal: the dropdown just stays empty.
      }
    })();
    return () => {
      alive = false;
    };
  }, [itemId]);

  const claimable = item && (item.status === "unclaimed" || item.status === "claim_pending");

  async function onClaim(event) {
    event.preventDefault();
    if (!proof.trim()) {
      setError("Please describe something only the owner would know");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await submitClaim({
        item_id: Number(itemId),
        report_id: reportId ? Number(reportId) : null,
        proof_text: proof.trim(),
      });
      showToast("Claim submitted. The admin will review it soon.");
      setProof("");
      setReportId("");
      const fresh = await getFoundItem(itemId);
      setItem(fresh);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (missing) {
    return <div className="alert alert-warning">This item does not exist (or was removed).</div>;
  }
  if (!item) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: "var(--lf-accent)" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <h1 className="h3 mb-1">{item.title}</h1>
              <StatusBadge status={item.status} />
            </div>
            <span className="badge text-bg-light border mb-3">{item.category}</span>
            <dl className="row mb-0">
              <dt className="col-sm-4">Found at</dt>
              <dd className="col-sm-8">{item.location}</dd>
              <dt className="col-sm-4">Date found</dt>
              <dd className="col-sm-8">{item.date_found}</dd>
              <dt className="col-sm-4">Currently stored at</dt>
              <dd className="col-sm-8">{item.stored_at || "Not specified"}</dd>
              <dt className="col-sm-4">Description</dt>
              <dd className="col-sm-8">{item.description || "No description"}</dd>
            </dl>
          </div>
        </div>

        {claimable ? (
          <div className="card shadow-sm">
            <div className="card-header bg-white fw-semibold">Claim this item</div>
            <div className="card-body">
              <form onSubmit={onClaim} noValidate>
                <div className="mb-3">
                  <label htmlFor="claim-proof" className="form-label">Proof of ownership</label>
                  <textarea
                    id="claim-proof"
                    className={`form-control${error ? " is-invalid" : ""}`}
                    rows={3}
                    placeholder="e.g. Lock screen is a photo of my cat and the case is blue"
                    value={proof}
                    onChange={(e) => setProof(e.target.value)}
                  />
                  {error && <div className="invalid-feedback">{error}</div>}
                </div>
                <div className="mb-3">
                  <label htmlFor="claim-report" className="form-label">Link one of my lost reports (optional)</label>
                  <select
                    id="claim-report"
                    className="form-select"
                    value={reportId}
                    onChange={(e) => setReportId(e.target.value)}
                  >
                    <option value="">No linked report</option>
                    {myReports.map((r) => (
                      <option key={r.report_id} value={r.report_id}>
                        #{r.report_id} - {r.title}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Linking your own lost report helps the admin verify your claim faster.
                  </div>
                </div>
                <button className="btn btn-accent" type="submit" disabled={busy}>
                  {busy ? "Submitting..." : "Submit claim"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="alert alert-light border d-flex align-items-center gap-2">
            <StatusBadge status={item.status} />
            <span>
              {item.status === "claimed"
                ? "This item has already been claimed and handed over."
                : item.status === "disposed"
                  ? "This item has been disposed of."
                  : "This item is not open for new claims."}
            </span>
          </div>
        )}

        <p className="mt-3">
          <Link href="/browse" className="link-secondary">Back to browse</Link>
        </p>
      </div>
    </div>
  );
}
