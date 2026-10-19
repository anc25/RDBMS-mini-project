"use client";

// components/AuthGuard.js
// Wraps every page except "/". It asks /api/me who is logged in:
//   - no session        -> redirect to "/" (the login page)
//   - adminOnly page, non-admin -> redirect to "/dashboard"
//   - otherwise         -> render children as a function: {(user) => ...}
// This render-prop style lets pages use the logged-in user's name/id.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/api";

export default function AuthGuard({ adminOnly = false, children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    getMe()
      .then((u) => {
        if (!alive) return;
        if (!u) {
          router.replace("/");
          return;
        }
        if (adminOnly && u.role !== "admin") {
          router.replace("/dashboard");
          return;
        }
        setUser(u);
        setChecked(true);
      })
      .catch(() => {
        if (alive) router.replace("/");
      });
    return () => {
      alive = false;
    };
  }, [adminOnly, router]);

  if (!checked) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: "var(--lf-accent)" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return children(user);
}
