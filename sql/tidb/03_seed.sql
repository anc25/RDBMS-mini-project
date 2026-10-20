-- =====================================================================
-- 03_seed.sql : demo data for Campus Lost & Found on TiDB Cloud.
-- Run after 01_schema.sql and 02_views.sql.
--   mysql --host <HOST> --port 4000 -u <USER> -p --ssl-mode=VERIFY_IDENTITY \
--         -D lostfound < sql/tidb/03_seed.sql
-- All dates are relative to today (CURDATE() - n days), so the data stays
-- fresh whenever you load it.
--
-- Logins (passwords are stored as bcrypt hashes):
--   admin@test.com / admin123   (admin)
--   user@test.com  / user123    (student)
--   every other user also uses  user123
--
-- TiDB CLOUD NOTE: there are no triggers or stored procedures on TiDB, so
-- every effect the MySQL version got from trg_*_after_insert, the claim
-- triggers and sp_find_matches / sp_verify_claim is written out here as
-- plain SQL. The results are identical to the local MySQL version.
-- =====================================================================

USE lostfound;

-- ---------- Users (ids 1-10) ----------
INSERT INTO Users (user_id, name, email, phone, role, password_hash) VALUES
 (1,  'Campus Admin',  'admin@test.com',          '9000000001', 'admin', '$2b$10$vYjPKSG3stkNxbhRXAPhC.bjeBC0gof6AzGyMnx4rYsrzznRPAgNi'),
 (2,  'Anchal Singh',  'user@test.com',           '9000000002', 'user',  '$2b$10$WseSv.W5KA43EM3P4eDPAO2cOW.F0ezDVllwi1e/zzDa6R3ojkg4C'),
 (3,  'Rohan Mehta',   'rohan.mehta@example.edu', '9000000003', 'user',  '$2b$10$yBem3Cl/bmuEw7AbQWRePueH6/dHz8y6ZLJ9lVmisTHr9gh8FePjW'),
 (4,  'Priya Sharma',  'priya.sharma@example.edu','9000000004', 'user',  '$2b$10$7lAWago1GBBlbELWEs/M8eIZRo4hHDePq05s285roSxNNVT/g2StC'),
 (5,  'Aditya Verma',  'aditya.verma@example.edu','9000000005', 'user',  '$2b$10$GFIs0vk5RU3k49Dzf/d2dOco7h.plwslOKFtIkq41Pt22OM14yXuK'),
 (6,  'Sneha Gupta',   'sneha.gupta@example.edu', '9000000006', 'user',  '$2b$10$bi1msuLKIfEWizK6fciVzO8j5UHw35PEuAX0L5..flhWYpEJvdvtq'),
 (7,  'Karan Joshi',   'karan.joshi@example.edu', '9000000007', 'user',  '$2b$10$A22jPos0AwdiV7vshoEDXOkEKbOtfylPwbSyVaWbpxGe/mcBhOFKW'),
 (8,  'Neha Reddy',    'neha.reddy@example.edu',  '9000000008', 'user',  '$2b$10$86MgpZTM7KCtgCYr8dMaquKV4tN5oD9QEpHUtSsFDPdXj8NgNICwS'),
 (9,  'Vikram Singh',  'vikram.singh@example.edu','9000000009', 'user',  '$2b$10$EWcPLg2Xu62.23LE/D/1v.ek9TNKl1mVndt0Zy1.jBY0Jred19Y8W'),
 (10, 'Ishita Rao',    'ishita.rao@example.edu',  '9000000010', 'user',  '$2b$10$58JidrJoBxB4R8hB6nh/wO.CHEL5xQoI0BsIYjql..Vdl1Y0qScVS');

