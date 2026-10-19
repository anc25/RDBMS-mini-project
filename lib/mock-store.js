// =====================================================================
// lib/mock-store.js
// In-memory fake database for the mock API. It mirrors sql/seed.sql:
// the same 10 users, 9 categories, 8 locations, 20 lost reports,
// 20 found items, 9 claims (3 verified, 2 rejected, 4 pending) and the
// audit rows the real triggers would write.
//
// Dates are computed relative to "today" (like CURDATE() - INTERVAL n DAY
// in the seed), so the stale-items list and "pending > 3 days" cases
// always work.
//
// The store lives on globalThis so Next.js hot reloads do not wipe it.
// Route handlers import the helpers below. When a handler is switched to
// real SQL, simply delete its import from here - nothing else changes.
// =====================================================================

// ---------- small date helpers (all local time) ----------
function pad(n) {
  return String(n).padStart(2, "0");
}
function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatDateTime(d) {
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function dateDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
}
function tsDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDateTime(d);
}
function nowTs() {
  return formatDateTime(new Date());
}
function todayStr() {
  return formatDate(new Date());
}
// Parse a "YYYY-MM-DD" string into a Date at local midnight.
function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
// Whole days from `from` to `to`.
function diffDays(to, from) {
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

// ---------- seed data (copied from sql/seed.sql) ----------
// Passwords are plain text here because this is a MOCK store; the real
// database stores bcrypt hashes and the real login route uses bcryptjs.
const SEED_USERS = [
  { user_id: 1, name: "Campus Admin", email: "admin@test.com", phone: "9000000001", role: "admin", password: "admin123" },
  { user_id: 2, name: "Anchal Singh", email: "user@test.com", phone: "9000000002", role: "user", password: "user123" },
  { user_id: 3, name: "Rohan Mehta", email: "rohan.mehta@example.edu", phone: "9000000003", role: "user", password: "user123" },
  { user_id: 4, name: "Priya Sharma", email: "priya.sharma@example.edu", phone: "9000000004", role: "user", password: "user123" },
  { user_id: 5, name: "Aditya Verma", email: "aditya.verma@example.edu", phone: "9000000005", role: "user", password: "user123" },
  { user_id: 6, name: "Sneha Gupta", email: "sneha.gupta@example.edu", phone: "9000000006", role: "user", password: "user123" },
  { user_id: 7, name: "Karan Joshi", email: "karan.joshi@example.edu", phone: "9000000007", role: "user", password: "user123" },
  { user_id: 8, name: "Neha Reddy", email: "neha.reddy@example.edu", phone: "9000000008", role: "user", password: "user123" },
  { user_id: 9, name: "Vikram Singh", email: "vikram.singh@example.edu", phone: "9000000009", role: "user", password: "user123" },
  { user_id: 10, name: "Ishita Rao", email: "ishita.rao@example.edu", phone: "9000000010", role: "user", password: "user123" },
];

const SEED_CATEGORIES = [
  { category_id: 1, name: "Phone" },
  { category_id: 2, name: "Wallet" },
  { category_id: 3, name: "ID Card" },
  { category_id: 4, name: "Keys" },
  { category_id: 5, name: "Bag" },
  { category_id: 6, name: "Laptop/Charger" },
  { category_id: 7, name: "Books" },
  { category_id: 8, name: "Clothing" },
  { category_id: 9, name: "Other" },
];

const SEED_LOCATIONS = [
  { location_id: 1, name: "Library", building: "Central Library" },
  { location_id: 2, name: "Mess", building: "Dining Hall" },
  { location_id: 3, name: "Hostel Block A", building: "Hostel" },
  { location_id: 4, name: "Hostel Block B", building: "Hostel" },
  { location_id: 5, name: "Academic Block", building: "Academic Block 1" },
  { location_id: 6, name: "Sports Ground", building: "Sports Complex" },
  { location_id: 7, name: "Canteen", building: "Food Court" },
  { location_id: 8, name: "Auditorium", building: "Main Auditorium" },
];

// (report_id, user_id, category_id, location_id, title, description, days ago)
const SEED_LOST = [
  [1, 2, 1, 1, "Black iPhone 13", "Black iPhone with a blue silicone case, cat photo as lock screen", 6],
  [2, 3, 2, 7, "Brown leather wallet", "Brown wallet with my college ID and a Rs 500 note", 8],
  [3, 4, 3, 5, "Student ID card", "ID card on a green lanyard, name Priya Sharma", 5],
  [4, 5, 4, 3, "Hostel room keys", "Two keys on a red keychain with a bottle opener", 10],
  [5, 6, 5, 1, "Grey backpack", "Grey backpack with a laptop sleeve and two notebooks inside", 4],
  [6, 7, 6, 5, "Laptop charger", "Dell 65W charger with a black cable", 12],
  [7, 8, 7, 1, "DBMS textbook", "Database System Concepts, my name is written on the first page", 7],
  [8, 9, 8, 6, "Blue hoodie", "Navy blue hoodie with the university logo, size M", 9],
  [9, 10, 1, 2, "Redmi Note phone", "Redmi phone with a cracked screen guard", 3],
  [10, 2, 4, 1, "Bike keys", "Honda bike key with a black rubber cover", 15],
  [11, 3, 9, 4, "Water bottle", "Silver steel bottle with a sticker on it", 20],
  [12, 4, 5, 7, "Black sling bag", "Small black sling bag with earphones inside", 2],
  [13, 5, 2, 1, "Black wallet", "Black card holder wallet", 11],
  [14, 6, 3, 4, "Library card", "Library card with the name Sneha Gupta", 14],
  [15, 7, 1, 1, "Samsung phone", "Samsung Galaxy with a black cover", 5],
  [16, 8, 6, 1, "HP laptop", "15 inch silver HP laptop with stickers on the lid", 6],
  [17, 9, 7, 5, "Maths notebook", "Spiral notebook with a blue cover, my name inside the front page", 13],
  [18, 10, 9, 6, "Spectacles", "Black frame spectacles in a brown case", 8],
  [19, 2, 8, 2, "Black jacket", "Black zip jacket with an Adidas logo, name tag inside the collar", 16],
  [20, 3, 1, 1, "Realme phone", "Realme phone with a transparent case", 1],
];

// (item_id, finder_id, category_id, location_id, title, description, stored_at, days ago)
const SEED_FOUND = [
  [1, 3, 1, 1, "Black iPhone", "Black iPhone with a blue case, found near the reading hall", "Library help desk", 5],
  [2, 4, 2, 7, "Brown wallet", "Brown leather wallet found on a canteen table", "Security office", 7],
  [3, 5, 3, 5, "Student ID card", "ID card on a green lanyard, found near the Block 1 stairs", "Academic Block office", 4],
  [4, 6, 4, 3, "Keys with red keychain", "Two keys on a red keychain", "Warden office", 9],
  [5, 7, 5, 1, "Grey bag", "Grey backpack left on a library table", "Library help desk", 3],
  [6, 8, 6, 5, "Laptop charger", "Dell charger found in a classroom", "Academic Block office", 11],
  [7, 9, 7, 1, "DBMS book", "Database System Concepts textbook", "Library help desk", 6],
  [8, 10, 8, 6, "Navy hoodie", "Blue hoodie left on a bench", "Sports office", 8],
  [9, 2, 4, 2, "Scooter keys", "Keys with a yellow tag", "Mess office", 40],
  [10, 3, 9, 8, "Black umbrella", "Folding black umbrella", "Auditorium office", 35],
  [11, 4, 1, 2, "Redmi phone", "Redmi phone with a broken screen guard on a mess table", "Mess office", 2],
  [12, 5, 9, 6, "Black spectacles", "Spectacles in a brown case", "Sports office", 7],
  [13, 6, 1, 1, "Samsung phone", "Samsung Galaxy with a black cover", "Library help desk", 4],
  [14, 7, 6, 1, "Silver HP laptop", "HP laptop with stickers on the lid", "Library help desk", 5],
  [15, 8, 5, 7, "Black sling bag", "Sling bag with earphones inside", "Canteen counter", 1],
  [16, 9, 2, 1, "Black card holder", "Card holder with a few cards inside", "Library help desk", 10],
  [17, 10, 8, 2, "Black jacket", "Black zip jacket", "Mess office", 14],
  [18, 2, 7, 5, "Notebook", "Blue spiral notebook", "Academic Block office", 12],
  [19, 3, 9, 7, "Steel lunch box", "Steel tiffin box", "Canteen counter", 45],
  [20, 4, 4, 1, "Bike key", "Honda key with a rubber cover", "Library help desk", 13],
];

// (claim_id, item_id, claimant_id, report_id|null, proof_text, created days ago)
const SEED_CLAIMS = [
  [1, 1, 2, 1, "Lock screen is a photo of my cat and the case is blue", 2],
  [2, 2, 3, 2, "Wallet has my college ID and a Rs 500 note inside", 6],
  [3, 17, 2, 19, "Black Adidas jacket with my name tag inside the collar", 13],
  [4, 18, 9, 17, "Blue notebook with my name written on the first page", 10],
  [5, 6, 7, 6, "Dell 65W charger, the cable has black tape near the plug", 5],
  [6, 3, 4, 3, "It is my ID card, name Priya Sharma and roll number on the front", 1],
  [7, 3, 6, null, "I think this is my ID card, I lost it near the stairs", 1],
  [8, 8, 9, 8, "Navy hoodie, size M, university logo with a small ink stain on the cuff", 7],
  [9, 8, 4, null, "I believe this hoodie is mine", 6],
];

// =====================================================================
// Store creation: builds every table and replays the seed exactly the
// way schema.sql + logic.sql + seed.sql would.
// =====================================================================
function createStore() {
  const db = {
    users: [],
    categories: [],
    locations: [],
    lostReports: [],
    foundItems: [],
    matches: [],
    claims: [],
    handovers: [],
    auditLog: [],
    // AUTO_INCREMENT counters, continued by new rows created at runtime.
    seq: { user: 11, report: 21, item: 21, match: 1, claim: 10, handover: 1, log: 1 },
  };
  // Register the store before seeding: the seed replays the same helper
  // functions the route handlers use, and they read the store via getDb().
  globalThis.__lostfoundMockStore = db;

  // ---------- audit helper (stands in for the audit triggers) ----------
  // (the module-level addAudit() below is used; it writes into this store
  //  because globalThis.__lostfoundMockStore is already registered)

  // ---------- lookup tables ----------
  db.users = SEED_USERS.map((u) => ({ ...u }));
  db.categories = SEED_CATEGORIES.map((c) => ({ ...c }));
  db.locations = SEED_LOCATIONS.map((l) => ({ ...l }));

  // ---------- lost reports (status starts at 'open', like the schema default) ----------
  for (const [report_id, user_id, category_id, location_id, title, description, days] of SEED_LOST) {
    const created = tsDaysAgo(days);
    db.lostReports.push({
      report_id, user_id, category_id, location_id, title, description,
      date_lost: dateDaysAgo(days), status: "open", created_at: created,
    });
    // trg_lost_after_insert
    addAudit("LostReports", "INSERT", report_id, `Lost report "${title}" filed by user ${user_id}`, created);
  }

  // ---------- found items (status starts at 'unclaimed') ----------
  for (const [item_id, finder_id, category_id, location_id, title, description, stored_at, days] of SEED_FOUND) {
    const created = tsDaysAgo(days);
    db.foundItems.push({
      item_id, finder_id, category_id, location_id, title, description,
      date_found: dateDaysAgo(days), stored_at, status: "unclaimed", created_at: created,
    });
    // trg_found_after_insert
    addAudit("FoundItems", "INSERT", item_id, `Found item "${title}" reported by user ${finder_id}`, created);
  }

  // ---------- matches: CALL sp_find_matches(1..20), exactly like the seed ----------
  for (let reportId = 1; reportId <= 20; reportId++) {
    runMatching(reportId, tsDaysAgo(0));
  }

  // One owner gave up looking (seed.sql UPDATE).
  const report11 = db.lostReports.find((r) => r.report_id === 11);
  if (report11) report11.status = "closed";

  // ---------- claims (trg_claim_before_insert rules are re-checked here) ----------
  for (const [claim_id, item_id, claimant_id, report_id, proof_text, days] of SEED_CLAIMS) {
    const created = tsDaysAgo(days);
    db.claims.push({
      claim_id, item_id, claimant_id, report_id, proof_text,
      status: "pending", reviewed_by: null, admin_note: null,
      created_at: created, reviewed_at: null,
    });
    // trg_claim_after_insert: item becomes claim_pending, audit row written.
    const item = db.foundItems.find((i) => i.item_id === item_id);
    if (item && item.status === "unclaimed") item.status = "claim_pending";
    addAudit("Claims", "INSERT", claim_id, `User ${claimant_id} claimed item ${item_id}`, created);
  }

  // ---------- admin decisions (CALL sp_verify_claim, like the seed) ----------
  // (claim, note, reviewed_at, handover handed_at) - back-dated to match seed.sql.
  verifyClaimInStore(db, 2, 1, "Contents and ID matched the owner", tsDaysAgo(5), tsDaysAgo(5), addAudit);
  verifyClaimInStore(db, 3, 1, "Name tag matched", tsDaysAgo(12), tsDaysAgo(11), addAudit);
  verifyClaimInStore(db, 8, 1, "Ink stain on the cuff matched the owner", tsDaysAgo(5), tsDaysAgo(5), addAudit);

  // Claim 4 rejected by hand (seed.sql UPDATE); item 18 goes back to unclaimed.
  rejectClaimInStore(db, 4, 1, "No name in the notebook, proof did not match", tsDaysAgo(9), addAudit);

  return db;
}

// =====================================================================
// Business logic (the mock versions of the triggers and procedures).
// Every function either returns its result or { error, status } so the
// route handlers can turn it into the right HTTP status code.
// =====================================================================

// --- sp_find_matches(report_id): same scoring as the stored procedure ---
function runMatching(reportId, whenTs) {
  const db = getDb();
  const report = db.lostReports.find((r) => r.report_id === reportId);
  if (!report) return 0;
  if (report.status !== "open" && report.status !== "matched") return 0;

  const lost = parseDate(report.date_lost);
  const windowEnd = new Date(lost);
  windowEnd.setDate(lost.getDate() + 7);
  const firstWord = report.title.split(" ")[0];

  let created = 0;
  for (const item of db.foundItems) {
    // Only unclaimed / claim-pending items in the SAME category are considered.
    if (item.status !== "unclaimed" && item.status !== "claim_pending") continue;
    if (item.category_id !== report.category_id) continue;

    let score = 40; // same category (always true here)
    if (item.location_id === report.location_id) score += 30;
    const found = parseDate(item.date_found);
    if (found >= lost && found <= windowEnd) score += 20;
    if (firstWord.length >= 3 && item.title.toLowerCase().includes(firstWord.toLowerCase())) score += 10;
    if (score < 50) continue;

    // UNIQUE(report_id, item_id): existing pairs are skipped (INSERT IGNORE).
    const exists = db.matches.some((m) => m.report_id === reportId && m.item_id === item.item_id);
    if (exists) continue;

    db.matches.push({ match_id: db.seq.match++, report_id: reportId, item_id: item.item_id, score, created_at: whenTs });
    created += 1;
  }

  if (created > 0 && report.status === "open") report.status = "matched";
  return created;
}

// --- joins used by the list endpoints ---
function categoryName(id) {
  const c = getDb().categories.find((x) => x.category_id === id);
  return c ? c.name : "";
}
function locationName(id) {
  const l = getDb().locations.find((x) => x.location_id === id);
  return l ? l.name : "";
}

// =====================================================================
// Exported helpers used by the route handlers.
// =====================================================================
function getDb() {
  // Keep the store on globalThis so hot reloads do not reset the demo.
  globalThis.__lostfoundMockStore ??= createStore();
  return globalThis.__lostfoundMockStore;
}

// ---------- audit helper (stands in for the audit triggers) ----------
function addAudit(tableName, action, recordId, details, whenTs) {
  const db = getDb();
  db.auditLog.push({
    log_id: db.seq.log++,
    table_name: tableName,
    action,
    record_id: recordId,
    details,
    performed_at: whenTs || nowTs(),
  });
}

// ---------- users / auth ----------
export function toPublicUser(u) {
  return { user_id: u.user_id, name: u.name, email: u.email, phone: u.phone, role: u.role };
}
export function getUserById(id) {
  const u = getDb().users.find((x) => x.user_id === id);
  return u ? toPublicUser(u) : null;
}
export function getUserByEmail(email) {
  return getDb().users.find((x) => x.email.toLowerCase() === String(email).toLowerCase()) || null;
}
export function checkPassword(user, password) {
  // Mock mode compares plain text; real mode uses bcryptjs.compare().
  return user.password === password;
}
export function createUser({ name, email, phone, password }) {
  const db = getDb();
  if (getUserByEmail(email)) return { error: "Email already registered", status: 409 };
  const user = {
    user_id: db.seq.user++, name: name.trim(), email: email.trim(),
    phone: phone.trim(), role: "user", password,
  };
  db.users.push(user);
  return { user: toPublicUser(user) };
}

// ---------- lookup data ----------
export function listCategories() {
  return getDb().categories.map((c) => ({ category_id: c.category_id, name: c.name }));
}
export function listLocations() {
  return getDb().locations.map((l) => ({ location_id: l.location_id, name: l.name, building: l.building }));
}

// ---------- lost reports ----------
export function createLostReport(userId, body) {
  const db = getDb();
  const title = String(body.title || "").trim();
  if (title.length < 3) return { error: "Title must be at least 3 characters", status: 400 };
  if (!db.categories.some((c) => c.category_id === Number(body.category_id))) return { error: "Unknown category", status: 400 };
  if (!db.locations.some((l) => l.location_id === Number(body.location_id))) return { error: "Unknown location", status: 400 };
  const dateLost = String(body.date_lost || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateLost)) return { error: "A valid date is required", status: 400 };
  // trg_lost_before_insert
  if (dateLost > todayStr()) return { error: "Date cannot be in the future", status: 400 };

  const report = {
    report_id: db.seq.report++, user_id: userId,
    category_id: Number(body.category_id), location_id: Number(body.location_id),
    title, description: String(body.description || "").trim(),
    date_lost: dateLost, status: "open", created_at: nowTs(),
  };
  db.lostReports.push(report);
  addAudit("LostReports", "INSERT", report.report_id, `Lost report "${title}" filed by user ${userId}`);
  // Creating a report runs matching immediately (FR4).
  runMatching(report.report_id, report.created_at);
  return { report_id: report.report_id };
}

