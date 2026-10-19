# Campus Lost & Found: Product Requirements Document

RDBMS mini project (2 members). Deadline: Thursday, 22 Oct 2026.

## 1. Overview

A web app where students and staff report lost items and found items. The system suggests matches between them, lets owners submit claims, and lets an admin verify claims and record handovers. The database is the star of the project: constraints, joins, views, triggers, a stored procedure and a transaction all do real work.

## 2. Goals and non-goals

**Goals**
- Demonstrate a well-designed relational schema (3NF) with proper keys and constraints.
- Show non-trivial SQL: joins, aggregates, subqueries, a view, triggers, a stored procedure, a transaction.
- Provide a clean, simple web UI to demo the full workflow end to end.
- Build mock-first: the whole app works on fake API responses, then each route is switched to real SQL one at a time.

**Non-goals** (do not build these)
- Email/SMS notifications, image upload, payments, mobile app, real-time chat, ML matching, TypeScript.

## 3. Users and roles

| Role | Can do |
|---|---|
| Student / Staff (`user`) | Register, log in, report lost item, report found item, browse found items, view own matches, submit a claim, track own claims |
| Admin | Everything above, plus review claims (verify/reject), record handovers, view stats and the audit log |

## 4. Core workflow

1. User A loses a phone and files a **lost report**.
2. User B finds a phone and files a **found item**.
3. The system runs matching and creates **Matches** (scored suggestions). User A sees "possible matches".
4. User A opens the found item and submits a **claim** with proof (e.g. "lock screen photo is a cat, case is blue").
5. Item status becomes `claim_pending` (trigger).
6. Admin reviews the claim and marks it **verified** or **rejected**.
7. On verify: item becomes `claimed`, the linked lost report becomes `resolved` (trigger). Admin records the **handover**.
8. Everything important is written to **AuditLog** (trigger).

## 5. Functional requirements

**FR1 Auth.** Register (name, email, phone, password), login, logout. Passwords stored hashed. Signed httpOnly session cookie.
**FR2 Lost reports.** Create, list own, edit own while `open`, close own.
**FR3 Found items.** Create, list all unclaimed, search/filter by category, location, date range, keyword.
**FR4 Matching.** On creating a lost report, call stored procedure `sp_find_matches(report_id)`. Also a "Re-run matching" button.
**FR5 Claims.** A user can claim a found item (optionally linking one of their lost reports). One user cannot have two pending claims on the same item.
**FR6 Admin review.** List pending claims; verify or reject with a note. Only one verified claim per item.
**FR7 Handover.** Admin records who handed the item over, when, and remarks, for verified claims only.
**FR8 Dashboard stats (admin).** Open vs resolved counts, hotspot locations, category breakdown, items unclaimed over 30 days.
**FR9 Audit log (admin).** Read-only list of trigger-written events.

## 6. Tech stack (chosen for simplicity and explainability)

| Layer | Choice | Why it is easy to explain |
|---|---|---|
| Runtime / package manager | **Bun** | One tool to install packages (`bun add`) and run scripts (`bun run dev`); fast installs, single lockfile (`bun.lock`) |
| Framework | **Next.js (App Router), plain JavaScript** | One project holds both the pages and the API; no TypeScript to defend |
| Database | **MySQL 8** | Standard in college labs, supports triggers, procedures, views, CHECK |
| DB access | **`mysql2` with raw SQL** (no ORM) | Examiners can see every query; shows you understand SQL, not a library |
| Backend | **Next.js route handlers** (`app/api/.../route.js`) | Each file is one endpoint and maps 1:1 to the API table below |
| Auth | **`bcryptjs` for password hashing + `iron-session` (signed httpOnly cookie)** | Two small helpers, nothing exotic. Use `bcryptjs` (pure JavaScript), not the native `bcrypt` package, so it installs cleanly under Bun. The seeded `$2b$` hashes verify with it. |
| UI | **Bootstrap 5 (or Tailwind, whichever you know better)** | Fast, clean, familiar |
| Hosting | **localhost** (`npm run dev`) | Same origin for pages and API, so no CORS problems |

Architecture in one line: *Browser (React client components) → fetch → Next.js route handlers → raw SQL → MySQL.*

### 6.1 Mock-first build strategy

The frontend only ever talks to `/api/...` through one helper file, `lib/api.js`. The route handlers start out returning mock JSON in the exact shapes in section 9. Later, each handler's body is replaced with real SQL; nothing in the frontend changes.