-- ---------- Lost reports (ids 1-20) ----------
-- (id, user, category, location, title, description, days ago)
-- Categories: 1 Phone 2 Wallet 3 ID Card 4 Keys 5 Bag 6 Laptop/Charger 7 Books 8 Clothing 9 Other
-- Locations : 1 Library 2 Mess 3 Hostel A 4 Hostel B 5 Academic Block 6 Sports Ground 7 Canteen 8 Auditorium
INSERT INTO LostReports (report_id, user_id, category_id, location_id, title, description, date_lost, created_at) VALUES
 (1,  2, 1, 1, 'Black iPhone 13',   'Black iPhone with a blue silicone case, cat photo as lock screen',     CURDATE() - INTERVAL 6 DAY,  NOW() - INTERVAL 6 DAY),
 (2,  3, 2, 7, 'Brown leather wallet','Brown wallet with my college ID and a Rs 500 note',                    CURDATE() - INTERVAL 8 DAY,  NOW() - INTERVAL 8 DAY),
 (3,  4, 3, 5, 'Student ID card',   'ID card on a green lanyard, name Priya Sharma',                         CURDATE() - INTERVAL 5 DAY,  NOW() - INTERVAL 5 DAY),
 (4,  5, 4, 3, 'Hostel room keys',  'Two keys on a red keychain with a bottle opener',                       CURDATE() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY),
 (5,  6, 5, 1, 'Grey backpack',     'Grey backpack with a laptop sleeve and two notebooks inside',           CURDATE() - INTERVAL 4 DAY,  NOW() - INTERVAL 4 DAY),
 (6,  7, 6, 5, 'Laptop charger',    'Dell 65W charger with a black cable',                                   CURDATE() - INTERVAL 12 DAY, NOW() - INTERVAL 12 DAY),
 (7,  8, 7, 1, 'DBMS textbook',     'Database System Concepts, my name is written on the first page',        CURDATE() - INTERVAL 7 DAY,  NOW() - INTERVAL 7 DAY),
 (8,  9, 8, 6, 'Blue hoodie',       'Navy blue hoodie with the university logo, size M',                     CURDATE() - INTERVAL 9 DAY,  NOW() - INTERVAL 9 DAY),
 (9,  10,1, 2, 'Redmi Note phone',  'Redmi phone with a cracked screen guard',                               CURDATE() - INTERVAL 3 DAY,  NOW() - INTERVAL 3 DAY),
 (10, 2, 4, 1, 'Bike keys',         'Honda bike key with a black rubber cover',                              CURDATE() - INTERVAL 15 DAY, NOW() - INTERVAL 15 DAY),
 (11, 3, 9, 4, 'Water bottle',      'Silver steel bottle with a sticker on it',                              CURDATE() - INTERVAL 20 DAY, NOW() - INTERVAL 20 DAY),
 (12, 4, 5, 7, 'Black sling bag',   'Small black sling bag with earphones inside',                           CURDATE() - INTERVAL 2 DAY,  NOW() - INTERVAL 2 DAY),
 (13, 5, 2, 1, 'Black wallet',      'Black card holder wallet',                                              CURDATE() - INTERVAL 11 DAY, NOW() - INTERVAL 11 DAY),
 (14, 6, 3, 4, 'Library card',      'Library card with the name Sneha Gupta',                                CURDATE() - INTERVAL 14 DAY, NOW() - INTERVAL 14 DAY),
 (15, 7, 1, 1, 'Samsung phone',     'Samsung Galaxy with a black cover',                                     CURDATE() - INTERVAL 5 DAY,  NOW() - INTERVAL 5 DAY),
 (16, 8, 6, 1, 'HP laptop',         '15 inch silver HP laptop with stickers on the lid',                     CURDATE() - INTERVAL 6 DAY,  NOW() - INTERVAL 6 DAY),
 (17, 9, 7, 5, 'Maths notebook',    'Spiral notebook with a blue cover, my name inside the front page',      CURDATE() - INTERVAL 13 DAY, NOW() - INTERVAL 13 DAY),
 (18, 10,9, 6, 'Spectacles',        'Black frame spectacles in a brown case',                                CURDATE() - INTERVAL 8 DAY,  NOW() - INTERVAL 8 DAY),
 (19, 2, 8, 2, 'Black jacket',      'Black zip jacket with an Adidas logo, name tag inside the collar',      CURDATE() - INTERVAL 16 DAY, NOW() - INTERVAL 16 DAY),
 (20, 3, 1, 1, 'Realme phone',      'Realme phone with a transparent case',                                  CURDATE() - INTERVAL 1 DAY,  NOW() - INTERVAL 1 DAY);

