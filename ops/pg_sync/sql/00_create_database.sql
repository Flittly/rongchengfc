-- Manual fallback for psql when you want a dedicated database/user.
-- The recommended path is:
-- uv run --project ops/pg_sync/python python ops/pg_sync/python/run_sql_sync.py --include-bootstrap
--
-- Example usage:
-- psql -U postgres -f ops/pg_sync/sql/00_create_database.sql
--
-- Note:
-- This file uses the psql meta-command \gexec so CREATE DATABASE can run
-- outside a transaction. Do not execute this file through the Python SQL runner.

DO
$$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rongchengfc_user') THEN
    CREATE ROLE rongchengfc_user LOGIN PASSWORD 'change_this_password';
  END IF;
END
$$;

SELECT 'CREATE DATABASE rongchengfc OWNER rongchengfc_user'
WHERE NOT EXISTS (
  SELECT 1 FROM pg_database WHERE datname = 'rongchengfc'
)\gexec

-- Run the following in the rongchengfc database:
GRANT ALL PRIVILEGES ON DATABASE rongchengfc TO rongchengfc_user;