export function getMyLostReports(userId) {
  const db = getDb();
  return db.lostReports
    .filter((r) => r.user_id === userId)
    .sort((a, b) => b.report_id - a.report_id)
    .map((r) => ({
      report_id: r.report_id, title: r.title,
      category: categoryName(r.category_id), location: locationName(r.location_id),
      date_lost: r.date_lost, description: r.description, status: r.status,
      match_count: db.matches.filter((m) => m.report_id === r.report_id).length,
    }));
}

export function closeLostReport(userId, reportId) {
  const db = getDb();
  const report = db.lostReports.find((r) => r.report_id === reportId);
  if (!report) return { error: "Report not found", status: 404 };
  if (report.user_id !== userId) return { error: "Not your report", status: 403 };
  if (report.status !== "open" && report.status !== "matched") {
    return { error: "Only an open or matched report can be closed", status: 400 };
  }
  report.status = "closed";
  return { ok: true };
}

export function getReportMatches(userId, reportId) {
  const db = getDb();
  const report = db.lostReports.find((r) => r.report_id === reportId);
  if (!report) return { error: "Report not found", status: 404 };
  if (report.user_id !== userId) return { error: "Not your report", status: 403 };
  return db.matches
    .filter((m) => m.report_id === reportId)
    .sort((a, b) => b.score - a.score)
    .map((m) => {
      const item = db.foundItems.find((i) => i.item_id === m.item_id);
      return {
        match_id: m.match_id, item_id: item.item_id, item_title: item.title,
        category: categoryName(item.category_id), location: locationName(item.location_id),
        date_found: item.date_found, score: m.score,
      };
    });
}