-- ---------- Found items (ids 1-20) ----------
-- (id, finder, category, location, title, description, stored at, days ago)
INSERT INTO FoundItems (item_id, finder_id, category_id, location_id, title, description, date_found, stored_at, created_at) VALUES
 (1,  3, 1, 1, 'Black iPhone',            'Black iPhone with a blue case, found near the reading hall',   CURDATE() - INTERVAL 5 DAY,  'Library help desk',      NOW() - INTERVAL 5 DAY),
 (2,  4, 2, 7, 'Brown wallet',            'Brown leather wallet found on a canteen table',                CURDATE() - INTERVAL 7 DAY,  'Security office',        NOW() - INTERVAL 7 DAY),
 (3,  5, 3, 5, 'Student ID card',         'ID card on a green lanyard, found near the Block 1 stairs',    CURDATE() - INTERVAL 4 DAY,  'Academic Block office',  NOW() - INTERVAL 4 DAY),
 (4,  6, 4, 3, 'Keys with red keychain',  'Two keys on a red keychain',                                   CURDATE() - INTERVAL 9 DAY,  'Warden office',          NOW() - INTERVAL 9 DAY),
 (5,  7, 5, 1, 'Grey bag',                'Grey backpack left on a library table',                        CURDATE() - INTERVAL 3 DAY,  'Library help desk',      NOW() - INTERVAL 3 DAY),
 (6,  8, 6, 5, 'Laptop charger',          'Dell charger found in a classroom',                            CURDATE() - INTERVAL 11 DAY, 'Academic Block office',  NOW() - INTERVAL 11 DAY),
 (7,  9, 7, 1, 'DBMS book',               'Database System Concepts textbook',                            CURDATE() - INTERVAL 6 DAY,  'Library help desk',      NOW() - INTERVAL 6 DAY),
 (8,  10,8, 6, 'Navy hoodie',             'Blue hoodie left on a bench',                                  CURDATE() - INTERVAL 8 DAY,  'Sports office',          NOW() - INTERVAL 8 DAY),
 (9,  2, 4, 2, 'Scooter keys',            'Keys with a yellow tag',                                       CURDATE() - INTERVAL 40 DAY, 'Mess office',            NOW() - INTERVAL 40 DAY),
 (10, 3, 9, 8, 'Black umbrella',          'Folding black umbrella',                                       CURDATE() - INTERVAL 35 DAY, 'Auditorium office',      NOW() - INTERVAL 35 DAY),
 (11, 4, 1, 2, 'Redmi phone',             'Redmi phone with a broken screen guard on a mess table',       CURDATE() - INTERVAL 2 DAY,  'Mess office',            NOW() - INTERVAL 2 DAY),
 (12, 5, 9, 6, 'Black spectacles',        'Spectacles in a brown case',                                   CURDATE() - INTERVAL 7 DAY,  'Sports office',          NOW() - INTERVAL 7 DAY),
 (13, 6, 1, 1, 'Samsung phone',           'Samsung Galaxy with a black cover',                            CURDATE() - INTERVAL 4 DAY,  'Library help desk',      NOW() - INTERVAL 4 DAY),
 (14, 7, 6, 1, 'Silver HP laptop',        'HP laptop with stickers on the lid',                           CURDATE() - INTERVAL 5 DAY,  'Library help desk',      NOW() - INTERVAL 5 DAY),
 (15, 8, 5, 7, 'Black sling bag',         'Sling bag with earphones inside',                              CURDATE() - INTERVAL 1 DAY,  'Canteen counter',        NOW() - INTERVAL 1 DAY),
 (16, 9, 2, 1, 'Black card holder',       'Card holder with a few cards inside',                          CURDATE() - INTERVAL 10 DAY, 'Library help desk',      NOW() - INTERVAL 10 DAY),
 (17, 10,8, 2, 'Black jacket',            'Black zip jacket',                                             CURDATE() - INTERVAL 14 DAY, 'Mess office',            NOW() - INTERVAL 14 DAY),
 (18, 2, 7, 5, 'Notebook',                'Blue spiral notebook',                                         CURDATE() - INTERVAL 12 DAY, 'Academic Block office',  NOW() - INTERVAL 12 DAY),
 (19, 3, 9, 7, 'Steel lunch box',         'Steel tiffin box',                                             CURDATE() - INTERVAL 45 DAY, 'Canteen counter',        NOW() - INTERVAL 45 DAY),
 (20, 4, 4, 1, 'Bike key',                'Honda key with a rubber cover',                                CURDATE() - INTERVAL 13 DAY, 'Library help desk',      NOW() - INTERVAL 13 DAY);

