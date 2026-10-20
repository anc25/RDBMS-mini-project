-- =====================================================================
-- 04_sanity_check.sql : quick check after loading 01-03 on TiDB Cloud.
-- Expected: Users 10, LostReports 20, FoundItems 20, Matches 28,
-- Claims 9 (3 verified, 2 rejected, 4 pending), Handovers 3, AuditLog 57.
-- =====================================================================

USE lostfound;

SELECT 'Users' AS tbl, COUNT(*) AS n FROM Users
UNION ALL SELECT 'LostReports', COUNT(*) FROM LostReports
UNION ALL SELECT 'FoundItems',  COUNT(*) FROM FoundItems
UNION ALL SELECT 'Matches',     COUNT(*) FROM Matches
UNION ALL SELECT 'Claims',      COUNT(*) FROM Claims
UNION ALL SELECT 'Handovers',   COUNT(*) FROM Handovers
UNION ALL SELECT 'AuditLog',    COUNT(*) FROM AuditLog;

-- Claim breakdown: pending 4, verified 3, rejected 2
SELECT status, COUNT(*) FROM Claims GROUP BY status;

-- Final item statuses: claimed 3, claim_pending 3, unclaimed 14
SELECT status, COUNT(*) FROM FoundItems GROUP BY status;

-- Peek at the views
SELECT * FROM v_open_found_items LIMIT 5;
SELECT * FROM v_claim_details  LIMIT 5;
