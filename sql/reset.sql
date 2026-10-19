-- =====================================================================
-- reset.sql : wipe the database and rebuild it with fresh demo data.
-- Run from the PROJECT ROOT (so the relative paths below work):
--   mysql -u root -p < sql/reset.sql
-- Use it before every rehearsal and before the final demo.
-- =====================================================================

DROP DATABASE IF EXISTS lostfound;
CREATE DATABASE lostfound CHARACTER SET utf8mb4;
USE lostfound;

SOURCE sql/schema.sql;
SOURCE sql/logic.sql;
SOURCE sql/seed.sql;

-- Quick sanity check
SELECT 'Users' AS tbl, COUNT(*) AS n FROM Users
UNION ALL SELECT 'LostReports', COUNT(*) FROM LostReports
UNION ALL SELECT 'FoundItems',  COUNT(*) FROM FoundItems
UNION ALL SELECT 'Matches',     COUNT(*) FROM Matches
UNION ALL SELECT 'Claims',      COUNT(*) FROM Claims
UNION ALL SELECT 'Handovers',   COUNT(*) FROM Handovers
UNION ALL SELECT 'AuditLog',    COUNT(*) FROM AuditLog;