export function rematchReport(userId, reportId) {
  const db = getDb();
  const report = db.lostReports.find((r) => r.report_id === reportId);
  if (!report) return { error: "Report not found", status: 404 };
  if (report.user_id !== userId) return { error: "Not your report", status: 403 };
  if (report.status !== "open" && report.status !== "matched") {
    return { error: "Matching only works on open or matched reports", status: 409 };
  }
  const created = runMatching(reportId, nowTs());
  return { matches_created: created };
}

// ---------- found items ----------
export function createFoundItem(userId, body) {
  const db = getDb();
  const title = String(body.title || "").trim();
  if (title.length < 3) return { error: "Title must be at least 3 characters", status: 400 };
  if (!db.categories.some((c) => c.category_id === Number(body.category_id))) return { error: "Unknown category", status: 400 };
  if (!db.locations.some((l) => l.location_id === Number(body.location_id))) return { error: "Unknown location", status: 400 };
  const dateFound = String(body.date_found || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFound)) return { error: "A valid date is required", status: 400 };
  // trg_found_before_insert
  if (dateFound > todayStr()) return { error: "Date cannot be in the future", status: 400 };

  const item = {
    item_id: db.seq.item++, finder_id: userId,
    category_id: Number(body.category_id), location_id: Number(body.location_id),
    title, description: String(body.description || "").trim(),
    date_found: dateFound, stored_at: String(body.stored_at || "").trim(),
    status: "unclaimed", created_at: nowTs(),
  };
  db.foundItems.push(item);
  addAudit("FoundItems", "INSERT", item.item_id, `Found item "${title}" reported by user ${userId}`);
  return { item_id: item.item_id };
}

