CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_raw_news_crawled_at ON ingest.raw_news (crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_news_title_trgm ON ingest.raw_news USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_raw_squad_crawled_at ON ingest.raw_squad (crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_squad_name_trgm ON ingest.raw_squad USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON ingest.sync_log (created_at DESC);
