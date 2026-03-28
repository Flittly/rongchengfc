from __future__ import annotations

import argparse
import time
from collections import OrderedDict
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup
from PIL import Image

from db_utils import ensure_env
from image_pipeline_utils import (
    IMAGE_CATEGORIES,
    build_session,
    clean_text,
    detect_category,
    ensure_dir,
    fetch_binary,
    fetch_html,
    infer_player_id,
    read_json,
    safe_filename_from_url,
    sha256_bytes,
    to_abs,
    write_json,
)


DEFAULT_INPUT = "data/scraped/cdrcfc-python.json"
DEFAULT_MANIFEST = "data/scraped/image-manifest.json"
DEFAULT_RAW_DIR = "data/raw-images"


def make_manifest_entry(ref: dict[str, str], existing: dict[str, Any] | None = None) -> dict[str, Any]:
    base = {
        "url": ref["url"],
        "category": ref["category"],
        "player_id": ref["player_id"],
        "news_href": ref["news_href"],
        "source_pages": [ref["source_page"]] if ref["source_page"] else [],
        "source_kinds": [ref["source_kind"]],
        "alts": [ref["alt"]] if ref["alt"] else [],
        "raw_path": "",
        "processed_path": "",
        "public_path": "",
        "content_sha256": "",
        "width": 0,
        "height": 0,
        "format": "",
        "is_animated": False,
        "status": "queued",
    }
    if not existing:
        return base

    merged = dict(existing)
    merged.update(
        {
            "url": existing.get("url") or ref["url"],
            "category": existing.get("category") or ref["category"],
            "player_id": existing.get("player_id") or ref["player_id"],
            "news_href": existing.get("news_href") or ref["news_href"],
            "source_pages": list(existing.get("source_pages") or []),
            "source_kinds": list(existing.get("source_kinds") or []),
            "alts": list(existing.get("alts") or []),
        }
    )
    return merge_reference(merged, ref)


def save_manifest_snapshot(manifest_file: Path, *, base_url: str, entries: list[dict[str, Any]]) -> None:
    manifest_payload = {
        "version": 1,
        "generated_at": time.time(),
        "source": base_url,
        "entries": sorted(entries, key=lambda item: (item["category"], item["url"])),
    }
    write_json(manifest_file, manifest_payload)


def iter_candidate_pages(base_url: str, payload: dict[str, Any]) -> list[dict[str, str]]:
    pages = [
        {"url": f"{base_url}/", "kind": "site_home"},
        {"url": f"{base_url}/news", "kind": "news_page"},
        {"url": f"{base_url}/Players", "kind": "players_index"},
        {"url": f"{base_url}/reservePlayers", "kind": "team_page"},
    ]

    for item in payload.get("news", []):
        href = (item.get("href") or "").strip()
        if href:
            pages.append({"url": href, "kind": "news_detail"})

    for item in payload.get("squad", []):
        href = (item.get("href") or "").strip()
        if href:
            pages.append({"url": href, "kind": "player_detail"})

    deduped: list[dict[str, str]] = []
    seen: set[str] = set()
    for page in pages:
        key = page["url"]
        if key in seen:
            continue
        seen.add(key)
        deduped.append(page)
    return deduped


def collect_payload_references(payload: dict[str, Any]) -> list[dict[str, str]]:
    refs: list[dict[str, str]] = []

    for item in payload.get("news", []):
        image_url = (item.get("image_url") or "").strip()
        href = (item.get("href") or "").strip()
        if image_url:
            refs.append(
                {
                    "url": image_url,
                    "source_page": href or payload.get("source", ""),
                    "source_kind": "payload_news",
                    "category": "news",
                    "alt": clean_text(item.get("title", "")),
                    "player_id": "",
                    "news_href": href,
                }
            )

    for item in payload.get("squad", []):
        href = (item.get("href") or "").strip()
        player_id = (item.get("player_id") or "").strip()
        image_url = (item.get("image_url") or "").strip()
        if image_url:
            refs.append(
                {
                    "url": image_url,
                    "source_page": href or payload.get("source", ""),
                    "source_kind": "payload_player",
                    "category": "players",
                    "alt": clean_text(item.get("name", "")),
                    "player_id": player_id,
                    "news_href": "",
                }
            )

        for honour in item.get("honours", []):
            honour_url = (honour.get("image_url") or "").strip()
            if honour_url:
                refs.append(
                    {
                        "url": honour_url,
                        "source_page": href or payload.get("source", ""),
                        "source_kind": "payload_honour",
                        "category": "honours",
                        "alt": clean_text(honour.get("title", "")),
                        "player_id": player_id,
                        "news_href": "",
                    }
                )

        for highlight in item.get("highlights", []):
            media_url = (highlight.get("media_url") or "").strip()
            if media_url:
                refs.append(
                    {
                        "url": media_url,
                        "source_page": href or payload.get("source", ""),
                        "source_kind": "payload_highlight",
                        "category": "highlights",
                        "alt": clean_text(highlight.get("title", "")),
                        "player_id": player_id,
                        "news_href": "",
                    }
                )

            for team_key in ("home_team", "away_team"):
                logo_url = ((highlight.get(team_key) or {}).get("logo_url") or "").strip()
                if logo_url:
                    refs.append(
                        {
                            "url": logo_url,
                            "source_page": href or payload.get("source", ""),
                            "source_kind": "payload_team_logo",
                            "category": "team",
                            "alt": clean_text(((highlight.get(team_key) or {}).get("name") or "")),
                            "player_id": "",
                            "news_href": "",
                        }
                    )

    return refs


