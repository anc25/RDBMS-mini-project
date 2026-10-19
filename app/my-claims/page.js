"use client";

// app/my-claims/page.js
// Table of the user's claims with status badges and the admin note.

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import StatusBadge from "@/components/StatusBadge";
import { getMyClaims } from "@/lib/api";
import { showToast } from "@/lib/toast";

export default function MyClaimsPage() {
  return (
    <AuthGuard>
      {() => (
        <div>
          <h1 className="h3 mb-1">My claims</h1>
          <p className="text-muted">Claims you have submitted and what the admin decided.</p>
          <ClaimsBody />
        </div>
      )}
    </AuthGuard>
  );
}

function ClaimsBody() {
  const [claims, setClaims] = useState(null); // null = loading

  useEffect(() => {
    let alive = true;
    getMyClaims()
      .then((data) => alive && setClaims(data))
      .catch((err) => {
        if (alive) setClaims([]);
        showToast(err.message, "error");
      });
    return () => {
      alive = false;
    };
  }, []);

  if (claims === null) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: "var(--lf-accent)" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  if (claims.length === 0) {
    return (
      <div className="alert alert-light border">
        You have not claimed anything yet. Found your item in <Link href="/browse">Browse</Link>?
      </div>
    );
  }

  return (
    <div className="card shadow-sm">
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col">#</th>
              <th scope="col">Item</th>
              <th scope="col">Status</th>
              <th scope="col">Admin note</th>
              <th scope="col">Submitted</th>
              <th scope="col">Reviewed</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.claim_id}>
                <td>{c.claim_id}</td>
                <td>
                  <Link href={`/item/${c.item_id}`}>{c.item_title}</Link>
                </td>
                <td><StatusBadge status={c.status} /></td>
                <td>{c.admin_note || <span className="text-muted">-</span>}</td>
                <td className="small">{c.created_at}</td>
                <td className="small">{c.reviewed_at || <span className="text-muted">-</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