Rules that make this work:
- Pages are **client components** (`"use client"`) that call functions from `lib/api.js`. They never import `lib/db.js` and never query the database directly.
- Field names are exactly the `snake_case` names in section 9, in mock and real responses alike.
- Mock handlers keep state in memory (a module-level array in `lib/mock-store.js`) so the demo flow works before the database exists.
- Switch routes to real SQL in this order: auth, found/lost, claims, admin. After each one, click through the app to confirm nothing broke.

### 6.2 Setup and commands with Bun

```
bun create next-app lostfound      # choose: JavaScript, App Router, no TypeScript, no src/ folder
cd lostfound
bun add mysql2 bcryptjs iron-session bootstrap
bun run dev                        # starts the app on http://localhost:3000
bun run build && bun run start     # production-style run, good for the final demo
```

- **Always use Bun commands.** Use `bun add` / `bun install`, never `npm install`. If a `package-lock.json` appears, delete it, and commit `bun.lock`. Both of you must use the same package manager or the lockfiles will conflict.
- **Node.js must still be installed.** `bun run dev` runs the `next dev` script, and Next.js itself runs on Node by default. Bun is the package manager and script runner. If you want Next.js to run on the Bun runtime, use `bunx --bun next dev`, but only try that if the default has a problem, because it is the less common path.
- **Bun loads `.env.local` for scripts and Next.js loads it for the app**, so `process.env.DB_HOST` and the other variables work in the route handlers either way.
- **Keep the database driver as `mysql2`** (works under both Node and Bun). Avoid native-addon packages (`bcrypt`, `sharp` tweaks and the like) unless they are needed; pure JavaScript packages are the safest.
- Put these scripts in `package.json` for convenience: `"db:reset": "mysql -u root -p < sql/reset.sql"` and run it with `bun run db:reset`.
- The final `bun.lock` and `package.json` go in the submission, so the examiner can run `bun install && bun run dev`.

### 6.3 Things that commonly go wrong
- **DB connection:** create the MySQL pool once in `lib/db.js` and reuse it; a new connection per request exhausts connections in dev.
- **Dates:** MySQL returns JS `Date` objects; format them to `YYYY-MM-DD` strings in the route before returning JSON.
- **Trigger errors:** catch `SQLSTATE 45000` errors in the route and return HTTP `409` with `{ "error": "<trigger message>" }`, so the UI shows a readable message instead of a 500.
- **Transactions:** verify-and-handover is the stored procedure `sp_verify_claim` (section 7.7); the route just runs `CALL sp_verify_claim(?, ?, ?, ?)` and the procedure handles the transaction and rollback itself.
- **Procedure results:** `mysql2` returns a `CALL` result nested one level deeper, so read the match count from `rows[0][0].matches_created`.
- **SQL injection:** always use `?` placeholders, never string concatenation.

## 7. Database design

### 7.1 Tables

- `Users(user_id PK, name, email UNIQUE, phone, role ENUM('user','admin'), password_hash, created_at)`
- `Categories(category_id PK, name UNIQUE)`: seed: Phone, Wallet, ID Card, Keys, Bag, Laptop/Charger, Books, Clothing, Other
- `Locations(location_id PK, name UNIQUE, building)`: seed: Library, Mess, Hostel Block A..., Academic Block, Sports Ground, Canteen
- `LostReports(report_id PK, user_id FK, category_id FK, location_id FK, title, description, date_lost, status ENUM('open','matched','resolved','closed') DEFAULT 'open', created_at)`
- `FoundItems(item_id PK, finder_id FK→Users, category_id FK, location_id FK, title, description, date_found, stored_at VARCHAR(100), status ENUM('unclaimed','claim_pending','claimed','disposed') DEFAULT 'unclaimed', created_at)`
- `Matches(match_id PK, report_id FK, item_id FK, score INT, created_at, UNIQUE(report_id, item_id))`
- `Claims(claim_id PK, item_id FK, claimant_id FK→Users, report_id FK NULL, proof_text, status ENUM('pending','verified','rejected') DEFAULT 'pending', reviewed_by FK→Users NULL, admin_note, created_at, reviewed_at NULL)`
- `Handovers(handover_id PK, claim_id FK UNIQUE, handed_by FK→Users, handed_at, remarks)`
- `AuditLog(log_id PK, table_name, action, record_id, details, performed_at)`

