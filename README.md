# Campus Lost & Found

RDBMS mini project frontend + mock API. Next.js (App Router, plain JavaScript)
run with **Bun**. The whole app currently runs on **mock data** that mirrors
`sql/seed.sql`; every API route is a small file whose body can later be
replaced with real MySQL queries one at a time, without touching any page.

The database ships in two flavours:

- `sql/mysql/` — the original MySQL 8 / MariaDB version **with triggers and
  stored procedures** (for local runs, the report and the viva).
- `sql/tidb/` — a **TiDB Cloud-compatible** version with identical tables and
  data. TiDB does not support triggers/stored procedures, so their effects are
  written out as plain SQL (see `sql/tidb/APP_LOGIC.md`).

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

## Host the database on TiDB Cloud

The cloud version does not use triggers or procedures (TiDB does not support
them), so all files run as-is. Load them **in order**:

1. Create a free TiDB Cloud Starter/Basic cluster and take the connection
   details from *"Connect → SQL (mysql CLI)"* — host
   `<cluster>.prod.<region>.tidbcloud.com`, port `4000`, TLS on.
2. From the project root, run:

```bash
MYSQL="mysql --host <HOST> --port 4000 -u <USER> -p --ssl-mode=VERIFY_IDENTITY"

$MYSQL < sql/tidb/00_create_database.sql
$MYSQL -D lostfound < sql/tidb/01_schema.sql
$MYSQL -D lostfound < sql/tidb/02_views.sql
$MYSQL -D lostfound < sql/tidb/03_seed.sql
$MYSQL -D lostfound < sql/tidb/04_sanity_check.sql   # should print the expected counts
```

(or paste each file into the TiDB Cloud web SQL editor, in the same order.)

3. To connect the Next.js app to it, install `mysql2`, add `lib/db.js` with a
   connection string like
   `mysql://<USER>:<PASSWORD>@<HOST>:4000/lostfound?ssl={"rejectUnauthorized":true}`,
   and start replacing the mock route bodies. The trigger/procedure rules
   (claim checks, match scoring, the verify-and-handover transaction) move
   into the route handlers — the exact SQL is documented in
   [`sql/tidb/APP_LOGIC.md`](sql/tidb/APP_LOGIC.md).

What changed for TiDB:

| MySQL version | TiDB version |
|---|---|
| `trg_*` triggers in `logic.sql` | rules enforced in the app (`APP_LOGIC.md`) |
| `sp_find_matches`, `sp_verify_claim` | plain SQL in the app; seed writes the results directly |
| `SOURCE sql/mysql/...` in `reset.sql` | numbered files run one by one |

## Folder structure

```
app/
  layout.js              Bootstrap 5.3 CDN <link>, <Navbar/>, <ToastHost/>
  page.js                landing page + login/register tabs
  dashboard/page.js      greeting, action cards, counters, lost-reports relay, recent matches
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
sql/
  mysql/                 full version for local MySQL 8 (triggers + procedures)
  tidb/                  TiDB Cloud version: numbered files, no triggers/procedures
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
