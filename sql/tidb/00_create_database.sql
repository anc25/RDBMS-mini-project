-- =====================================================================
-- 00_create_database.sql : run this FIRST on TiDB Cloud.
--
--   mysql --host <HOST> --port 4000 -u <USER> -p \
--         --ssl-mode=VERIFY_IDENTITY < sql/tidb/00_create_database.sql
--
-- (or paste the two lines below into the TiDB Cloud web SQL console)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS lostfound CHARACTER SET utf8mb4;