### 7.2 Constraints to include
- All FKs with sensible `ON DELETE` (`RESTRICT` for users/categories/locations; `CASCADE` for Matches).
- `UNIQUE(email)`, `UNIQUE(report_id, item_id)` on Matches, `UNIQUE(claim_id)` on Handovers.
- `NOT NULL` on titles, dates, statuses.
- `CHECK (score BETWEEN 0 AND 100)` on Matches.
- Date-in-future checks (`date_lost <= today`) go in a `BEFORE INSERT` trigger, because MySQL does not allow `CURDATE()` inside CHECK.

### 7.3 Normalization note (for the report)
Categories and Locations are separate tables so names are not repeated (removes transitive/redundant data → 3NF). Claims and Matches are separate junction-style entities because the relationships carry their own attributes (proof, status, score).

### 7.4 Triggers (all in `sql/logic.sql`)
1. `trg_claim_before_insert`: reject a claim if the item is already `claimed`/`disposed`, if the claimant is the finder, if the claimant already has a pending claim on the item, or if the linked lost report is not the claimant's.
2. `trg_claim_after_insert`: set item `claim_pending`; write AuditLog.
3. `trg_claim_before_update`: reject re-reviewing a reviewed claim; if status is changing to `verified` and another verified claim exists for the item, `SIGNAL SQLSTATE '45000'`; stamp `reviewed_at`.
4. `trg_claim_after_update`: on `verified`: item → `claimed`, linked report → `resolved`; on `rejected`: if no pending claims remain, item → `unclaimed`. Write AuditLog. (A trigger cannot update its own table, so rejecting the *other* pending claims is done in `sp_verify_claim`.)
5. `trg_lost_before_insert` / `trg_found_before_insert`: reject future dates.
6. `trg_handover_before_insert`: reject handover unless the claim is `verified`.
7. `trg_lost_after_insert`, `trg_found_after_insert`, `trg_handover_after_insert`: write AuditLog rows.

### 7.5 Stored procedure
`sp_find_matches(IN p_report_id INT)` considers only unclaimed / claim-pending found items **in the same category** as the lost report, inserts into Matches (ignoring duplicates), and finally returns one row, `matches_created`. Score:
- same category: +40 (always true, since other categories are skipped)
- same location: +30
- found date within 7 days after lost date: +20
- title keyword overlap (`LIKE` on first word of title): +10

Only insert rows with score ≥ 50. Set the report status to `matched` if any rows were inserted.

### 7.6 Views
- `v_open_found_items`: unclaimed items joined with category and location names.
- `v_claim_details`: claims joined with claimant, item and report titles (used by the admin page).

### 7.7 Transaction example
Admin "verify and hand over" is the stored procedure `sp_verify_claim(claim_id, admin_id, admin_note, handover_remarks)`. In one transaction it: checks the caller is an admin, verifies the claim (fires triggers that update the item, the report and the audit log), rejects every other pending claim on the same item, and inserts the Handover. Any error, including a trigger error, rolls everything back and is re-raised so the route can return a 409.

## 8. Required queries (aim for all of these)

1. Matches for a given lost report, best score first (JOIN).
2. All unclaimed found items filtered by category/location/date.
3. Users with the most lost reports (GROUP BY, ORDER BY, LIMIT).
4. Hotspot locations: count of lost reports per location (GROUP BY).
5. Items unclaimed for more than 30 days (date arithmetic).
6. Category-wise count of resolved vs open reports (conditional aggregation).
7. Lost reports with no matches (LEFT JOIN … IS NULL).
8. Users who have found items and also lost items (`IN` subquery).
9. Claims pending more than 3 days.
10. Average days from report to resolution (JOIN + AVG).
11. Locations where found items outnumber lost reports (HAVING with subquery).
12. Full history of one item: found → matches → claims → handover (multi-JOIN).

## 9. API contract

All responses JSON. Errors: `{ "error": "message" }` with an HTTP status (400 validation, 401 not logged in, 403 not admin, 404 missing, 409 trigger/constraint conflict). Auth via session cookie. `[A]` = admin only. This contract must not change between mock and real mode.

