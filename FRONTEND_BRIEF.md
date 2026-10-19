# Task: Build the app shell for "Campus Lost & Found" (Next.js + Bun, mock-first)

Read `PRD.md` first, then read `sql/schema.sql` and `sql/seed.sql`. Build every page and every API route handler described below. The route handlers must return **mock data** for now. A teammate will replace the mock bodies with real MySQL queries later, one route at a time, so the pages must not need to change when that happens.

**Do not touch the `sql/` folder.** Do not write any database code (no `mysql2`, no `lib/db.js`). Do not add TypeScript.

## Hard constraints
- **Bun** is the package manager and script runner: use `bun add` and `bun run dev`. Never use npm, yarn or pnpm, and do not create `package-lock.json`.
- **Next.js App Router, plain JavaScript** (`.js` files, no TypeScript).
- **Bootstrap 5.3 loaded from the CDN `<link>` in `app/layout.js`.** Do not use Bootstrap's JavaScript. Build modals, tabs, toasts and collapsible rows with simple React state and Bootstrap CSS classes.
- Pages are **client components** (`"use client"`) that get all their data by calling functions in `lib/api.js`. Pages never call `fetch` directly and never import anything from the database layer.
- Code must be clean, commented and simple enough for two students to explain line by line in a viva. Prefer small functions and small components over cleverness. No state-management libraries, no data-fetching libraries.
- Responsive and accessible (labels on inputs, real `<button>` elements), light and clean design with one accent colour.
- Escape nothing manually: render user text through normal JSX (never `dangerouslySetInnerHTML`).

## Folder structure to create
```
app/
  layout.js                 # Bootstrap CDN link, <Navbar/>, toast container
  page.js                   # landing + login/register
  dashboard/page.js
  report-lost/page.js
  report-found/page.js
  browse/page.js
  item/[id]/page.js
  my-reports/page.js
  my-claims/page.js
  admin/page.js
  api/                      # mock route handlers (see "API contract")
components/                 # Navbar, StatusBadge, Toast, ItemCard, AuthGuard, ...
lib/
  api.js                    # ALL fetch calls, one function per endpoint
  mock-store.js             # in-memory fake data + helper functions for the handlers
README.md                   # short: structure, how api.js works, how to run, how to swap mock for real
```

## The two files that matter most

**`lib/api.js`**: one exported async function per endpoint (`login`, `getFound`, `createLost`, `submitClaim`, ...). Each calls `fetch("/api/...", { credentials: "same-origin" })`, parses JSON, and on a non-2xx response throws `new Error(data.error)` so pages can show the server's message in a toast. This file is identical in mock and real mode.

**`lib/mock-store.js`**: holds the fake data and keeps it in memory so the demo flow works (creating a lost report adds it to the list, submitting a claim changes the item status, verifying a claim changes statuses, and so on). Store the data on `globalThis` so Next.js hot reloads do not reset it. Route handlers import helpers from here, so replacing a handler with real SQL later means deleting its import from `mock-store.js` and nothing else.

## Mock authentication
- `POST /api/login` checks email and password against the mock users, then sets an httpOnly cookie `mock_user_id=<id>` on the response. `GET /api/me` reads that cookie. `POST /api/logout` clears it. (A teammate will swap this for `iron-session` later; keep the cookie logic inside one small helper `lib/mock-auth.js` so it is easy to replace.)
- Admin-only routes return `403 {"error":"Admin only"}` for non-admins and `401 {"error":"Not logged in"}` when there is no cookie.
- Mock logins (these match `sql/seed.sql`): `user@test.com` / `user123` (student) and `admin@test.com` / `admin123` (admin).

## Roles and guards
- Every page except `/` uses an `AuthGuard` component that calls `getMe()`; on 401 it redirects to `/`.
- Show the Admin link in the navbar only when `user.role === "admin"`. The `/admin` page redirects non-admins to `/dashboard`.

## Pages and behaviour

**`/` (landing)**: Hero with a short tagline, tabs for Login and Register (tabs made with React state). Register fields: name, email, phone, password. Client-side validation. On success go to `/dashboard`.

**`/dashboard`**: Greeting, three big action cards (Report Lost, Report Found, Browse Found Items), summary counters (my open reports, my pending claims, matches found), and a "Recent possible matches" list.

**`/report-lost` and `/report-found`**: Form with title, category (dropdown from `/api/categories`), location (dropdown from `/api/locations`), date (max = today), description (textarea). The found form also has "currently stored at". Inline validation, success toast, then redirect (lost goes to `/my-reports`, found goes to `/browse`).

**`/browse`**: Filter bar (keyword, category, location, from-date, to-date) and a card grid of unclaimed found items. Each card shows title, category badge, location, date and a "View" button. Include loading and empty states.

**`/item/[id]`**: Full item details. A "Claim this item" form (proof text, plus an optional dropdown of my open lost reports to link). If the item is not `unclaimed` or `claim_pending`, disable the form and show a badge instead.

**`/my-reports`**: Table of my lost reports with status badges (open, matched, resolved, closed). Each row expands (React state) to show its matches: item title, score as a Bootstrap progress bar, link to the item. Buttons per row: Re-run matching, Close report.

**`/my-claims`**: Table of my claims with status badges (pending, verified, rejected) and the admin note if there is one.