// GET /api/found?category=&location=&from=&to=&q=  (unclaimed items only,
// like the v_open_found_items view)
export function listFoundItems(filters) {
  const db = getDb();
  const q = (filters.q || "").toLowerCase();
  return db.foundItems
    .filter((i) => i.status === "unclaimed")
    .filter((i) => !filters.category || i.category_id === Number(filters.category))
    .filter((i) => !filters.location || i.location_id === Number(filters.location))
    .filter((i) => !filters.from || i.date_found >= filters.from)
    .filter((i) => !filters.to || i.date_found <= filters.to)
    .filter((i) => !q || i.title.toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q))
    .sort((a, b) => (a.date_found === b.date_found ? b.item_id - a.item_id : (a.date_found < b.date_found ? 1 : -1)))
    .map((i) => ({
      item_id: i.item_id, title: i.title,
      category: categoryName(i.category_id), location: locationName(i.location_id),
      date_found: i.date_found, description: i.description, status: i.status,
    }));
}

export function getFoundItemById(itemId) {
  const db = getDb();
  const i = db.foundItems.find((x) => x.item_id === itemId);
  if (!i) return null;
  return {
    item_id: i.item_id, title: i.title,
    category: categoryName(i.category_id), location: locationName(i.location_id),
    date_found: i.date_found, description: i.description,
    stored_at: i.stored_at, status: i.status,
  };
}

