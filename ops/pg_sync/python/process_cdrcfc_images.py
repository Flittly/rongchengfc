from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path
from typing import Any

from PIL import Image

from db_utils import ensure_env
from image_pipeline_utils import (
    CATEGORY_SPECS,
    apply_basic_enhancements,
    choose_output_extension,
    copy_file,
    is_animated_image,
    read_json,
    render_to_canvas,
    to_abs,
    write_json,
)


DEFAULT_INPUT = "data/scraped/cdrcfc-python.json"
DEFAULT_MANIFEST = "data/scraped/image-manifest.json"
DEFAULT_PROCESSED_DIR = "data/processed-images"
DEFAULT_PUBLIC_DIR = "public/images/cdrcfc"


def build_ai_wrapper_command(repo_root: Path, profile: str) -> str:
    script_path = repo_root / "ops/pg_sync/python/ai_enhance_image.py"
    return f'"{sys.executable}" "{script_path}" --profile {profile} --input "{{input}}" --output "{{output}}"'


def run_enhancer(command_template: str | None, input_path: Path, output_path: Path) -> Path:
    if not command_template:
        return input_path

    rendered = command_template.format(input=str(input_path), output=str(output_path))
    subprocess.run(rendered, shell=True, check=True)
    return output_path if output_path.exists() else input_path


def process_still_image(
    raw_path: Path,
    *,
    category: str,
    enhancer_cmd: str | None,
    processed_path: Path,
) -> tuple[Path, str, tuple[int, int]]:
    spec = CATEGORY_SPECS[category]

    source_path = raw_path
    staged_paths: list[Path] = []
    if enhancer_cmd:
        work_root = processed_path.parent / ".work"
        work_root.mkdir(parents=True, exist_ok=True)
        staged_input = work_root / f"{processed_path.stem}-input{raw_path.suffix.lower()}"
        staged_output = work_root / f"{processed_path.stem}-enhanced{raw_path.suffix.lower()}"
        copy_file(raw_path, staged_input)
        staged_paths.extend([staged_input, staged_output])
        source_path = run_enhancer(enhancer_cmd, staged_input, staged_output)

    try:
        with Image.open(source_path) as image:
            enhanced = apply_basic_enhancements(image, category=category)
            rendered = render_to_canvas(
                enhanced,
                size=spec["size"],
                mode=spec["mode"],
                background=spec["background"],
            )

            extension, fmt = choose_output_extension(
                rendered,
                category,
                force_lossless=spec["format"] == "PNG",
            )
            output = processed_path.with_suffix(extension)
            output.parent.mkdir(parents=True, exist_ok=True)
            if fmt == "WEBP":
                rendered.save(output, fmt, quality=90, method=6)
            else:
                rendered.save(output, fmt, optimize=True)
            return output, fmt, rendered.size
    finally:
        for staged_path in staged_paths:
            if staged_path.exists():
                staged_path.unlink()


def select_enhancer(category: str, player_cmd: str | None, generic_cmd: str | None) -> str | None:
    if category == "players":
        return player_cmd or generic_cmd
    if category in {"news", "honours", "team", "site"}:
        return generic_cmd
    return None


def is_player_portrait_entry(entry: dict[str, Any]) -> bool:
    url = (entry.get("url") or "").lower()
    source_kinds = {str(kind).strip() for kind in entry.get("source_kinds") or []}
    return "player_logo" in url or "payload_player" in source_kinds