| Method & path | Route file | Purpose |
|---|---|---|
| `POST /api/register` | `app/api/register/route.js` | body: name, email, phone, password |
| `POST /api/login` | `app/api/login/route.js` | body: email, password → `{user}` |
| `POST /api/logout` | `app/api/logout/route.js` | |
| `GET /api/me` | `app/api/me/route.js` | current user or 401 |
| `GET /api/categories`, `GET /api/locations` | `app/api/categories/route.js`, `app/api/locations/route.js` | dropdown data |
| `POST /api/lost` | `app/api/lost/route.js` | create lost report (triggers matching) |
| `GET /api/lost/mine` | `app/api/lost/mine/route.js` | own reports |
| `PATCH /api/lost/[id]` | `app/api/lost/[id]/route.js` | edit/close own report |
| `POST /api/found` | `app/api/found/route.js` | create found item |
| `GET /api/found` | same file | query params: category, location, from, to, q |
| `GET /api/found/[id]` | `app/api/found/[id]/route.js` | item detail |
| `GET /api/lost/[id]/matches` | `app/api/lost/[id]/matches/route.js` | matches for a report |
| `POST /api/lost/[id]/rematch` | `app/api/lost/[id]/rematch/route.js` | re-run matching |
| `POST /api/claims` | `app/api/claims/route.js` | body: item_id, report_id?, proof_text |
| `GET /api/claims/mine` | `app/api/claims/mine/route.js` | own claims |
| `GET /api/admin/claims?status=pending` `[A]` | `app/api/admin/claims/route.js` | claim queue |
| `POST /api/admin/claims/[id]/verify` `[A]` | `.../[id]/verify/route.js` | body: admin_note (runs `CALL sp_verify_claim(...)` from 7.7, which also records the handover) |
| `POST /api/admin/claims/[id]/reject` `[A]` | `.../[id]/reject/route.js` | body: admin_note |
| `GET /api/admin/stats` `[A]` | `app/api/admin/stats/route.js` | hotspots, category counts, counts by status, stale items |
| `GET /api/admin/audit` `[A]` | `app/api/admin/audit/route.js` | latest 100 log rows |

Response shapes are listed in `FRONTEND_BRIEF.md` and must be used exactly as written.

## 10. Non-functional requirements
- Passwords hashed; all SQL parameterized.
- Works on a laptop with only Bun, Node.js and MySQL installed; `bun install && bun run dev` is all it takes after the database is set up.
- Demo-ready seed data: ~10 users, 20 lost reports, 20 found items, a few claims in each state.
- Secrets (DB password, session secret) live in `.env.local`, which is not committed.

## 11. Suggested folder structure

```
lostfound/
  app/
    page.js                 # landing + login/register
    dashboard/page.js
    report-lost/page.js
    report-found/page.js
    browse/page.js
    item/[id]/page.js
    my-reports/page.js
    my-claims/page.js
    admin/page.js
    api/                    # route handlers (section 9)
  components/               # Navbar, StatusBadge, Toast, ItemCard, ...
  lib/
    api.js                  # all frontend fetch calls
    db.js                   # mysql2 pool (real mode)
    session.js              # iron-session helpers
    mock-store.js           # in-memory fake data for mock handlers
  sql/
    schema.sql              # tables, constraints
    logic.sql               # triggers, procedures, views
    seed.sql                # demo data
    reset.sql               # drop + rebuild everything (run from project root)
    queries.sql             # the 12 required queries (you write this)
  docs/                     # ER diagram, report
  package.json
  bun.lock                  # commit this; do not use package-lock.json
  .env.local                # not committed
```

## 12. Work split and plan (4 days)

| Day | Member 1 | Member 2 |
|---|---|---|
| Sun 18 | ER diagram; install MySQL and Bun; run `sql/reset.sql` and check the results (SQL files are already written) | Create the Bun + Next.js project; start opencode on the frontend and mock routes |
| Mon 19 | Review and fix opencode's output; confirm mock demo flow works | The 12 queries, tested in MySQL |
| Tue 20 | Real routes: auth, found, lost (replacing mocks one at a time) | Real routes: claims, admin, stats |
| Wed 21 | End-to-end testing, fix bugs | Report, ER diagram export, screenshots |
| Thu 22 | Final rehearsal and submission | Final rehearsal and submission |

## 13. Report and demo checklist
- Problem statement, ER diagram, relational schema, normalization note.
- Screenshots of the UI and sample query outputs.
- Demo script: report lost → report found → matches appear → claim → admin verifies → statuses change → show AuditLog.
- Be ready to explain: why raw SQL, why triggers hold the status logic, why Matches is its own table, why the frontend only talks to the API.

## 14. Acceptance criteria
- The full workflow in section 4 works from the UI.
- Verifying a second claim on the same item fails with a clear error (HTTP 409 shown in the UI).
- Handover cannot be recorded for an unverified claim.
- All 12 queries run and return sensible results on the seed data.
- Every route has been switched from mock to real SQL, and the frontend needed no changes to support that.