// ---------- claims (mirrors the claim triggers) ----------
export function createClaim(userId, body) {
  const db = getDb();
  const itemId = Number(body.item_id);
  const item = db.foundItems.find((i) => i.item_id === itemId);
  if (!item) return { error: "Item not found", status: 404 };

  const proof = String(body.proof_text || "").trim();
  if (!proof) return { error: "Proof text is required", status: 400 };

  // trg_claim_before_insert rules, in the same order as the trigger.
  if (item.status === "claimed" || item.status === "disposed") {
    return { error: "This item is no longer available to claim", status: 409 };
  }
  if (item.finder_id === userId) {
    return { error: "You cannot claim an item you found yourself", status: 409 };
  }
  const alreadyPending = db.claims.some(
    (c) => c.item_id === itemId && c.claimant_id === userId && c.status === "pending"
  );
  if (alreadyPending) {
    return { error: "You already have a pending claim on this item", status: 409 };
  }
  const reportId = body.report_id == null || body.report_id === "" ? null : Number(body.report_id);
  if (reportId != null) {
    const report = db.lostReports.find((r) => r.report_id === reportId);
    if (!report || report.user_id !== userId) {
      return { error: "The linked lost report does not belong to you", status: 409 };
    }
  }

  const claim = {
    claim_id: db.seq.claim++, item_id: itemId, claimant_id: userId, report_id: reportId,
    proof_text: proof, status: "pending", reviewed_by: null, admin_note: null,
    created_at: nowTs(), reviewed_at: null,
  };
  db.claims.push(claim);
  // trg_claim_after_insert
  if (item.status === "unclaimed") item.status = "claim_pending";
  addAudit("Claims", "INSERT", claim.claim_id, `User ${userId} claimed item ${itemId}`);
  return { claim_id: claim.claim_id };
}

