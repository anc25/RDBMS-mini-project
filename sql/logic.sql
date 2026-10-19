-- =====================================================================
-- logic.sql : triggers, stored procedures and views
-- Run after schema.sql:
--   mysql -u root -p lostfound < sql/logic.sql
-- Safe to re-run on its own (everything is dropped first).
-- NOTE: the DELIMITER lines are a mysql-client feature; if you paste this
-- into Workbench, run the whole file, do not split it by hand.
-- =====================================================================

DROP TRIGGER IF EXISTS trg_lost_before_insert;
DROP TRIGGER IF EXISTS trg_lost_after_insert;
DROP TRIGGER IF EXISTS trg_found_before_insert;
DROP TRIGGER IF EXISTS trg_found_after_insert;
DROP TRIGGER IF EXISTS trg_claim_before_insert;
DROP TRIGGER IF EXISTS trg_claim_after_insert;
DROP TRIGGER IF EXISTS trg_claim_before_update;
DROP TRIGGER IF EXISTS trg_claim_after_update;
DROP TRIGGER IF EXISTS trg_handover_before_insert;
DROP TRIGGER IF EXISTS trg_handover_after_insert;
DROP PROCEDURE IF EXISTS sp_find_matches;
DROP PROCEDURE IF EXISTS sp_verify_claim;

DELIMITER $$

-- ---------------------------------------------------------------------
-- Dates: MySQL cannot use CURDATE() inside a CHECK, so a trigger does it.
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_lost_before_insert BEFORE INSERT ON LostReports
FOR EACH ROW
BEGIN
  IF NEW.date_lost > CURDATE() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Date lost cannot be in the future';
  END IF;
END$$

CREATE TRIGGER trg_found_before_insert BEFORE INSERT ON FoundItems
FOR EACH ROW
BEGIN
  IF NEW.date_found > CURDATE() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Date found cannot be in the future';
  END IF;
END$$

-- ---------------------------------------------------------------------
-- Audit rows for new reports and items
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_lost_after_insert AFTER INSERT ON LostReports
FOR EACH ROW
BEGIN
  INSERT INTO AuditLog (table_name, action, record_id, details)
  VALUES ('LostReports', 'INSERT', NEW.report_id,
          CONCAT('Lost report "', NEW.title, '" filed by user ', NEW.user_id));
END$$

CREATE TRIGGER trg_found_after_insert AFTER INSERT ON FoundItems
FOR EACH ROW
BEGIN
  INSERT INTO AuditLog (table_name, action, record_id, details)
  VALUES ('FoundItems', 'INSERT', NEW.item_id,
          CONCAT('Found item "', NEW.title, '" reported by user ', NEW.finder_id));
END$$

-- ---------------------------------------------------------------------
-- Claims, before insert: business rules
--   * item must still be claimable
--   * finder cannot claim their own found item
--   * one pending claim per user per item
--   * a linked lost report must belong to the claimant
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_claim_before_insert BEFORE INSERT ON Claims
FOR EACH ROW
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_finder INT;
  DECLARE v_owner  INT;

  SELECT status, finder_id INTO v_status, v_finder
  FROM FoundItems WHERE item_id = NEW.item_id;

  IF v_status IN ('claimed', 'disposed') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This item is no longer available to claim';
  END IF;

  IF v_finder = NEW.claimant_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You cannot claim an item you found yourself';
  END IF;

  IF EXISTS (SELECT 1 FROM Claims
             WHERE item_id = NEW.item_id AND claimant_id = NEW.claimant_id AND status = 'pending') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You already have a pending claim on this item';
  END IF;

  IF NEW.report_id IS NOT NULL THEN
    SELECT user_id INTO v_owner FROM LostReports WHERE report_id = NEW.report_id;
    IF v_owner IS NULL OR v_owner <> NEW.claimant_id THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The linked lost report does not belong to you';
    END IF;
  END IF;
END$$

-- Claims, after insert: item becomes claim_pending, write audit row
CREATE TRIGGER trg_claim_after_insert AFTER INSERT ON Claims
FOR EACH ROW
BEGIN
  UPDATE FoundItems SET status = 'claim_pending'
  WHERE item_id = NEW.item_id AND status = 'unclaimed';

  INSERT INTO AuditLog (table_name, action, record_id, details)
  VALUES ('Claims', 'INSERT', NEW.claim_id,
          CONCAT('User ', NEW.claimant_id, ' claimed item ', NEW.item_id));
END$$

-- ---------------------------------------------------------------------
-- Claims, before update
--   * a reviewed claim cannot be reviewed again
--   * only one verified claim per item
--   * stamp reviewed_at automatically
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_claim_before_update BEFORE UPDATE ON Claims
FOR EACH ROW
BEGIN
  IF OLD.status <> 'pending' AND NEW.status <> OLD.status THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This claim has already been reviewed';
  END IF;

  IF NEW.status = 'verified' AND OLD.status <> 'verified' THEN
    IF EXISTS (SELECT 1 FROM Claims
               WHERE item_id = NEW.item_id AND status = 'verified' AND claim_id <> NEW.claim_id) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Another claim is already verified for this item';
    END IF;
  END IF;

  IF OLD.status = 'pending' AND NEW.status <> 'pending' AND NEW.reviewed_at IS NULL THEN
    SET NEW.reviewed_at = NOW();
  END IF;
END$$

