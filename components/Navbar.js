"use client";

// components/Navbar.js
// Top navigation shown on every page except the landing page ("/").
// The Admin link only appears for admins, and Logout clears the session.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe, logout } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/report-lost", label: "Report Lost" },
  { href: "/report-found", label: "Report Found" },
  { href: "/browse", label: "Browse" },
  { href: "/my-reports", label: "My Reports" },
  { href: "/my-claims", label: "My Claims" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Re-check who is logged in whenever the route changes (e.g. after login).
  useEffect(() => {
    if (pathname === "/") return;
    let alive = true;
    getMe()
      .then((u) => alive && setUser(u))
      .catch(() => alive && setUser(null));
    return () => {
      alive = false;
    };
  }, [pathname]);

  // The landing page has its own hero and auth tabs, no navbar.
  if (pathname === "/") return null;

  // Clicking a link navigates; also collapse the mobile menu.
  function closeMenu() {
    setMenuOpen(false);
  }

  async function onLogout() {
    try {
      await logout();
    } catch {
      // Ignore logout errors - we are leaving anyway.
    }
    router.push("/");
  }

  return (
    <nav className="navbar navbar-expand-lg bg-body border-bottom">
      <div className="container">
        <Link className="navbar-brand lf-brand" href="/dashboard">
          <span className="lf-mark" aria-hidden="true"></span>
          Campus Lost &amp; Found
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-controls="mainNav"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse${menuOpen ? " show" : ""}`} id="mainNav">
          <ul className="navbar-nav me-auto">
            {LINKS.map((link) => (
              <li className="nav-item" key={link.href}>
                <Link
                  className={`nav-link${pathname === link.href ? " active" : ""}`}
                  href={link.href}
                  onClick={closeMenu}
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {user?.role === "admin" && (
              <li className="nav-item">
                <Link
                  className={`nav-link${pathname === "/admin" ? " active" : ""}`}
                  href="/admin"
                  onClick={closeMenu}
                  aria-current={pathname === "/admin" ? "page" : undefined}
                >
                  Admin
                </Link>
              </li>
            )}
          </ul>
          <div className="d-flex align-items-center gap-2">
            {user && <span className="text-muted small me-1">{user.name}</span>}
            <ThemeToggle />
            <button className="btn btn-outline-secondary btn-sm" type="button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
