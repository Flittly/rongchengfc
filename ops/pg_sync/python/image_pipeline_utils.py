from __future__ import annotations

import hashlib
import json
import mimetypes
import re
import shutil
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from PIL import Image, ImageEnhance, ImageOps, ImageSequence
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


DEFAULT_TIMEOUT = (12, 25)
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/135.0.0.0 Safari/537.36"
)

IMAGE_CATEGORIES = ("players", "news", "honours", "highlights", "team", "site")

CATEGORY_SPECS: dict[str, dict[str, Any]] = {
    "players": {"size": (1024, 1365), "mode": "cover", "format": "WEBP", "background": (14, 14, 14)},
    "news": {"size": (1600, 900), "mode": "cover", "format": "WEBP", "background": (18, 18, 18)},
    "honours": {"size": (1024, 1024), "mode": "contain", "format": "PNG", "background": (0, 0, 0, 0)},
    "highlights": {"size": (1280, 720), "mode": "cover", "format": "WEBP", "background": (12, 12, 12)},
    "team": {"size": (1024, 1024), "mode": "contain", "format": "PNG", "background": (0, 0, 0, 0)},
    "site": {"size": (1920, 1080), "mode": "cover", "format": "WEBP", "background": (20, 20, 20)},
}


def build_session(*, retry_total: int = 2, retry_read: int | None = None, retry_connect: int | None = None) -> requests.Session:
    retry = Retry(
        total=retry_total,
        read=retry_total if retry_read is None else retry_read,
        connect=retry_total if retry_connect is None else retry_connect,
        backoff_factor=0.8,
        status_forcelist=[429, 500, 502, 503, 504, 522, 524, 525],
        allowed_methods=frozenset({"GET"}),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        }
    )
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def fetch_html(
    session: requests.Session,
    url: str,
    referer: str | None = None,
    timeout: tuple[int, int] | None = None,
) -> str:
    headers: dict[str, str] = {}
    if referer:
        headers["Referer"] = referer

    response = session.get(url, timeout=timeout or DEFAULT_TIMEOUT, headers=headers)
    if response.status_code >= 400:
        raise RuntimeError(f"HTTP {response.status_code} for {url}")

    response.encoding = response.encoding or response.apparent_encoding or "utf-8"
    text = response.text
    if not text.strip():
        raise RuntimeError(f"Empty response body for {url}")
    return text


def fetch_binary(
    session: requests.Session,
    url: str,
    referer: str | None = None,
    timeout: tuple[int, int] | None = None,
) -> bytes:
    headers: dict[str, str] = {}
    if referer:
        headers["Referer"] = referer

    response = session.get(url, timeout=timeout or DEFAULT_TIMEOUT, headers=headers)
    if response.status_code >= 400:
        raise RuntimeError(f"HTTP {response.status_code} for {url}")
    if not response.content:
        raise RuntimeError(f"Empty response body for {url}")
    return response.content


def clean_text(text: str) -> str:
    return " ".join(text.split()).strip()


def to_abs(base_url: str, href: str | None) -> str:
    if not href:
        return ""
    return urljoin(base_url, href)


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "-", text)
    text = re.sub(r"-{2,}", "-", text).strip("-")
    return text or "item"


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def safe_filename_from_url(url: str, *, fallback_stem: str = "image") -> str:
    parsed = urlparse(url)
    basename = Path(parsed.path).name or fallback_stem
    stem = slugify(Path(basename).stem or fallback_stem)
    suffix = Path(basename).suffix.lower()
    if not suffix:
        suffix = mimetypes.guess_extension(mimetypes.guess_type(url)[0] or "") or ".bin"
    return f"{stem}{suffix}"


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    ensure_dir(path.parent)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def detect_category(url: str, *, source_kind: str, source_page: str, context_text: str = "") -> str:
    path = urlparse(url).path.lower()
    context = context_text.lower()
    page = source_page.lower()

    # Prefer asset-path hints over page-level hints so mixed pages do not classify
    # team logos and badges as player portraits.
    if "team_logo" in path or source_kind in {"payload_team_logo", "team_page"}:
        return "team"
    if "league_logo" in path or "honour" in path or "honour" in context:
        return "honours"
    if path.endswith(".gif") or "match_gif" in path or source_kind == "payload_highlight" or "highlight" in context:
        return "highlights"
    if "player_logo" in path or source_kind == "payload_player":
        return "players"
    if source_kind in {"payload_news", "news_page", "news_detail"} or "/article" in page or "/news" in page:
        return "news"
    return "site"

def infer_player_id(image_url: str, source_page: str) -> str:
    match = re.search(r"(?:player_id=|player_logo/|honor_)(\d+)", image_url)
    if match:
        return match.group(1)
    match = re.search(r"player_id=(\d+)", source_page)
    return match.group(1) if match else ""


def is_animated_image(path: Path) -> bool:
    with Image.open(path) as image:
        return getattr(image, "is_animated", False) or sum(1 for _ in ImageSequence.Iterator(image)) > 1


def choose_output_extension(image: Image.Image, category: str, *, force_lossless: bool = False) -> tuple[str, str]:
    if force_lossless or category in {"honours", "team"} or image.mode in {"RGBA", "LA"}:
        return ".png", "PNG"
    return ".webp", "WEBP"


def copy_file(src: Path, dst: Path) -> None:
    ensure_dir(dst.parent)
    shutil.copy2(src, dst)


def apply_basic_enhancements(image: Image.Image, *, category: str) -> Image.Image:
    has_alpha = "A" in image.getbands()
    alpha = image.getchannel("A") if has_alpha else None

    if image.mode not in {"RGB", "RGBA"}:
        image = image.convert("RGBA" if has_alpha else "RGB")

    working = image.convert("RGB") if has_alpha else image.convert("RGB")

    if category == "players":
        working = ImageOps.autocontrast(working)
        working = ImageEnhance.Sharpness(working).enhance(1.35)
        working = ImageEnhance.Contrast(working).enhance(1.08)
    elif category == "news":
        working = ImageOps.autocontrast(working)
        working = ImageEnhance.Sharpness(working).enhance(1.18)
        working = ImageEnhance.Color(working).enhance(1.03)
    else:
        working = ImageEnhance.Sharpness(working).enhance(1.08)

    if alpha is not None:
        working.putalpha(alpha)
        return working
    return working


def render_to_canvas(image: Image.Image, *, size: tuple[int, int], mode: str, background: Any) -> Image.Image:
    width, height = size
    has_alpha = "A" in image.getbands()
    target_mode = "RGBA" if has_alpha or (isinstance(background, tuple) and len(background) == 4) else "RGB"
    image = image.convert(target_mode)

    if mode == "cover":
        return ImageOps.fit(image, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.35))

    contained = ImageOps.contain(image, size, method=Image.Resampling.LANCZOS)
    canvas = Image.new(target_mode, size, background)
    offset = ((width - contained.width) // 2, (height - contained.height) // 2)
    canvas.paste(contained, offset, contained if contained.mode == "RGBA" else None)
    return canvas