export function getMyClaims(userId) {
  const db = getDb();
  return db.claims
    .filter((c) => c.claimant_id === userId)
    .sort((a, b) => b.claim_id - a.claim_id)
    .map((c) => {
      const item = db.foundItems.find((i) => i.item_id === c.item_id);
      return {
        claim_id: c.claim_id, item_id: c.item_id, item_title: item ? item.title : "",
        status: c.status, admin_note: c.admin_note,
        created_at: c.created_at, reviewed_at: c.reviewed_at,
      };
    });
}

// --- sp_verify_claim: verify + reject other pending claims + handover ---
// (The internal version takes explicit timestamps so the seed can back-date
// events exactly like seed.sql does.)
function verifyClaimInStore(db, claimId, adminId, note, whenTs, handoverTs, addAuditFn) {
  const claim = db.claims.find((c) => c.claim_id === claimId);
  if (!claim || claim.status !== "pending") return;
  // trg_claim_before_update: only one verified claim per item.
  const otherVerified = db.claims.some(
    (c) => c.item_id === claim.item_id && c.status === "verified" && c.claim_id !== claimId
  );
  if (otherVerified) return;

  claim.status = "verified";
  claim.reviewed_by = adminId;
  claim.admin_note = note;
  claim.reviewed_at = whenTs;
  addAuditFn("Claims", "STATUS_CHANGE", claimId, `Claim ${claimId} changed from pending to verified`, whenTs);

  // trg_claim_after_update: item -> claimed, linked report -> resolved.
  const item = db.foundItems.find((i) => i.item_id === claim.item_id);
  if (item) item.status = "claimed";
  if (claim.report_id != null) {
    const report = db.lostReports.find((r) => r.report_id === claim.report_id);
    if (report) report.status = "resolved";
  }

  // sp_verify_claim step 2: reject every other pending claim on this item.
  for (const other of db.claims) {
    if (other.item_id === claim.item_id && other.claim_id !== claimId && other.status === "pending") {
      other.status = "rejected";
      other.reviewed_by = adminId;
      other.admin_note = "Another claim was verified for this item";
      other.reviewed_at = whenTs;
      addAuditFn("Claims", "STATUS_CHANGE", other.claim_id, `Claim ${other.claim_id} changed from pending to rejected`, whenTs);
    }
  }

  // sp_verify_claim step 3: record the handover.
  const handover = {
    handover_id: db.seq.handover++, claim_id: claimId, handed_by: adminId,
    handed_at: handoverTs, remarks: "Handed over after claim verification",
  };
  db.handovers.push(handover);
  addAuditFn("Handovers", "INSERT", handover.handover_id, `Item handed over for claim ${claimId} by admin ${adminId}`, handoverTs);
}