def update_payload_with_manifest(payload: dict[str, Any], entries: list[dict[str, Any]], public_base: str) -> dict[str, Any]:
    player_entries_by_id: dict[str, list[dict[str, Any]]] = {}
    entry_by_url: dict[str, dict[str, Any]] = {}

    for entry in entries:
        entry_by_url[entry["url"]] = entry
        if (
            entry.get("category") == "players"
            and entry.get("player_id")
            and entry.get("public_path")
            and is_player_portrait_entry(entry)
        ):
            player_entries_by_id.setdefault(entry["player_id"], []).append(entry)

    for item in payload.get("squad", []):
        player_id = (item.get("player_id") or "").strip()
        image_url = (item.get("image_url") or "").strip()
        entry = entry_by_url.get(image_url)
        if not (entry and entry.get("public_path") and is_player_portrait_entry(entry)):
            candidates = player_entries_by_id.get(player_id, [])
            entry = candidates[0] if candidates else None
        if entry and entry.get("public_path"):
            item["processed_image_public_url"] = to_abs(public_base, entry["public_path"])
            item["processed_image_path"] = entry.get("processed_path") or entry["public_path"]

        for honour in item.get("honours", []):
            honour_entry = entry_by_url.get((honour.get("image_url") or "").strip())
            if honour_entry and honour_entry.get("public_path"):
                honour["processed_image_public_url"] = to_abs(public_base, honour_entry["public_path"])
                honour["processed_image_path"] = honour_entry.get("processed_path") or honour_entry["public_path"]

        for highlight in item.get("highlights", []):
            media_entry = entry_by_url.get((highlight.get("media_url") or "").strip())
            if media_entry and media_entry.get("public_path"):
                highlight["processed_media_public_url"] = to_abs(public_base, media_entry["public_path"])
                highlight["processed_media_path"] = media_entry.get("processed_path") or media_entry["public_path"]

    for item in payload.get("news", []):
        matching = [
            entry
            for entry in entries
            if entry.get("news_href") == (item.get("href") or "").strip()
            and entry.get("category") == "news"
            and entry.get("public_path")
        ]
        if matching:
            entry = matching[0]
            item["image_url"] = entry["url"]
            item["processed_image_public_url"] = to_abs(public_base, entry["public_path"])
            item["processed_image_path"] = entry.get("processed_path") or entry["public_path"]

    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize and optionally enhance cdrcfc images.")
    parser.add_argument("--input", default=DEFAULT_INPUT, help="Crawler payload JSON relative to repo root.")
    parser.add_argument("--manifest", default=DEFAULT_MANIFEST, help="Image manifest JSON relative to repo root.")
    parser.add_argument("--processed-dir", default=DEFAULT_PROCESSED_DIR, help="Processed image dir relative to repo root.")
    parser.add_argument("--public-dir", default=DEFAULT_PUBLIC_DIR, help="Public output dir relative to repo root.")
    parser.add_argument("--categories", nargs="*", default=None, help="Limit categories to process.")
    parser.add_argument(
        "--player-enhancer-cmd",
        default=os.environ.get("GFPGAN_CMD") or os.environ.get("CDRCFC_PLAYER_ENHANCER_CMD"),
        help="Optional shell command template for player enhancement; use {input} and {output}.",
    )
    parser.add_argument(
        "--generic-enhancer-cmd",
        default=os.environ.get("REALESRGAN_CMD") or os.environ.get("CDRCFC_IMAGE_ENHANCER_CMD"),
        help="Optional shell command template for generic enhancement; use {input} and {output}.",
    )
    parser.add_argument(
        "--use-ai-wrapper",
        action="store_true",
        help="Use the built-in AI wrapper that calls local GFPGAN / Real-ESRGAN scripts via environment variables.",
    )
    parser.add_argument("--max-images", type=int, default=None, help="Limit processed images for debugging.")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[3]
    ensure_env(repo_root)

    use_ai_wrapper = args.use_ai_wrapper or os.environ.get("CDRCFC_USE_AI_WRAPPER", "").strip().lower() in {"1", "true", "yes"}
    if use_ai_wrapper:
        if not args.player_enhancer_cmd:
            args.player_enhancer_cmd = build_ai_wrapper_command(repo_root, "player")
        if not args.generic_enhancer_cmd:
            args.generic_enhancer_cmd = build_ai_wrapper_command(repo_root, "generic")

    manifest_path = repo_root / args.manifest
    input_path = repo_root / args.input
    processed_root = repo_root / args.processed_dir
    public_root = repo_root / args.public_dir

    manifest = read_json(manifest_path, {"entries": []})
    entries = manifest.get("entries", [])
    payload = read_json(input_path, {})

    categories = set(args.categories or CATEGORY_SPECS.keys())
    processed_count = 0

    for entry in entries:
        category = entry.get("category") or "site"
        if category not in categories:
            continue
        if args.max_images is not None and processed_count >= args.max_images:
            break

        raw_rel = entry.get("raw_path")
        if not raw_rel:
            continue
        raw_path = repo_root / raw_rel
        if not raw_path.exists():
            entry["status"] = "missing_raw"
            continue

        public_stem = Path(raw_rel).stem
        processed_stub = processed_root / category / public_stem
        public_stub = public_root / category / public_stem

        try:
            if is_animated_image(raw_path):
                processed_path = processed_stub.with_suffix(raw_path.suffix.lower())
                public_path = public_stub.with_suffix(raw_path.suffix.lower())
                copy_file(raw_path, processed_path)
                copy_file(raw_path, public_path)
                final_path = processed_path
                output_fmt = raw_path.suffix.lstrip(".").upper()
                size = (entry.get("width") or 0, entry.get("height") or 0)
                processor = "copied-animated"
            else:
                enhancer_cmd = select_enhancer(category, args.player_enhancer_cmd, args.generic_enhancer_cmd)
                final_path, output_fmt, size = process_still_image(
                    raw_path,
                    category=category,
                    enhancer_cmd=enhancer_cmd,
                    processed_path=processed_stub,
                )
                public_path = public_stub.with_suffix(final_path.suffix)
                copy_file(final_path, public_path)
                processor = "basic+ai" if enhancer_cmd else "basic"

            entry["processed_path"] = final_path.relative_to(repo_root).as_posix()
            entry["public_path"] = public_path.relative_to(repo_root).as_posix().replace("public/", "/", 1)
            entry["processed_format"] = output_fmt
            entry["processed_width"] = size[0]
            entry["processed_height"] = size[1]
            entry["processor"] = processor
            entry["status"] = "processed"
            processed_count += 1
        except Exception as exc:  # noqa: BLE001
            entry["status"] = f"process_failed: {exc}"

    manifest["entries"] = entries
    write_json(manifest_path, manifest)

    payload = update_payload_with_manifest(payload, entries, public_base="")
    write_json(input_path, payload)

    print(f"[images] processed: {processed_count}")
    print(f"[images] manifest updated: {manifest_path}")
    print(f"[images] payload updated: {input_path}")


if __name__ == "__main__":
    main()
