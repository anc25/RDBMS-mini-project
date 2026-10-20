# TiDB Cloud: where did the triggers and procedures go?

TiDB is MySQL-compatible, but it **does not support triggers, stored
procedures, events or user-defined functions**. Everything else in this
project's schema (foreign keys, CHECK constraints, ENUM columns, views,
transactions) works as-is.

That means the business rules that lived in `sql/mysql/logic.sql` must be
enforced by the **application layer** — the Next.js API routes, exactly where
the mock-store logic already implements them today. This file is the
translation table: each MySQL object and the statements the app runs
instead. Use it when swapping the mock routes to real `mysql2` queries, and
in the viva when asked "how would this work without stored procedures?".

Connection facts for TiDB Cloud (Starter/Basic tier):

- host `<cluster-id>.prod.<region>.tidbcloud.com`, port **4000**, TLS required
- `foreign_key_checks` is always ON and cannot be disabled
- one connection string per pool, e.g.
  `mysql://<user>:<password>@<host>:4000/lostfound?ssl={"rejectUnauthorized":true}`

---

## 1. `trg_lost_before_insert` / `trg_found_before_insert`
*"date cannot be in the future"*

Validate in the route handler before INSERT:

```sql
-- app-side check (JS: if (dateLost > todayISO()) return 400)
SELECT (DATE(?) > CURDATE()) AS invalid;
```

## 2. `trg_lost_after_insert` / `trg_found_after_insert`
*audit rows on new reports/items*

Run both statements in one transaction:

```sql
INSERT INTO LostReports (...) VALUES (...);
INSERT INTO AuditLog (table_name, action, record_id, details)
VALUES ('LostReports', 'INSERT', LAST_INSERT_ID(), ?);
```

## 3. `trg_claim_before_insert` *— the claim business rules*

Run inside one transaction, then raise HTTP 409 with the same messages:

```sql
SELECT status, finder_id INTO @status, @finder FROM FoundItems WHERE item_id = ?;
-- @status IN ('claimed','disposed')            -> 'This item is no longer available to claim'
-- @finder = claimant                           -> 'You cannot claim an item you found yourself'

SELECT COUNT(*) FROM Claims
WHERE item_id = ? AND claimant_id = ? AND status = 'pending';
-- count > 0                                    -> 'You already have a pending claim on this item'

SELECT user_id FROM LostReports WHERE report_id = ?;
-- owner <> claimant                            -> 'The linked lost report does not belong to you'
```

## 4. `trg_claim_after_insert`
*item becomes claim_pending + audit row*

```sql
INSERT INTO Claims (...) VALUES (...);
UPDATE FoundItems SET status = 'claim_pending'
WHERE item_id = ? AND status = 'unclaimed';
INSERT INTO AuditLog (table_name, action, record_id, details)
VALUES ('Claims', 'INSERT', LAST_INSERT_ID(), ?);
```

## 5. `trg_claim_before_update` / `trg_claim_after_update`
*no double review, one verified claim per item, status sync*

```sql
-- reviewed claims cannot change again
SELECT status FROM Claims WHERE claim_id = ? FOR UPDATE;
-- status <> 'pending'                          -> 'This claim has already been reviewed'

-- only one verified claim per item
SELECT COUNT(*) FROM Claims
WHERE item_id = ? AND status = 'verified' AND claim_id <> ?;
-- count > 0                                    -> 'Another claim is already verified for this item'

-- the actual verify + sync (one transaction)
UPDATE Claims SET status = 'verified', reviewed_by = ?, admin_note = ?,
       reviewed_at = NOW()
WHERE claim_id = ?;
UPDATE FoundItems SET status = 'claimed'   WHERE item_id = ?;
UPDATE LostReports SET status = 'resolved' WHERE report_id = ?;
INSERT INTO AuditLog (table_name, action, record_id, details)
VALUES ('Claims', 'STATUS_CHANGE', ?, ?);
```

Rejecting a claim (sync in the other direction):