def derive_context_text(img_tag) -> str:
    texts: list[str] = []
    for ancestor in img_tag.parents:
        if getattr(ancestor, "name", None) in {"section", "article", "div", "li"}:
            text = clean_text(ancestor.get_text(" ", strip=True))
            if text:
                texts.append(text[:240])
            if len(texts) >= 2:
                break
    return " ".join(texts)


def collect_image_references(base_url: str, page_url: str, source_kind: str, html: str) -> list[dict[str, str]]:
    soup = BeautifulSoup(html, "html.parser")
    refs: list[dict[str, str]] = []

    for img in soup.select("img[src]"):
        src = img.get("src")
        abs_url = to_abs(base_url, src)
        if not abs_url or abs_url.startswith("data:"):
            continue

        category = detect_category(
            abs_url,
            source_kind=source_kind,
            source_page=page_url,
            context_text=derive_context_text(img),
        )
        if category not in IMAGE_CATEGORIES:
            category = "site"

        refs.append(
            {
                "url": abs_url,
                "source_page": page_url,
                "source_kind": source_kind,
                "category": category,
                "alt": clean_text(img.get("alt", "")),
                "player_id": infer_player_id(abs_url, page_url),
                "news_href": page_url if source_kind == "news_detail" else "",
            }
        )

    return refs


def download_image_entry(
    session,
    repo_root: Path,
    raw_dir_rel: str,
    entry: dict[str, Any],
    *,
    retries: int,
    retry_delay: float,
    request_timeout: tuple[int, int],
) -> dict[str, Any]:
    raw_rel = entry.get("raw_path") or ""
    if raw_rel:
        existing_raw_path = repo_root / raw_rel
        if existing_raw_path.exists():
            with Image.open(existing_raw_path) as image:
                width, height = image.size
                fmt = image.format or existing_raw_path.suffix.lstrip(".").upper()
                is_animated = bool(getattr(image, "is_animated", False))

            entry["width"] = width
            entry["height"] = height
            entry["format"] = fmt
            entry["is_animated"] = is_animated
            entry["status"] = "downloaded"
            return entry

    error: Exception | None = None
    content: bytes | None = None
    for attempt in range(1, retries + 1):
        try:
            content = fetch_binary(
                session,
                entry["url"],
                referer=entry["source_pages"][0] if entry["source_pages"] else None,
                timeout=request_timeout,
            )
            break
        except Exception as exc:  # noqa: BLE001
            error = exc
            if attempt < retries:
                time.sleep(retry_delay * attempt)
    if content is None:
        raise RuntimeError(str(error) if error else "download failed")

    content_sha = sha256_bytes(content)
    original_name = safe_filename_from_url(entry["url"], fallback_stem=entry["category"])
    raw_dir = repo_root / raw_dir_rel / entry["category"]
    ensure_dir(raw_dir)
    raw_name = f"{content_sha[:12]}-{original_name}"
    raw_path = raw_dir / raw_name
    if not raw_path.exists():
        raw_path.write_bytes(content)

    with Image.open(raw_path) as image:
        width, height = image.size
        fmt = image.format or raw_path.suffix.lstrip(".").upper()
        is_animated = bool(getattr(image, "is_animated", False))

    entry["content_sha256"] = content_sha
    entry["raw_path"] = raw_path.relative_to(repo_root).as_posix()
    entry["width"] = width
    entry["height"] = height
    entry["format"] = fmt
    entry["is_animated"] = is_animated
    entry["status"] = "downloaded"
    return entry


