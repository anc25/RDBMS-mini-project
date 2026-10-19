# Campus Lost & Found

RDBMS mini project frontend + mock API. Next.js (App Router, plain JavaScript)
run with **Bun**. The whole app currently runs on **mock data** that mirrors
`sql/seed.sql`; every API route is a small file whose body can later be
replaced with real MySQL queries one at a time, without touching any page.

## How to run

```bash
bun install
bun run dev        # http://localhost:3000
```

Demo logins (identical to `sql/seed.sql`):

| Email | Password | Role |
|---|---|---|
| `user@test.com` | `user123` | student |
| `admin@test.com` | `admin123` | admin |

## Folder structure

```
app/
  layout.js              Bootstrap 5.3 CDN <link>, <Navbar/>, <ToastHost/>
  page.js                landing page + login/register tabs
  dashboard/page.js      greeting, action cards, counters, recent matches
  report-lost/page.js    lost report form
  report-found/page.js   found item form (+"currently stored at")
  browse/page.js         filter bar + card grid of unclaimed found items
  item/[id]/page.js      item detail + claim form
  my-reports/page.js     expandable rows with matches + rematch/close
  my-claims/page.js      own claims with admin notes
  admin/page.js          claim queue (modals), stats, audit log
  api/...                route handlers - currently mock, one per endpoint
components/
  Navbar.js  AuthGuard.js  StatusBadge.js  Toast.js  ItemCard.js  Modal.js
lib/
  api.js                 ALL frontend fetch calls, one function per endpoint
  mock-store.js          in-memory fake DB mirroring sql/seed.sql
  mock-auth.js           mock session cookie helpers (swap for iron-session)
  toast.js / dates.js    tiny helpers
sql/                      the real database (never touched by the frontend)
```

## How `lib/api.js` works

Pages are client components (`"use client"`) and never call `fetch`
themselves. They call functions like `login()`, `getFound()`,
`submitClaim()` from `lib/api.js`. Each function does one thing:

1. `fetch("/api/...", { credentials: "same-origin" })`
2. parse the JSON body
3. on a non-2xx response `throw new Error(data.error)` - pages catch this
   and show the server's message in a toast.

## How `lib/mock-store.js` works

The route handlers import helpers from `lib/mock-store.js`, which holds the
fake data in memory on `globalThis` (so Next.js hot reloads do not reset the
demo). It contains:

- the exact seed data from `sql/seed.sql` (10 users, 9 categories,
  8 locations, 20 lost reports, 20 found items, 9 claims, ~57 audit rows),
  with dates computed relative to today, like `CURDATE() - INTERVAL n DAY`;
- mock versions of the database rules: `sp_find_matches` scoring, the claim
  triggers, and `sp_verify_claim` - including the same error messages the
  triggers raise (returned as HTTP 409).

So the demo flow works end to end before MySQL exists: report lost ->
matches appear -> claim -> admin verifies -> statuses change everywhere.

## How to switch a route from mock to real

1. Open the route file (e.g. `app/api/found/[id]/route.js`).
2. Replace the mock-store import/calls inside the handler body with a
   `mysql2` query (pool from `lib/db.js`, `?` placeholders).
3. Keep the **exact response shape** (same snake_case field names) and the
   same error statuses (400/401/403/404/409) - the frontend already expects
   them. Remove that handler's helper from `lib/mock-store.js` when it is
   no longer used.

The switch order suggested in the PRD: auth -> found/lost -> claims -> admin.
`lib/mock-auth.js` is replaced wholesale by `iron-session` when auth goes
real; only that one file changes.
