-- Storage tables for scraped official-site data.
-- This does not replace Prisma migrations. It complements them.

CREATE SCHEMA IF NOT EXISTS ingest;

CREATE TABLE IF NOT EXISTS ingest.raw_news (
  id BIGSERIAL PRIMARY KEY,
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  published_text TEXT,
  crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL,
  UNIQUE (source_url)
);

CREATE TABLE IF NOT EXISTS ingest.raw_squad (
  id BIGSERIAL PRIMARY KEY,
  source_url TEXT NOT NULL,
  name TEXT NOT NULL,
  number INTEGER,
  position TEXT,
  image_url TEXT,
  crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL,
  UNIQUE (source_url, name)
);

CREATE TABLE IF NOT EXISTS ingest.sync_log (
  id BIGSERIAL PRIMARY KEY,
  sync_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