def merge_reference(existing: dict[str, Any], ref: dict[str, str]) -> dict[str, Any]:
    if ref["source_page"] not in existing["source_pages"]:
        existing["source_pages"].append(ref["source_page"])
    if ref["source_kind"] not in existing["source_kinds"]:
        existing["source_kinds"].append(ref["source_kind"])
    if ref["alt"] and ref["alt"] not in existing["alts"]:
        existing["alts"].append(ref["alt"])
    if not existing["player_id"] and ref["player_id"]:
        existing["player_id"] = ref["player_id"]
    if not existing["news_href"] and ref["news_href"]:
        existing["news_href"] = ref["news_href"]
    return existing


def main() -> None:
    parser = argparse.ArgumentParser(description="Collect and classify cdrcfc images into a manifest.")
    parser.add_argument("--input", default=DEFAULT_INPUT, help="Crawler payload JSON relative to repo root.")
    parser.add_argument("--manifest", default=DEFAULT_MANIFEST, help="Image manifest JSON relative to repo root.")
    parser.add_argument("--raw-dir", default=DEFAULT_RAW_DIR, help="Raw image directory relative to repo root.")
    parser.add_argument("--max-pages", type=int, default=None, help="Limit fetched HTML pages for debugging.")
    parser.add_argument("--download-retries", type=int, default=3, help="Retries per image download.")
    parser.add_argument("--retry-delay", type=float, default=1.5, help="Base backoff seconds between image retries.")
    parser.add_argument("--skip-page-fetch", action="store_true", help="Skip live HTML discovery and only use payload/existing manifest.")
    parser.add_argument("--checkpoint-every", type=int, default=10, help="Write manifest progress after this many downloads.")
    parser.add_argument("--connect-timeout", type=int, default=8, help="Connect timeout seconds for HTTP fetches.")
    parser.add_argument("--read-timeout", type=int, default=10, help="Read timeout seconds for HTTP fetches.")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[3]
    ensure_env(repo_root)

    input_file = repo_root / args.input
    payload = read_json(input_file, {})
    base_url = (payload.get("source") or "https://www.cdrcfc.com.cn").rstrip("/")
    manifest_file = repo_root / args.manifest
    existing_manifest = read_json(manifest_file, {"version": 1, "generated_at": "", "entries": []})

    existing_by_url: dict[str, dict[str, Any]] = {
        entry["url"]: entry for entry in existing_manifest.get("entries", []) if entry.get("url")
    }

    session = build_session(retry_total=0)
    request_timeout = (max(1, args.connect_timeout), max(1, args.read_timeout))
    collected: "OrderedDict[str, dict[str, Any]]" = OrderedDict()

    for entry in existing_manifest.get("entries", []):
        url = entry.get("url")
        if not url:
            continue
        collected[url] = dict(entry)

    for ref in collect_payload_references(payload):
        collected[ref["url"]] = make_manifest_entry(ref, collected.get(ref["url"]) or existing_by_url.get(ref["url"]))

    candidate_pages = iter_candidate_pages(base_url, payload)
    if args.max_pages is not None:
        candidate_pages = candidate_pages[: args.max_pages]

    if not args.skip_page_fetch:
        for page in candidate_pages:
            url = page["url"]
            kind = page["kind"]
            try:
                print(f"[images] fetch page: {url}")
                html = fetch_html(session, url, referer=base_url, timeout=request_timeout)
                refs = collect_image_references(base_url, url, kind, html)
            except Exception as exc:  # noqa: BLE001
                print(f"[images] failed page: {url} -> {exc}")
                continue

            for ref in refs:
                collected[ref["url"]] = make_manifest_entry(ref, collected.get(ref["url"]) or existing_by_url.get(ref["url"]))

    entries = list(collected.values())
    save_manifest_snapshot(manifest_file, base_url=base_url, entries=entries)

    checkpoint_every = max(1, args.checkpoint_every)
    since_checkpoint = 0

    for index, entry in enumerate(entries, start=1):
        needs_download = True
        raw_rel = entry.get("raw_path") or ""
        if raw_rel and (repo_root / raw_rel).exists() and entry.get("width") and entry.get("height") and entry.get("format"):
            needs_download = False

        if needs_download:
            try:
                entry = download_image_entry(
                    session,
                    repo_root,
                    args.raw_dir,
                    entry,
                    retries=max(1, args.download_retries),
                    retry_delay=max(0.0, args.retry_delay),
                    request_timeout=request_timeout,
                )
            except Exception as exc:  # noqa: BLE001
                entry["status"] = f"download_failed: {exc}"
        elif not entry.get("status", "").startswith("downloaded"):
            entry["status"] = "downloaded"
        since_checkpoint += 1
        if since_checkpoint >= checkpoint_every or index == len(entries):
            save_manifest_snapshot(manifest_file, base_url=base_url, entries=entries)
            since_checkpoint = 0

    print(f"[images] manifest: {manifest_file}")
    print(f"[images] entries: {len(entries)}")


if __name__ == "__main__":
    main()
