-- =====================================================================
-- 02_views.sql : views for Campus Lost & Found on TiDB Cloud.
-- Run after 01_schema.sql (views are fully supported by TiDB).
-- Safe to re-run.
-- =====================================================================

USE lostfound;

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