-- ---------- Audit rows for the inserts above ----------
-- On MySQL these were written by trg_lost_after_insert / trg_found_after_insert.
INSERT INTO AuditLog (table_name, action, record_id, details) VALUES
 ('LostReports', 'INSERT', 1,  'Lost report "Black iPhone 13" filed by user 2'),
 ('LostReports', 'INSERT', 2,  'Lost report "Brown leather wallet" filed by user 3'),
 ('LostReports', 'INSERT', 3,  'Lost report "Student ID card" filed by user 4'),
 ('LostReports', 'INSERT', 4,  'Lost report "Hostel room keys" filed by user 5'),
 ('LostReports', 'INSERT', 5,  'Lost report "Grey backpack" filed by user 6'),
 ('LostReports', 'INSERT', 6,  'Lost report "Laptop charger" filed by user 7'),
 ('LostReports', 'INSERT', 7,  'Lost report "DBMS textbook" filed by user 8'),
 ('LostReports', 'INSERT', 8,  'Lost report "Blue hoodie" filed by user 9'),
 ('LostReports', 'INSERT', 9,  'Lost report "Redmi Note phone" filed by user 10'),
 ('LostReports', 'INSERT', 10, 'Lost report "Bike keys" filed by user 2'),
 ('LostReports', 'INSERT', 11, 'Lost report "Water bottle" filed by user 3'),
 ('LostReports', 'INSERT', 12, 'Lost report "Black sling bag" filed by user 4'),
 ('LostReports', 'INSERT', 13, 'Lost report "Black wallet" filed by user 5'),
 ('LostReports', 'INSERT', 14, 'Lost report "Library card" filed by user 6'),
 ('LostReports', 'INSERT', 15, 'Lost report "Samsung phone" filed by user 7'),
 ('LostReports', 'INSERT', 16, 'Lost report "HP laptop" filed by user 8'),
 ('LostReports', 'INSERT', 17, 'Lost report "Maths notebook" filed by user 9'),
 ('LostReports', 'INSERT', 18, 'Lost report "Spectacles" filed by user 10'),
 ('LostReports', 'INSERT', 19, 'Lost report "Black jacket" filed by user 2'),
 ('LostReports', 'INSERT', 20, 'Lost report "Realme phone" filed by user 3'),
 ('FoundItems',  'INSERT', 1,  'Found item "Black iPhone" reported by user 3'),
 ('FoundItems',  'INSERT', 2,  'Found item "Brown wallet" reported by user 4'),
 ('FoundItems',  'INSERT', 3,  'Found item "Student ID card" reported by user 5'),
 ('FoundItems',  'INSERT', 4,  'Found item "Keys with red keychain" reported by user 6'),
 ('FoundItems',  'INSERT', 5,  'Found item "Grey bag" reported by user 7'),
 ('FoundItems',  'INSERT', 6,  'Found item "Laptop charger" reported by user 8'),
 ('FoundItems',  'INSERT', 7,  'Found item "DBMS book" reported by user 9'),
 ('FoundItems',  'INSERT', 8,  'Found item "Navy hoodie" reported by user 10'),
 ('FoundItems',  'INSERT', 9,  'Found item "Scooter keys" reported by user 2'),
 ('FoundItems',  'INSERT', 10, 'Found item "Black umbrella" reported by user 3'),
 ('FoundItems',  'INSERT', 11, 'Found item "Redmi phone" reported by user 4'),
 ('FoundItems',  'INSERT', 12, 'Found item "Black spectacles" reported by user 5'),
 ('FoundItems',  'INSERT', 13, 'Found item "Samsung phone" reported by user 6'),
 ('FoundItems',  'INSERT', 14, 'Found item "Silver HP laptop" reported by user 7'),
 ('FoundItems',  'INSERT', 15, 'Found item "Black sling bag" reported by user 8'),
 ('FoundItems',  'INSERT', 16, 'Found item "Black card holder" reported by user 9'),
 ('FoundItems',  'INSERT', 17, 'Found item "Black jacket" reported by user 10'),
 ('FoundItems',  'INSERT', 18, 'Found item "Notebook" reported by user 2'),
 ('FoundItems',  'INSERT', 19, 'Found item "Steel lunch box" reported by user 3'),
 ('FoundItems',  'INSERT', 20, 'Found item "Bike key" reported by user 4');

