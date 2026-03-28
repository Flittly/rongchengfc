# PostgreSQL Sync Toolkit

This folder contains SQL files and Python scripts for:

- Preparing a PostgreSQL database
- Running SQL migrations for scraping/sync tables
- Crawling data from `https://www.cdrcfc.com.cn/`
- Synchronizing crawled data into PostgreSQL

## Structure

```text
ops/pg_sync/
  sql/
    00_create_database.sql
    01_create_ingest_schema.sql
    02_indexes.sql
  python/
    requirements.txt
    db_utils.py
    run_sql_sync.py
    crawl_cdrcfc.py
    sync_crawled_to_pg.py
```

## 1) Install Python dependencies (uv)

From repo root:

```bash
uv sync --project ops/pg_sync/python
```

## 2) Configure environment

The scripts read environment variables from `.env.local` in repo root by default.

Required:

- `DATABASE_URL`

Optional:

- `CDRCFC_BASE_URL` (default: `https://www.cdrcfc.com.cn`)
- `CDRCFC_OUTPUT` (default: `data/scraped/cdrcfc-python.json`)

## 3) Run SQL sync

Initialize the target database from `DATABASE_URL` and then apply the ingest schema/index SQL:

```bash
uv run --project ops/pg_sync/python python ops/pg_sync/python/run_sql_sync.py --include-bootstrap
```

For later runs, when the database already exists, you can skip bootstrap:

```bash
uv run --project ops/pg_sync/python python ops/pg_sync/python/run_sql_sync.py
```

`--include-bootstrap` does not execute `00_create_database.sql` directly. Instead it connects to the admin database (`postgres`) with Python and creates the target database from `DATABASE_URL` if it is missing.

## 4) Crawl the official site

```bash
uv run --project ops/pg_sync/python python ops/pg_sync/python/crawl_cdrcfc.py
```

Output JSON default:

`data/scraped/cdrcfc-python.json`

Player images are downloaded by default to:

`data/scraped/player-images/`

The crawler now fetches:

- News list items
- First-team player cards from `/Players`
- Each player's detail page (`/player-detail?player_id=...`)
- Player portrait images

Each player item now includes basic fields plus detail-page data such as personal info,
career summary, ability ratings, club/cup/international stats, honours, and highlights.

Useful options:

```bash
# skip image downloads
uv run --project ops/pg_sync/python python ops/pg_sync/python/crawl_cdrcfc.py --skip-images

# crawl only a few players for debugging
uv run --project ops/pg_sync/python python ops/pg_sync/python/crawl_cdrcfc.py --max-players 3
```

## 4.1) Collect all site images into a manifest

This step crawls content pages, downloads image assets into category folders, and writes a manifest:

- Raw images: `data/raw-images/<category>/`
- Manifest: `data/scraped/image-manifest.json`

```bash
uv run --project ops/pg_sync/python python ops/pg_sync/python/collect_cdrcfc_images.py
```

Recommended for the official site, which can be slow and occasionally time out:

```bash
uv run --project ops/pg_sync/python python ops/pg_sync/python/collect_cdrcfc_images.py \
  --skip-page-fetch \
  --download-retries 1 \
  --connect-timeout 4 \
  --read-timeout 5 \
  --checkpoint-every 2
```

The collector now supports resumable runs:

- existing manifest entries are reused
- already-downloaded raw files are not fetched again
- progress is checkpointed to the manifest during the run
- failed URLs can be retried by rerunning the same command

Categories:

- `players`
- `news`
- `honours`
- `highlights`
- `team`
- `site`

## 4.2) Normalize images and optionally run AI enhancement

This step creates:

- Processed images: `data/processed-images/<category>/`
- Public assets for the app: `public/images/cdrcfc/<category>/`

```bash
uv run --project ops/pg_sync/python python ops/pg_sync/python/process_cdrcfc_images.py
```

The processor updates `data/scraped/cdrcfc-python.json` with fields such as:

- `processed_image_public_url`
- `processed_image_path`

Optional AI hooks:

- `GFPGAN_CMD` or `CDRCFC_PLAYER_ENHANCER_CMD` for player portraits
- `REALESRGAN_CMD` or `CDRCFC_IMAGE_ENHANCER_CMD` for generic images

Command templates should contain `{input}` and `{output}` placeholders.
If no AI command is configured, the script falls back to deterministic resizing, crop/contain, and sharpening.

### Built-in AI wrapper for GFPGAN + Real-ESRGAN

If you have local clones of the official repositories, you can let the processor call them through the built-in wrapper:

```bash
uv run --project ops/pg_sync/python python ops/pg_sync/python/process_cdrcfc_images.py --use-ai-wrapper
```

Or from npm:

```bash
npm run images:process:ai
```

Configure one or both of these groups in `.env.local`:

- `CDRCFC_GFPGAN_SCRIPT` or `CDRCFC_GFPGAN_REPO`
- `CDRCFC_REALESRGAN_SCRIPT` or `CDRCFC_REALESRGAN_REPO`

Optional tuning variables:

- `CDRCFC_USE_AI_WRAPPER=1`
- `CDRCFC_GFPGAN_PYTHON`
- `CDRCFC_GFPGAN_VERSION`
- `CDRCFC_GFPGAN_UPSCALE`
- `CDRCFC_REALESRGAN_PYTHON`
- `CDRCFC_REALESRGAN_MODEL_NAME`
- `CDRCFC_REALESRGAN_OUTSCALE`
- `CDRCFC_REALESRGAN_TILE`

Recommended usage:

- player portraits: `GFPGAN` first, then `Real-ESRGAN`
- generic still images: `Real-ESRGAN`
- animated GIF highlights: keep original frames and normalize later only if needed

## 5) Sync crawled JSON into PostgreSQL

```bash
uv run --project ops/pg_sync/python python ops/pg_sync/python/sync_crawled_to_pg.py
```

By default this writes to `ingest.raw_news` and `ingest.raw_squad`.
Use `--sync-app` to also upsert into app tables (`NewsPost`, `Player`).

```bash
uv run --project ops/pg_sync/python python ops/pg_sync/python/sync_crawled_to_pg.py --sync-app
```

With `--sync-app`, player sync now fills:

- Basic player fields (`name`, `position`, `nationality`, `birthDate`, `heightCm`, `portraitUrl`)
- Summary stats (`appearances`, `goals`, `assists`)
- Detail metadata (`sourcePlayerId`, `sourceUrl`, `currentClub`, `preferredFoot`)
- JSON detail fields (`careerSummary`, `abilities`, `clubStats`, `cupStats`, `internationalStats`, `honours`)
- Highlights into `PlayerMoment` when the crawled player payload includes them