**`/admin`** (admin only), three tabs:
1. *Claim queue*: pending claims with claimant, item, proof text, linked report. Verify and Reject buttons each open a modal (React state plus Bootstrap modal CSS classes) asking for an admin note.
2. *Stats*: counters, a table of hotspot locations, a table of category counts, and a list of items unclaimed for more than 30 days. Use plain Bootstrap tables and progress bars, no chart library.
3. *Audit log*: read-only table (time, table, action, record id, details).

## Shared UI
- Navbar on every page except `/`: brand, links, user name, Logout button.
- `StatusBadge` component with consistent colours: open = blue, matched = purple, resolved / claimed / verified = green, pending / claim_pending / unclaimed = amber, rejected / closed / disposed = grey.
- Toast component for success and errors, used by every form and action.

## API contract (build these as route handlers returning mock data)

All JSON. Errors return `{ "error": "message" }` with status 400 (validation), 401 (not logged in), 403 (not admin), 404 (not found), or 409 (conflict). Use **exactly** these field names (snake_case) so real responses can match later. A `[A]` marks admin-only.

```
POST /api/register   {name,email,phone,password}            -> {user}
POST /api/login      {email,password}                       -> {user}
POST /api/logout                                            -> {ok:true}
GET  /api/me                                                -> {user} | 401
  user = {user_id,name,email,phone,role}

GET  /api/categories -> [{category_id,name}]
GET  /api/locations  -> [{location_id,name,building}]

POST  /api/lost   {title,category_id,location_id,date_lost,description} -> {report_id}
GET   /api/lost/mine -> [{report_id,title,category,location,date_lost,description,status,match_count}]
PATCH /api/lost/[id] {status:"closed"} -> {ok:true}
GET   /api/lost/[id]/matches -> [{match_id,item_id,item_title,category,location,date_found,score}]
POST  /api/lost/[id]/rematch -> {matches_created:n}

POST /api/found  {title,category_id,location_id,date_found,description,stored_at} -> {item_id}
GET  /api/found?category=&location=&from=&to=&q= -> [{item_id,title,category,location,date_found,description,status}]
GET  /api/found/[id] -> {item_id,title,category,location,date_found,description,stored_at,status}

POST /api/claims {item_id,report_id|null,proof_text} -> {claim_id}
GET  /api/claims/mine -> [{claim_id,item_id,item_title,status,admin_note,created_at,reviewed_at}]

GET  /api/admin/claims?status=pending [A] -> [{claim_id,claimant_name,claimant_email,item_id,item_title,report_title|null,proof_text,status,created_at}]
POST /api/admin/claims/[id]/verify {admin_note} [A] -> {ok:true}
POST /api/admin/claims/[id]/reject {admin_note} [A] -> {ok:true}
GET  /api/admin/stats [A] -> {counts:{open,matched,resolved,closed,unclaimed,claimed},
                              hotspots:[{location,count}],
                              categories:[{category,open,resolved}],
                              stale_items:[{item_id,title,days_unclaimed}]}
GET  /api/admin/audit [A] -> [{log_id,table_name,action,record_id,details,performed_at}]
```

Dates are plain `YYYY-MM-DD` strings (and `YYYY-MM-DD HH:MM:SS` for timestamps).

## Mock behaviour that must mimic the real database rules
The real database enforces these with triggers, so the mock handlers should return the same errors (status 409, `{error: "..."}`) for the same situations:
- A claim on an item that is already `claimed` -> `"This item is no longer available to claim"`.
- A user claiming an item they reported as found -> `"You cannot claim an item you found yourself"`.
- A second pending claim by the same user on the same item -> `"You already have a pending claim on this item"`.
- Verifying a claim when another claim on the item is already verified -> `"Another claim is already verified for this item"`.
- A date in the future on a lost or found report -> `400` `"Date cannot be in the future"`.
When a claim is verified in mock mode: the item becomes `claimed`, the linked lost report becomes `resolved`, and every other pending claim on that item becomes `rejected` with the note `"Another claim was verified for this item"`. When a claim is rejected and no other pending claims remain, the item goes back to `unclaimed`. When a lost report is created, mock matching should create matches against unclaimed found items in the **same category** and score them: same category 40, same location +30, found within 7 days after the loss +20, first title word appears in the found title +10; keep only scores of 50 or more.

## Mock data
Mirror `sql/seed.sql` so the mock app and the real database tell the same story: the same 10 users, 9 categories, 8 locations, 20 lost reports, 20 found items and 9 claims (3 verified, 2 rejected, 4 pending), with the same statuses the seed produces. Compute dates relative to today (for example, 6 days ago) so the stale-items list and the "pending more than 3 days" cases still work. Generate roughly 30 audit-log rows from these events.

## Definition of done
- Every page above exists, loads without console errors, and works end to end with the mock routes.
- The demo flow works: log in as the student, report lost, report found, see a match, claim, log in as admin, verify, see statuses change everywhere.
- The five mock rules above return the specified error messages.
- `bun install && bun run dev` starts the app with no other setup.
- A short `README.md` explains the folder structure, how `lib/api.js` and `lib/mock-store.js` work, and how a route is switched from mock to real (replace the handler body, keep the response shape).
