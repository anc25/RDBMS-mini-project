-- =====================================================================
-- schema.sql : tables and constraints for Campus Lost & Found
-- Target: MySQL 8 (also tested on MariaDB 10.11)
-- Run first. The database must already exist (see reset.sql).
--   mysql -u root -p lostfound < sql/schema.sql
-- =====================================================================

-- ---------- Users ----------
CREATE TABLE Users (
  user_id        INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  email          VARCHAR(120) NOT NULL UNIQUE,
  phone          VARCHAR(15),
  role           ENUM('user','admin') NOT NULL DEFAULT 'user',
  password_hash  VARCHAR(100) NOT NULL,          -- bcrypt hash, never plain text
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- Lookup tables (keeps names out of the big tables: 3NF) ----------
CREATE TABLE Categories (
  category_id  INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE Locations (
  location_id  INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(80) NOT NULL UNIQUE,
  building     VARCHAR(80)
) ENGINE=InnoDB;

-- ---------- Lost reports ----------
CREATE TABLE LostReports (
  report_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  category_id  INT NOT NULL,
  location_id  INT NOT NULL,
  title        VARCHAR(120) NOT NULL,
  description  TEXT,
  date_lost    DATE NOT NULL,
  status       ENUM('open','matched','resolved','closed') NOT NULL DEFAULT 'open',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lost_user     FOREIGN KEY (user_id)     REFERENCES Users(user_id)           ON DELETE RESTRICT,
  CONSTRAINT fk_lost_category FOREIGN KEY (category_id) REFERENCES Categories(category_id)  ON DELETE RESTRICT,
  CONSTRAINT fk_lost_location FOREIGN KEY (location_id) REFERENCES Locations(location_id)   ON DELETE RESTRICT,
  CONSTRAINT chk_lost_title   CHECK (CHAR_LENGTH(title) >= 3)
) ENGINE=InnoDB;

-- ---------- Found items ----------
CREATE TABLE FoundItems (
  item_id      INT AUTO_INCREMENT PRIMARY KEY,
  finder_id    INT NOT NULL,
  category_id  INT NOT NULL,
  location_id  INT NOT NULL,
  title        VARCHAR(120) NOT NULL,
  description  TEXT,
  date_found   DATE NOT NULL,
  stored_at    VARCHAR(100),                      -- where the item is kept now
  status       ENUM('unclaimed','claim_pending','claimed','disposed') NOT NULL DEFAULT 'unclaimed',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_found_finder   FOREIGN KEY (finder_id)   REFERENCES Users(user_id)           ON DELETE RESTRICT,
  CONSTRAINT fk_found_category FOREIGN KEY (category_id) REFERENCES Categories(category_id)  ON DELETE RESTRICT,
  CONSTRAINT fk_found_location FOREIGN KEY (location_id) REFERENCES Locations(location_id)   ON DELETE RESTRICT,
  CONSTRAINT chk_found_title   CHECK (CHAR_LENGTH(title) >= 3)
) ENGINE=InnoDB;

-- ---------- Matches: a suggested pairing of a lost report and a found item ----------
CREATE TABLE Matches (
  match_id    INT AUTO_INCREMENT PRIMARY KEY,
  report_id   INT NOT NULL,
  item_id     INT NOT NULL,
  score       INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_match_pair   UNIQUE (report_id, item_id),
  CONSTRAINT fk_match_report FOREIGN KEY (report_id) REFERENCES LostReports(report_id) ON DELETE CASCADE,
  CONSTRAINT fk_match_item   FOREIGN KEY (item_id)   REFERENCES FoundItems(item_id)    ON DELETE CASCADE,
  CONSTRAINT chk_match_score CHECK (score BETWEEN 0 AND 100)
) ENGINE=InnoDB;

-- ---------- Claims ----------
CREATE TABLE Claims (
  claim_id     INT AUTO_INCREMENT PRIMARY KEY,
  item_id      INT NOT NULL,
  claimant_id  INT NOT NULL,
  report_id    INT NULL,                          -- optional link to the claimant's lost report
  proof_text   TEXT NOT NULL,
  status       ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by  INT NULL,
  admin_note   VARCHAR(255),
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at  DATETIME NULL,
  CONSTRAINT fk_claim_item     FOREIGN KEY (item_id)     REFERENCES FoundItems(item_id)   ON DELETE RESTRICT,
  CONSTRAINT fk_claim_claimant FOREIGN KEY (claimant_id) REFERENCES Users(user_id)        ON DELETE RESTRICT,
  CONSTRAINT fk_claim_report   FOREIGN KEY (report_id)   REFERENCES LostReports(report_id) ON DELETE SET NULL,
  CONSTRAINT fk_claim_reviewer FOREIGN KEY (reviewed_by) REFERENCES Users(user_id)        ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- Handovers: one per verified claim ----------
CREATE TABLE Handovers (
  handover_id  INT AUTO_INCREMENT PRIMARY KEY,
  claim_id     INT NOT NULL UNIQUE,
  handed_by    INT NOT NULL,
  handed_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remarks      VARCHAR(255),
  CONSTRAINT fk_handover_claim FOREIGN KEY (claim_id)  REFERENCES Claims(claim_id) ON DELETE RESTRICT,
  CONSTRAINT fk_handover_admin FOREIGN KEY (handed_by) REFERENCES Users(user_id)   ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------- Audit log (written only by triggers) ----------
CREATE TABLE AuditLog (
  log_id        INT AUTO_INCREMENT PRIMARY KEY,
  table_name    VARCHAR(30)  NOT NULL,
  action        VARCHAR(30)  NOT NULL,
  record_id     INT,
  details       VARCHAR(255),
  performed_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- Seed lookup data (needed by the app even without demo data) ----------
INSERT INTO Categories (category_id, name) VALUES
  (1,'Phone'),(2,'Wallet'),(3,'ID Card'),(4,'Keys'),(5,'Bag'),
  (6,'Laptop/Charger'),(7,'Books'),(8,'Clothing'),(9,'Other');

INSERT INTO Locations (location_id, name, building) VALUES
  (1,'Library','Central Library'),
  (2,'Mess','Dining Hall'),
  (3,'Hostel Block A','Hostel'),
  (4,'Hostel Block B','Hostel'),
  (5,'Academic Block','Academic Block 1'),
  (6,'Sports Ground','Sports Complex'),
  (7,'Canteen','Food Court'),
  (8,'Auditorium','Main Auditorium');
