"use client";

// app/dashboard/page.js
// Greeting, three big action cards, summary counters and a list of the
// most recent possible matches for this user's lost reports.

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { getMatches, getMyClaims, getMyLost } from "@/lib/api";
import { showToast } from "@/lib/toast";

export default function DashboardPage() {
  return <AuthGuard>{(user) => <DashboardBody user={user} />}</AuthGuard>;
}

function DashboardBody({ user }) {
  const [reports, setReports] = useState(null); // null = still loading
  const [claims, setClaims] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mine = await getMyLost();
        if (!alive) return;
        setReports(mine);
        const myClaims = await getMyClaims();
        if (!alive) return;
        setClaims(myClaims);
        // Collect the matches of every report that is still active and
        // show the best five, highest score first.
        const active = mine.filter((r) => r.match_count > 0 && (r.status === "open" || r.status === "matched"));
        const lists = await Promise.all(active.map((r) => getMatches(r.report_id)));
        if (!alive) return;
        setRecentMatches(lists.flat().sort((a, b) => b.score - a.score).slice(0, 5));
      } catch (err) {
        showToast(err.message, "error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // "Open" means the item is still being looked for (open or matched).
  const openReports = (reports || []).filter((r) => r.status === "open" || r.status === "matched").length;
  const pendingClaims = (claims || []).filter((c) => c.status === "pending").length;
  const matchCount = (reports || []).reduce((sum, r) => sum + r.match_count, 0);

  return (
    <div>
      <h1 className="h3 mb-1">Hello, {user.name}</h1>
      <p className="text-muted">Here is what is happening with your lost and found items.</p>

      <div className="row g-3 mb-4">
        <ActionCard href="/report-lost" title="Report Lost" text="Tell us what you lost and where - we will look for matches." />
        <ActionCard href="/report-found" title="Report Found" text="Found something? Add it so its owner can claim it." />
        <ActionCard href="/browse" title="Browse Found Items" text="Look through everything currently waiting to be claimed." />
      </div>

      <div className="row g-3 mb-4">
        <Counter label="My open reports" value={reports === null ? "..." : openReports} />
        <Counter label="My pending claims" value={claims === null ? "..." : pendingClaims} />
        <Counter label="Matches found" value={reports === null ? "..." : matchCount} />
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white fw-semibold">Recent possible matches</div>
        <div className="card-body">
          {recentMatches.length === 0 ? (
            <p className="text-muted mb-0">
              No possible matches yet. Matches appear here when a found item looks like something you lost.
            </p>
          ) : (
            <div className="list-group list-group-flush">
              {recentMatches.map((m) => (
                <Link key={m.match_id} href={`/item/${m.item_id}`} className="list-group-item list-group-item-action">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{m.item_title}</div>
                      <div className="small text-muted">
                        {m.category} · {m.location} · found on {m.date_found}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-accent">{m.score}</div>
                      <div className="small text-muted">match score</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ href, title, text }) {
  return (
    <div className="col-md-4">
      <Link href={href} className="text-decoration-none">
        <div className="card h-100 shadow-sm h-100">
          <div className="card-body">
            <h5 className="card-title text-accent">{title}</h5>
            <p className="card-text text-muted small mb-0">{text}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}

function Counter({ label, value }) {
  return (
    <div className="col-md-4">
      <div className="card shadow-sm stat-card">
        <div className="card-body text-center py-3">
          <div className="display-6">{value}</div>
          <div className="small text-muted">{label}</div>
        </div>
      </div>
    </div>
  );
}