function rejectClaimInStore(db, claimId, adminId, note, whenTs, addAuditFn) {
  const claim = db.claims.find((c) => c.claim_id === claimId);
  if (!claim || claim.status !== "pending") return;
  claim.status = "rejected";
  claim.reviewed_by = adminId;
  claim.admin_note = note;
  claim.reviewed_at = whenTs;
  addAuditFn("Claims", "STATUS_CHANGE", claimId, `Claim ${claimId} changed from pending to rejected`, whenTs);
  // trg_claim_after_update: item back to unclaimed if no pending claims remain.
  const pendingLeft = db.claims.some(
    (c) => c.item_id === claim.item_id && c.status === "pending" && c.claim_id !== claimId
  );
  if (!pendingLeft) {
    const item = db.foundItems.find((i) => i.item_id === claim.item_id);
    if (item && item.status === "claim_pending") item.status = "unclaimed";
  }
}

// Public wrappers used by the admin routes (timestamps default to "now").
export function verifyClaim(claimId, adminUser, note) {
  const db = getDb();
  const claim = db.claims.find((c) => c.claim_id === claimId);
  if (!claim) return { error: "Claim not found", status: 404 };
  if (claim.status !== "pending") return { error: "Claim not found or already reviewed", status: 409 };
  const otherVerified = db.claims.some(
    (c) => c.item_id === claim.item_id && c.status === "verified" && c.claim_id !== claimId
  );
  if (otherVerified) return { error: "Another claim is already verified for this item", status: 409 };
  verifyClaimInStore(db, claimId, adminUser.user_id, note, nowTs(), nowTs(), addAudit);
  return { ok: true };
}