```sql
UPDATE Claims SET status = 'rejected', reviewed_by = ?, admin_note = ?,
       reviewed_at = NOW()
WHERE claim_id = ?;
-- flip the item back only if no other pending claim remains
UPDATE FoundItems SET status = 'unclaimed'
WHERE item_id = ? AND status = 'claim_pending'
  AND NOT EXISTS (SELECT 1 FROM Claims
                  WHERE item_id = ? AND status = 'pending');
```

## 6. `sp_find_matches(report_id)`
Replaced by a single statement (same scoring: category +40, same location
+30, within 7 days +20, first title word found +10, threshold 50):

```sql
INSERT IGNORE INTO Matches (report_id, item_id, score)
SELECT s.report_id, s.item_id, s.score
FROM (
  SELECT r.report_id, f.item_id,
       (CASE WHEN f.category_id = r.category_id THEN 40 ELSE 0 END)
     + (CASE WHEN f.location_id  = r.location_id  THEN 30 ELSE 0 END)
     + (CASE WHEN f.date_found BETWEEN r.date_lost
                  AND DATE_ADD(r.date_lost, INTERVAL 7 DAY) THEN 20 ELSE 0 END)
     + (CASE WHEN CHAR_LENGTH(SUBSTRING_INDEX(r.title, ' ', 1)) >= 3
              AND LOCATE(LOWER(SUBSTRING_INDEX(r.title, ' ', 1)), LOWER(f.title)) > 0
             THEN 10 ELSE 0 END) AS score
  FROM LostReports r
  JOIN FoundItems f ON f.status IN ('unclaimed', 'claim_pending')
  WHERE r.report_id = ? AND r.status IN ('open', 'matched')
    AND f.category_id = r.category_id
) AS s
WHERE s.score >= 50;

UPDATE LostReports SET status = 'matched'
WHERE report_id = ? AND status = 'open' AND ROW_COUNT() > 0;
-- (run ROW_COUNT() right after the INSERT IGNORE, then this UPDATE)
```

The SQL files version of this exact statement is in `03_seed.sql` — it is
how the seeded Matches were produced without the procedure.

## 7. `sp_verify_claim(claim_id, admin_id, note, remarks)`
The verify-and-hand-over transaction, flattened:

```sql
START TRANSACTION;

-- admin check first
SELECT COUNT(*) FROM Users WHERE user_id = ? AND role = 'admin';
-- count = 0 -> 'Only an admin can verify a claim'

SELECT item_id FROM Claims
WHERE claim_id = ? AND status = 'pending' FOR UPDATE;
-- null -> 'Claim not found or already reviewed'

UPDATE Claims SET status = 'verified', reviewed_by = ?, admin_note = ?,
       reviewed_at = NOW()
WHERE claim_id = ?;

UPDATE Claims SET status = 'rejected', reviewed_by = ?,
       admin_note = 'Another claim was verified for this item', reviewed_at = NOW()
WHERE item_id = ? AND claim_id <> ? AND status = 'pending';

UPDATE FoundItems SET status = 'claimed'   WHERE item_id = ?;
UPDATE LostReports SET status = 'resolved' WHERE report_id = ?;

INSERT INTO Handovers (claim_id, handed_by, remarks) VALUES (?, ?, ?);
INSERT INTO AuditLog (table_name, action, record_id, details)
VALUES ('Claims', 'STATUS_CHANGE', ?, ?);

COMMIT;
```

Wrap all of it in one `pool.getConnection()` + `beginTransaction()` in the
route handler — TiDB's pessimistic transactions make the `FOR UPDATE` row
lock behave like the MySQL version.

---

## Loading order on TiDB Cloud

| Order | File | What it does |
|---|---|---|
| 1 | `00_create_database.sql` | creates the `lostfound` database |
| 2 | `01_schema.sql`          | 8 tables + FKs + CHECKs + lookup rows |
| 3 | `02_views.sql`           | `v_open_found_items`, `v_claim_details` |
| 4 | `03_seed.sql`            | demo data (trigger effects written out) |
| 5 | `04_sanity_check.sql`    | row counts to verify |

The original trigger/procedure version for local MySQL 8 lives in
`sql/mysql/` — keep it for the project report and the viva demo.