-- ---------------------------------------------------------------------
-- Claims, after update: keep item and report statuses in sync
--   verified -> item 'claimed', linked report 'resolved'
--   rejected -> item back to 'unclaimed' if no other pending claims remain
-- (A trigger cannot update its own table, so rejecting the *other* pending
--  claims on a verified item is done in sp_verify_claim below.)
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_claim_after_update AFTER UPDATE ON Claims
FOR EACH ROW
BEGIN
  IF NEW.status <> OLD.status THEN

    IF NEW.status = 'verified' THEN
      UPDATE FoundItems SET status = 'claimed' WHERE item_id = NEW.item_id;
      IF NEW.report_id IS NOT NULL THEN
        UPDATE LostReports SET status = 'resolved' WHERE report_id = NEW.report_id;
      END IF;

    ELSEIF NEW.status = 'rejected' THEN
      IF NOT EXISTS (SELECT 1 FROM Claims
                     WHERE item_id = NEW.item_id AND status = 'pending' AND claim_id <> NEW.claim_id) THEN
        UPDATE FoundItems SET status = 'unclaimed'
        WHERE item_id = NEW.item_id AND status = 'claim_pending';
      END IF;
    END IF;

    INSERT INTO AuditLog (table_name, action, record_id, details)
    VALUES ('Claims', 'STATUS_CHANGE', NEW.claim_id,
            CONCAT('Claim ', NEW.claim_id, ' changed from ', OLD.status, ' to ', NEW.status));
  END IF;
END$$

-- ---------------------------------------------------------------------
-- Handovers: only for verified claims
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_handover_before_insert BEFORE INSERT ON Handovers
FOR EACH ROW
BEGIN
  DECLARE v_status VARCHAR(20);
  SELECT status INTO v_status FROM Claims WHERE claim_id = NEW.claim_id;
  IF v_status IS NULL OR v_status <> 'verified' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A handover can only be recorded for a verified claim';
  END IF;
END$$

CREATE TRIGGER trg_handover_after_insert AFTER INSERT ON Handovers
FOR EACH ROW
BEGIN
  INSERT INTO AuditLog (table_name, action, record_id, details)
  VALUES ('Handovers', 'INSERT', NEW.handover_id,
          CONCAT('Item handed over for claim ', NEW.claim_id, ' by admin ', NEW.handed_by));
END$$

-- ---------------------------------------------------------------------
-- sp_find_matches(report_id)
-- Only found items in the SAME CATEGORY are considered. Each one is scored:
--   category +40, same location +30,
--   found within 7 days after the loss +20, first title word appears +10.
-- Rows scoring 50+ go into Matches (existing pairs are skipped).
-- Returns one row: matches_created (number of NEW matches).
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_find_matches(IN p_report_id INT)
BEGIN
  DECLARE v_created INT DEFAULT 0;

  INSERT IGNORE INTO Matches (report_id, item_id, score)
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
    WHERE r.report_id = p_report_id
      AND r.status IN ('open', 'matched')
      AND f.category_id = r.category_id        -- a phone is never a match for a wallet
  ) AS s
  WHERE s.score >= 50;

  SET v_created = ROW_COUNT();

  IF v_created > 0 THEN
    UPDATE LostReports SET status = 'matched'
    WHERE report_id = p_report_id AND status = 'open';
  END IF;

  SELECT v_created AS matches_created;
END$$

-- ---------------------------------------------------------------------
-- sp_verify_claim(claim_id, admin_id, admin_note, handover_remarks)
-- The "verify and hand over" TRANSACTION. All steps succeed or none do:
--   1. verify the claim (triggers update item + report + audit log)
--   2. reject every other pending claim on the same item
--   3. record the handover
-- Any error (including trigger errors) rolls everything back and is re-raised.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_verify_claim(
  IN p_claim_id INT,
  IN p_admin_id INT,
  IN p_note     VARCHAR(255),
  IN p_remarks  VARCHAR(255)
)
BEGIN
  DECLARE v_item INT DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NOT EXISTS (SELECT 1 FROM Users WHERE user_id = p_admin_id AND role = 'admin') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only an admin can verify a claim';
  END IF;

  START TRANSACTION;

  SELECT item_id INTO v_item FROM Claims
  WHERE claim_id = p_claim_id AND status = 'pending'
  FOR UPDATE;

  IF v_item IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Claim not found or already reviewed';
  END IF;

  UPDATE Claims
  SET status = 'verified', reviewed_by = p_admin_id, admin_note = p_note
  WHERE claim_id = p_claim_id;

  UPDATE Claims
  SET status = 'rejected', reviewed_by = p_admin_id,
      admin_note = 'Another claim was verified for this item'
  WHERE item_id = v_item AND claim_id <> p_claim_id AND status = 'pending';

  INSERT INTO Handovers (claim_id, handed_by, remarks)
  VALUES (p_claim_id, p_admin_id, p_remarks);

  COMMIT;
END$$

DELIMITER ;

-- ---------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_open_found_items AS
SELECT f.item_id, f.title, f.description, f.date_found, f.stored_at, f.status,
       c.name AS category, l.name AS location
FROM FoundItems f
JOIN Categories c ON c.category_id = f.category_id
JOIN Locations  l ON l.location_id = f.location_id
WHERE f.status = 'unclaimed';

CREATE OR REPLACE VIEW v_claim_details AS
SELECT cl.claim_id, cl.status, cl.proof_text, cl.admin_note, cl.created_at, cl.reviewed_at,
       u.user_id  AS claimant_id, u.name AS claimant_name, u.email AS claimant_email,
       f.item_id, f.title AS item_title,
       r.report_id, r.title AS report_title
FROM Claims cl
JOIN Users u      ON u.user_id = cl.claimant_id
JOIN FoundItems f ON f.item_id = cl.item_id
LEFT JOIN LostReports r ON r.report_id = cl.report_id;