export function rejectClaim(claimId, adminUser, note) {
  const db = getDb();
  const claim = db.claims.find((c) => c.claim_id === claimId);
  if (!claim) return { error: "Claim not found", status: 404 };
  if (claim.status !== "pending") return { error: "Claim not found or already reviewed", status: 409 };
  rejectClaimInStore(db, claimId, adminUser.user_id, note, nowTs(), addAudit);
  return { ok: true };
}

// GET /api/admin/claims?status=... (rows shaped like the v_claim_details view)
export function getAdminClaims(status) {
  const db = getDb();
  return db.claims
    .filter((c) => !status || status === "all" || c.status === status)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
    .map((c) => {
      const claimant = db.users.find((u) => u.user_id === c.claimant_id);
      const item = db.foundItems.find((i) => i.item_id === c.item_id);
      const report = c.report_id == null ? null : db.lostReports.find((r) => r.report_id === c.report_id);
      return {
        claim_id: c.claim_id,
        claimant_name: claimant ? claimant.name : "",
        claimant_email: claimant ? claimant.email : "",
        item_id: c.item_id, item_title: item ? item.title : "",
        report_title: report ? report.title : null,
        proof_text: c.proof_text, status: c.status, created_at: c.created_at,
      };
    });
}

// GET /api/admin/stats
export function getAdminStats() {
  const db = getDb();
  const counts = { open: 0, matched: 0, resolved: 0, closed: 0, unclaimed: 0, claimed: 0 };
  for (const r of db.lostReports) counts[r.status] += 1;
  for (const i of db.foundItems) {
    if (i.status === "unclaimed") counts.unclaimed += 1;
    if (i.status === "claimed") counts.claimed += 1;
  }

  // Hotspots: lost reports per location (query 4 in the PRD).
  const hotspots = db.locations
    .map((l) => ({
      location: l.name,
      count: db.lostReports.filter((r) => r.location_id === l.location_id).length,
    }))
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count);

  // Category breakdown: open vs resolved lost reports (query 6).
  const categories = db.categories
    .map((c) => ({
      category: c.name,
      open: db.lostReports.filter((r) => r.category_id === c.category_id && r.status === "open").length,
      resolved: db.lostReports.filter((r) => r.category_id === c.category_id && r.status === "resolved").length,
    }))
    .filter((c) => c.open > 0 || c.resolved > 0);

  // Items unclaimed for more than 30 days (query 5).
  const today = parseDate(todayStr());
  const stale_items = db.foundItems
    .filter((i) => i.status === "unclaimed")
    .map((i) => ({ item_id: i.item_id, title: i.title, days_unclaimed: diffDays(today, parseDate(i.date_found)) }))
    .filter((i) => i.days_unclaimed > 30)
    .sort((a, b) => b.days_unclaimed - a.days_unclaimed);

  return { counts, hotspots, categories, stale_items };
}

// GET /api/admin/audit (latest 100 rows, newest first)
export function getAuditLog() {
  return [...getDb().auditLog]
    .sort((a, b) => (a.performed_at === b.performed_at ? b.log_id - a.log_id : (a.performed_at < b.performed_at ? 1 : -1)))
    .slice(0, 100);
}
