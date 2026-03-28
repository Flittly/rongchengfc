from __future__ import annotations

import argparse
import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable
from uuid import uuid4

from db_utils import connect_db, ensure_env


DEFAULT_INPUT = "data/scraped/cdrcfc-python.json"


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "-", text)
    text = re.sub(r"-{2,}", "-", text).strip("-")
    return text or f"item-{int(datetime.now().timestamp())}"


def parse_date_text(raw: str) -> datetime:
    if not raw:
        return datetime.now()

    cleaned = (
        raw.replace("年", "-")
        .replace("月", "-")
        .replace("日", "")
        .replace("Δκ", "-")
        .replace("ΤΒ", "-")
        .replace("ΘΥ", "")
        .replace("/", "-")
        .strip()
    )

    digits = re.findall(r"\d+", cleaned)
    if len(digits) >= 3:
        year, month, day = digits[:3]
        try:
            return datetime(int(year), int(month), int(day))
        except ValueError:
            pass

    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d", "%y-%m-%d"):
        try:
            return datetime.strptime(cleaned, fmt)
        except ValueError:
            continue

    return datetime.now()


def parse_int(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, int):
        return value

    digits = re.findall(r"\d+", str(value))
    if not digits:
        return None

    try:
        return int(digits[0])
    except ValueError:
        return None


def to_jsonb(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def make_record_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex}"


def build_player_moment_source_key(item: dict[str, Any], index: int) -> str:
    for key in ("match_url", "media_url"):
        value = (item.get(key) or "").strip()
        if value:
            return value

    title = (item.get("title") or "highlight").strip()
    event_time = (item.get("event_time") or "").strip()
    return f"{title}|{event_time}|{index}"


def sync_ingest_news(cur, items: Iterable[dict[str, Any]]) -> int:
    count = 0
    for item in items:
        cur.execute(
            """
            INSERT INTO ingest.raw_news (source_url, title, summary, published_text, payload)
            VALUES (%s, %s, %s, %s, %s::jsonb)
            ON CONFLICT (source_url)
            DO UPDATE SET
              title = EXCLUDED.title,
              summary = EXCLUDED.summary,
              published_text = EXCLUDED.published_text,
              payload = EXCLUDED.payload,
              crawled_at = NOW()
            """,
            (
                item.get("href", ""),
                item.get("title", ""),
                item.get("summary", ""),
                item.get("date_text", ""),
                to_jsonb(item),
            ),
        )
        count += 1
    return count


def sync_ingest_squad(cur, items: Iterable[dict[str, Any]]) -> int:
    count = 0
    for item in items:
        cur.execute(
            """
            INSERT INTO ingest.raw_squad (source_url, name, number, position, image_url, payload)
            VALUES (%s, %s, %s, %s, %s, %s::jsonb)
            ON CONFLICT (source_url, name)
            DO UPDATE SET
              number = EXCLUDED.number,
              position = EXCLUDED.position,
              image_url = EXCLUDED.image_url,
              payload = EXCLUDED.payload,
              crawled_at = NOW()
            """,
            (
                item.get("href", ""),
                item.get("name", ""),
                item.get("number"),
                item.get("position", ""),
                item.get("image_url", ""),
                to_jsonb(item),
            ),
        )
        count += 1
    return count


def sync_player_moments(cur, player_id: str, highlights: list[dict[str, Any]]) -> int:
    active_keys: list[str] = []
    count = 0

    for index, item in enumerate(highlights):
        title = (item.get("title") or "").strip()
        if not title:
            continue

        processed_media_url = (item.get("processed_media_public_url") or "").strip()
        media_url = (item.get("media_url") or "").strip()
        match_url = (item.get("match_url") or "").strip()
        video_url = processed_media_url or media_url or match_url
        if not video_url:
            continue

        source_key = build_player_moment_source_key(item, index)
        active_keys.append(source_key)

        cur.execute(
            """
            INSERT INTO "PlayerMoment" ("id", "title", "videoUrl", "imageUrl", "matchUrl", "sourceKey", "sortOrder", "playerId")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT ("playerId", "sourceKey")
            DO UPDATE SET
              "title" = EXCLUDED."title",
              "videoUrl" = EXCLUDED."videoUrl",
              "imageUrl" = EXCLUDED."imageUrl",
              "matchUrl" = EXCLUDED."matchUrl",
              "sortOrder" = EXCLUDED."sortOrder"
            """,
            (
                make_record_id("moment"),
                title,
                video_url,
                processed_media_url or media_url or None,
                match_url or None,
                source_key,
                index,
                player_id,
            ),
        )
        count += 1

    if active_keys:
        cur.execute(
            """
            DELETE FROM "PlayerMoment"
            WHERE "playerId" = %s
              AND "sourceKey" IS NOT NULL
              AND NOT ("sourceKey" = ANY(%s))
            """,
            (player_id, active_keys),
        )
    else:
        cur.execute(
            """
            DELETE FROM "PlayerMoment"
            WHERE "playerId" = %s
              AND "sourceKey" IS NOT NULL
            """,
            (player_id,),
        )

    return count