-- ---------- Matches ----------
-- On MySQL the seed called sp_find_matches() for every report. On TiDB the
-- same scoring is done by a plain INSERT ... SELECT with the identical
-- formula: same category +40, same location +30, found within 7 days after
-- the loss +20, first title word appears in the item title +10. Only pairs
-- scoring 50+ are kept.
INSERT INTO Matches (report_id, item_id, score)
SELECT s.report_id, s.item_id, s.score
FROM (
  SELECT r.report_id,
         f.item_id,
         (CASE WHEN f.category_id = r.category_id THEN 40 ELSE 0 END)
       + (CASE WHEN f.location_id = r.location_id THEN 30 ELSE 0 END)
       + (CASE WHEN f.date_found BETWEEN r.date_lost AND DATE_ADD(r.date_lost, INTERVAL 7 DAY)
                THEN 20 ELSE 0 END)
       + (CASE WHEN CHAR_LENGTH(SUBSTRING_INDEX(r.title, ' ', 1)) >= 3
                AND LOCATE(LOWER(SUBSTRING_INDEX(r.title, ' ', 1)), LOWER(f.title)) > 0
               THEN 10 ELSE 0 END) AS score
  FROM LostReports r
  JOIN FoundItems f ON f.status IN ('unclaimed', 'claim_pending')
  WHERE r.status IN ('open', 'matched')
    AND f.category_id = r.category_id      -- a phone is never a match for a wallet
) AS s
WHERE s.score >= 50;

-- sp_find_matches flipped the report to 'matched' when it created a match.
UPDATE LostReports SET status = 'matched'
WHERE status = 'open'
  AND report_id IN (SELECT report_id FROM Matches);

-- One owner gave up looking
UPDATE LostReports SET status = 'closed' WHERE report_id = 11;

-- ---------- Claims (ids 1-9) ----------
-- (id, item, claimant, linked report, proof, created)
-- On MySQL, trg_claim_before_insert validated each of these rows and
-- trg_claim_after_insert flipped the item to 'claim_pending' + wrote the
-- audit row. Here the items are updated explicitly right after the insert.
INSERT INTO Claims (claim_id, item_id, claimant_id, report_id, proof_text, created_at) VALUES
 (1, 1,  2, 1,    'Lock screen is a photo of my cat and the case is blue',                   NOW() - INTERVAL 2 DAY),
 (2, 2,  3, 2,    'Wallet has my college ID and a Rs 500 note inside',                       NOW() - INTERVAL 6 DAY),
 (3, 17, 2, 19,   'Black Adidas jacket with my name tag inside the collar',                  NOW() - INTERVAL 13 DAY),
 (4, 18, 9, 17,   'Blue notebook with my name written on the first page',                    NOW() - INTERVAL 10 DAY),
 (5, 6,  7, 6,    'Dell 65W charger, the cable has black tape near the plug',                NOW() - INTERVAL 5 DAY),
 (6, 3,  4, 3,    'It is my ID card, name Priya Sharma and roll number on the front',        NOW() - INTERVAL 1 DAY),
 (7, 3,  6, NULL, 'I think this is my ID card, I lost it near the stairs',                   NOW() - INTERVAL 1 DAY),
 (8, 8,  9, 8,    'Navy hoodie, size M, university logo with a small ink stain on the cuff', NOW() - INTERVAL 7 DAY),
 (9, 8,  4, NULL, 'I believe this hoodie is mine',                                           NOW() - INTERVAL 6 DAY);

-- trg_claim_after_insert: every newly claimed item becomes 'claim_pending'
UPDATE FoundItems SET status = 'claim_pending'
WHERE item_id IN (1, 2, 17, 18, 6, 3, 8) AND status = 'unclaimed';

-- trg_claim_after_insert audit rows
INSERT INTO AuditLog (table_name, action, record_id, details) VALUES
 ('Claims', 'INSERT', 1, 'User 2 claimed item 1'),
 ('Claims', 'INSERT', 2, 'User 3 claimed item 2'),
 ('Claims', 'INSERT', 3, 'User 2 claimed item 17'),
 ('Claims', 'INSERT', 4, 'User 9 claimed item 18'),
 ('Claims', 'INSERT', 5, 'User 7 claimed item 6'),
 ('Claims', 'INSERT', 6, 'User 4 claimed item 3'),
 ('Claims', 'INSERT', 7, 'User 6 claimed item 3'),
 ('Claims', 'INSERT', 8, 'User 9 claimed item 8'),
 ('Claims', 'INSERT', 9, 'User 4 claimed item 8');

-- ---------- Admin decisions ----------
-- On MySQL these were done by sp_verify_claim(claim, admin, note, remarks),
-- the verify-and-hand-over TRANSACTION: verify the claim (triggers update
-- item + report + audit), reject every other pending claim on the item, then
-- record the handover. The identical effects, written out:

-- sp_verify_claim(2, 1, 'Contents and ID matched the owner', 'Handed over at the security office')
UPDATE Claims SET status = 'verified', reviewed_by = 1,
       admin_note = 'Contents and ID matched the owner'
WHERE claim_id = 2;
UPDATE FoundItems SET status = 'claimed' WHERE item_id = 2;      -- trg_claim_after_update
UPDATE LostReports SET status = 'resolved' WHERE report_id = 2;  -- trg_claim_after_update
INSERT INTO AuditLog (table_name, action, record_id, details) VALUES
 ('Claims', 'STATUS_CHANGE', 2, 'Claim 2 changed from pending to verified');

-- sp_verify_claim(3, 1, 'Name tag matched', 'Collected from the Mess office')
UPDATE Claims SET status = 'verified', reviewed_by = 1,
       admin_note = 'Name tag matched'
WHERE claim_id = 3;
UPDATE FoundItems SET status = 'claimed' WHERE item_id = 17;
UPDATE LostReports SET status = 'resolved' WHERE report_id = 19;
INSERT INTO AuditLog (table_name, action, record_id, details) VALUES
 ('Claims', 'STATUS_CHANGE', 3, 'Claim 3 changed from pending to verified');

-- sp_verify_claim(8, 1, 'Ink stain on the cuff matched the owner', 'Collected from the Sports office')
--   - verifies claim 8, AND auto-rejects every other pending claim on item 8
UPDATE Claims SET status = 'verified', reviewed_by = 1,
       admin_note = 'Ink stain on the cuff matched the owner'
WHERE claim_id = 8;
UPDATE FoundItems SET status = 'claimed' WHERE item_id = 8;
UPDATE LostReports SET status = 'resolved' WHERE report_id = 8;
UPDATE Claims SET status = 'rejected', reviewed_by = 1,
       admin_note = 'Another claim was verified for this item'
WHERE item_id = 8 AND claim_id <> 8 AND status = 'pending';      -- rejects claim 9
INSERT INTO AuditLog (table_name, action, record_id, details) VALUES
 ('Claims', 'STATUS_CHANGE', 8, 'Claim 8 changed from pending to verified'),
 ('Claims', 'STATUS_CHANGE', 9, 'Claim 9 changed from pending to rejected');
-- (the trigger would try to flip item 8 back to 'unclaimed' here, but only
--  from 'claim_pending' - it is already 'claimed', so nothing to do)

-- Handovers recorded by the three sp_verify_claim calls
INSERT INTO Handovers (handover_id, claim_id, handed_by, remarks) VALUES
 (1, 2, 1, 'Handed over at the security office'),
 (2, 3, 1, 'Collected from the Mess office'),
 (3, 8, 1, 'Collected from the Sports office');

-- A plain rejection done by the admin page (UPDATE, like trg_claim_before_update /
-- trg_claim_after_update would allow): claim 4 -> rejected, item 18 back to unclaimed
UPDATE Claims SET status = 'rejected', reviewed_by = 1,
       admin_note = 'No name in the notebook, proof did not match'
WHERE claim_id = 4;
UPDATE FoundItems SET status = 'unclaimed'
WHERE item_id = 18 AND status = 'claim_pending';
INSERT INTO AuditLog (table_name, action, record_id, details) VALUES
 ('Claims', 'STATUS_CHANGE', 4, 'Claim 4 changed from pending to rejected'),
 ('Handovers', 'INSERT', 1, 'Item handed over for claim 2 by admin 1'),
 ('Handovers', 'INSERT', 2, 'Item handed over for claim 3 by admin 1'),
 ('Handovers', 'INSERT', 3, 'Item handed over for claim 8 by admin 1');

-- ---------- Back-date review times so the admin stats look realistic ----------
UPDATE Claims SET reviewed_at = NOW() - INTERVAL 5 DAY  WHERE claim_id = 2;
UPDATE Claims SET reviewed_at = NOW() - INTERVAL 12 DAY WHERE claim_id = 3;
UPDATE Claims SET reviewed_at = NOW() - INTERVAL 9 DAY  WHERE claim_id = 4;
UPDATE Claims SET reviewed_at = NOW() - INTERVAL 5 DAY  WHERE claim_id IN (8, 9);
UPDATE Handovers SET handed_at = NOW() - INTERVAL 5 DAY  WHERE claim_id IN (2, 8);
UPDATE Handovers SET handed_at = NOW() - INTERVAL 11 DAY WHERE claim_id = 3;