def sync_to_app_tables(cur, payload: dict[str, Any]) -> tuple[int, int, int]:
    news_count = 0
    player_count = 0
    moment_count = 0

    for item in payload.get("news", []):
        title = item.get("title", "").strip()
        href = item.get("href", "").strip()
        if not title:
            continue

        slug = slugify(title)
        excerpt = (item.get("summary") or title)[:255]
        content = (item.get("summary") or "") + f"\n\nSource: {href}"
        published_at = parse_date_text(item.get("date_text", ""))
        cover_image = (
            item.get("processed_image_public_url", "").strip()
            or item.get("image_url", "").strip()
            or "/images/news/news-1.svg"
        )

        cur.execute(
            """
            INSERT INTO "NewsPost" ("id", "slug", "title", "excerpt", "content", "coverImage", "category", "publishedAt", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, 'NEWS'::"NewsCategory", %s, NOW(), NOW())
            ON CONFLICT ("slug")
            DO UPDATE SET
              "title" = EXCLUDED."title",
              "excerpt" = EXCLUDED."excerpt",
              "content" = EXCLUDED."content",
              "updatedAt" = NOW()
            """,
            (make_record_id("news"), slug, title, excerpt, content, cover_image, published_at),
        )
        news_count += 1

    for item in payload.get("squad", []):
        name = (item.get("name") or "").strip()
        if not name:
            continue

        slug = slugify(name)
        position = (item.get("position") or "").strip() or "Unknown"
        portrait_url = (
            (item.get("processed_image_public_url") or "").strip()
            or (item.get("image_url") or "").strip()
            or (item.get("image_local_path") or "").strip()
            or "/images/players/wei-shihao.svg"
        )
        number = parse_int(item.get("number")) or parse_int(item.get("jersey_number"))
        nationality = (item.get("nationality") or "中国").strip()
        birth_date = parse_date_text(item.get("birth_date", ""))
        height_cm = parse_int(item.get("height"))
        bio = (item.get("description") or "Imported from official site scraping.").strip()
        current_club = (item.get("current_club") or "").strip() or None
        preferred_foot = (item.get("preferred_foot") or "").strip() or None
        source_player_id = (item.get("player_id") or "").strip() or None
        source_url = (item.get("href") or "").strip() or None

        career_summary = item.get("career_summary") or {}
        appearances = parse_int(career_summary.get("total_appearances")) or 0
        goals = parse_int(career_summary.get("total_goals")) or 0
        assists = parse_int(career_summary.get("total_assists")) or 0

        cur.execute(
            """
            INSERT INTO "Player" (
              "id", "slug", "name", "sourcePlayerId", "sourceUrl", "jerseyNumber", "position",
              "nationality", "birthDate", "heightCm", "weightKg", "bio", "portraitUrl",
              "currentClub", "preferredFoot", "careerSummary", "abilities", "clubStats",
              "cupStats", "internationalStats", "honours", "squad", "appearances", "goals",
              "assists", "createdAt", "updatedAt"
            )
            VALUES (
              %s, %s, %s, %s, %s, %s, %s,
              %s, %s, %s, NULL, %s, %s,
              %s, %s, %s::jsonb, %s::jsonb, %s::jsonb,
              %s::jsonb, %s::jsonb, %s::jsonb, 'FIRST_TEAM'::"SquadType", %s, %s,
              %s, NOW(), NOW()
            )
            ON CONFLICT ("slug")
            DO UPDATE SET
              "name" = EXCLUDED."name",
              "sourcePlayerId" = EXCLUDED."sourcePlayerId",
              "sourceUrl" = EXCLUDED."sourceUrl",
              "jerseyNumber" = EXCLUDED."jerseyNumber",
              "position" = EXCLUDED."position",
              "nationality" = EXCLUDED."nationality",
              "birthDate" = EXCLUDED."birthDate",
              "heightCm" = EXCLUDED."heightCm",
              "bio" = EXCLUDED."bio",
              "portraitUrl" = EXCLUDED."portraitUrl",
              "currentClub" = EXCLUDED."currentClub",
              "preferredFoot" = EXCLUDED."preferredFoot",
              "careerSummary" = EXCLUDED."careerSummary",
              "abilities" = EXCLUDED."abilities",
              "clubStats" = EXCLUDED."clubStats",
              "cupStats" = EXCLUDED."cupStats",
              "internationalStats" = EXCLUDED."internationalStats",
              "honours" = EXCLUDED."honours",
              "appearances" = EXCLUDED."appearances",
              "goals" = EXCLUDED."goals",
              "assists" = EXCLUDED."assists",
              "updatedAt" = NOW()
            RETURNING "id"
            """,
            (
                make_record_id("player"),
                slug,
                name,
                source_player_id,
                source_url,
                number,
                position,
                nationality,
                birth_date,
                height_cm,
                bio,
                portrait_url,
                current_club,
                preferred_foot,
                to_jsonb(career_summary),
                to_jsonb(item.get("abilities") or {}),
                to_jsonb(item.get("club_stats") or []),
                to_jsonb(item.get("cup_stats") or []),
                to_jsonb(item.get("international_stats") or []),
                to_jsonb(item.get("honours") or []),
                appearances,
                goals,
                assists,
            ),
        )
        player_id = cur.fetchone()[0]
        moment_count += sync_player_moments(cur, player_id, item.get("highlights") or [])
        player_count += 1

    return news_count, player_count, moment_count


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync crawled CDRCFC JSON into PostgreSQL.")
    parser.add_argument("--input", default=DEFAULT_INPUT, help="Input JSON path relative to repo root.")
    parser.add_argument(
        "--sync-app",
        action="store_true",
        help='Also upsert into app tables ("NewsPost", "Player").',
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[3]
    ensure_env(repo_root)

    if "CDRCFC_OUTPUT" in os.environ and args.input == DEFAULT_INPUT:
        args.input = os.environ["CDRCFC_OUTPUT"]

    input_file = repo_root / args.input
    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_file}")

    payload = json.loads(input_file.read_text(encoding="utf-8"))
    news_items = payload.get("news", [])
    squad_items = payload.get("squad", [])

    with connect_db() as conn:
        with conn.cursor() as cur:
            news_count = sync_ingest_news(cur, news_items)
            squad_count = sync_ingest_squad(cur, squad_items)

            app_news_count = 0
            app_player_count = 0
            app_moment_count = 0
            if args.sync_app:
                app_news_count, app_player_count, app_moment_count = sync_to_app_tables(cur, payload)

            cur.execute(
                """
                INSERT INTO ingest.sync_log (sync_type, details)
                VALUES (%s, %s::jsonb)
                """,
                (
                    "crawler_sync",
                    json.dumps(
                        {
                            "file": str(input_file),
                            "raw_news_synced": news_count,
                            "raw_squad_synced": squad_count,
                            "app_news_synced": app_news_count,
                            "app_players_synced": app_player_count,
                            "app_player_moments_synced": app_moment_count,
                            "sync_app": bool(args.sync_app),
                        },
                        ensure_ascii=False,
                    ),
                ),
            )
        conn.commit()

    print(f"[sync] raw_news synced: {news_count}")
    print(f"[sync] raw_squad synced: {squad_count}")
    if args.sync_app:
        print(f"[sync] app NewsPost upserts: {app_news_count}")
        print(f"[sync] app Player upserts: {app_player_count}")
        print(f"[sync] app PlayerMoment upserts: {app_moment_count}")
    print("[sync] done")


if __name__ == "__main__":
    main()
