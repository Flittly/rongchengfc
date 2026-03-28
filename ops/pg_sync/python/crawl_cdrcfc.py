from __future__ import annotations

import argparse
import json
import os
import re
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from bs4 import BeautifulSoup, Tag
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from db_utils import ensure_env


DEFAULT_BASE_URL = "https://www.cdrcfc.com.cn"
DEFAULT_OUTPUT = "data/scraped/cdrcfc-python.json"
DEFAULT_IMAGE_DIR = "data/scraped/player-images"
DEFAULT_TIMEOUT = (12, 25)
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/135.0.0.0 Safari/537.36"
)

NEWS_LABELS = {
    "新闻",
    "动态",
    "赛事",
    "战报",
    "俱乐部",
    "公告",
    "成都蓉城",
}

PERSONAL_INFO_LABELS = {
    "国籍": "nationality",
    "出生日期": "birth_date",
    "年龄": "age",
    "身高": "height",
    "当前俱乐部": "current_club",
    "惯用脚": "preferred_foot",
    "球衣号码": "jersey_number",
}

SUMMARY_LABELS = {
    "总出场": "total_appearances",
    "总首发": "total_starts",
    "总进球": "total_goals",
    "总助攻": "total_assists",
    "平均评分": "average_rating",
}

STATS_HEADER_LABELS = {
    "赛季": "season",
    "年份": "year",
    "联赛": "competition",
    "杯赛": "competition",
    "赛事": "competition",
    "俱乐部": "club",
    "国家队": "national_team",
    "出场": "appearances",
    "首发": "starts",
    "替补": "substitute_appearances",
    "进球": "goals",
    "助攻": "assists",
    "黄牌": "yellow_cards",
    "红牌": "red_cards",
    "评分": "rating",
}


@dataclass
class NewsItem:
    title: str
    href: str
    date_text: str
    summary: str


@dataclass
class SquadItem:
    player_id: str
    name: str
    href: str
    number: int | None
    position: str
    image_url: str
    image_local_path: str = ""
    nationality: str = ""
    birth_date: str = ""
    age: str = ""
    height: str = ""
    current_club: str = ""
    preferred_foot: str = ""
    jersey_number: str = ""
    description: str = ""
    personal_info: dict[str, str] = field(default_factory=dict)
    career_summary: dict[str, str] = field(default_factory=dict)
    abilities: dict[str, str] = field(default_factory=dict)
    club_stats: list[dict[str, str]] = field(default_factory=list)
    cup_stats: list[dict[str, str]] = field(default_factory=list)
    international_stats: list[dict[str, str]] = field(default_factory=list)
    honours: list[dict[str, str]] = field(default_factory=list)
    highlights: list[dict[str, Any]] = field(default_factory=list)
    detail_error: str = ""


def build_session() -> requests.Session:
    retry = Retry(
        total=2,
        read=2,
        connect=2,
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


def fetch_html(session: requests.Session, url: str, referer: str | None = None) -> str:
    headers: dict[str, str] = {}
    if referer:
        headers["Referer"] = referer

    response = session.get(url, timeout=DEFAULT_TIMEOUT, headers=headers)
    if response.status_code >= 400:
        raise RuntimeError(f"HTTP {response.status_code} for {url}")

    response.encoding = response.encoding or response.apparent_encoding or "utf-8"
    text = response.text
    if not text.strip():
        raise RuntimeError(f"Empty response body for {url}")
    return text


def fetch_binary(session: requests.Session, url: str, referer: str | None = None) -> bytes:
    headers: dict[str, str] = {}
    if referer:
        headers["Referer"] = referer

    response = session.get(url, timeout=DEFAULT_TIMEOUT, headers=headers)
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


def normalize_label(raw: str) -> str:
    return clean_text(raw).rstrip(":：")


def normalize_stats_header(raw: str) -> str:
    label = normalize_label(raw)
    return STATS_HEADER_LABELS.get(label, slugify(label).replace("-", "_"))


def extract_player_id(href: str) -> str:
    parsed = urlparse(href)
    player_ids = parse_qs(parsed.query).get("player_id", [])
    return player_ids[0] if player_ids else ""


def parse_news(base_url: str, html: str) -> list[NewsItem]:
    soup = BeautifulSoup(html, "html.parser")
    items: list[NewsItem] = []

    selectors = [
        ".news-list li",
        ".article-list li",
        ".news-item",
        ".article-item",
        "li",
    ]
    nodes: list[Tag] = []
    for selector in selectors:
        nodes = soup.select(selector)
        if nodes:
            break

    for node in nodes:
        title_el = node.select_one("h3,h4,.title,a")
        link_el = node.select_one("a[href]")
        if not title_el or not link_el:
            continue

        title = clean_text(title_el.get_text())
        href = to_abs(base_url, link_el.get("href"))
        if not title or not href:
            continue

        if not any(label in title for label in NEWS_LABELS):
            continue

        summary_el = node.select_one("p,.summary,.desc")
        date_el = node.select_one("time,.date,.time")
        summary = clean_text(summary_el.get_text()) if summary_el else ""
        date_text = clean_text(date_el.get_text()) if date_el else ""

        items.append(NewsItem(title=title, href=href, date_text=date_text, summary=summary))
    return items


def parse_player_cards(base_url: str, html: str) -> list[SquadItem]:
    soup = BeautifulSoup(html, "html.parser")
    players: list[SquadItem] = []

    for node in soup.select(".team-item"):
        detail_link = node.select_one(".team-content a[href*='/player-detail']")
        if not detail_link:
            continue

        href = to_abs(base_url, detail_link.get("href"))
        player_id = extract_player_id(href)
        if not player_id:
            continue

        name = clean_text((detail_link.select_one("h3") or detail_link).get_text())
        if not name:
            continue

        number_text = clean_text((node.select_one(".team-content span") or node).get_text())
        digits = "".join(ch for ch in number_text if ch.isdigit())
        number = int(digits) if digits else None

        position_el = node.select_one(".team-content p")
        position = clean_text(position_el.get_text()) if position_el else ""

        image_el = node.select_one(".team-image img")
        image_url = to_abs(base_url, image_el.get("src") if image_el else None)

        players.append(
            SquadItem(
                player_id=player_id,
                name=name,
                href=href,
                number=number,
                position=position,
                image_url=image_url,
            )
        )

    return players


def parse_personal_info(node: Tag | None) -> dict[str, str]:
    info: dict[str, str] = {}
    if node is None:
        return info

    for item in node.select("li"):
        label_el = item.select_one("h6")
        value_el = item.select_one("span")
        if not label_el or not value_el:
            continue
        label = normalize_label(label_el.get_text())
        value = clean_text(value_el.get_text())
        if not label or not value:
            continue
        info[PERSONAL_INFO_LABELS.get(label, slugify(label).replace("-", "_"))] = value

    return info


def parse_summary_cards(section: Tag | None) -> dict[str, str]:
    summary: dict[str, str] = {}
    if section is None:
        return summary

    heading = section.find("h5", string=lambda text: bool(text and "生涯数据摘要" in text))
    if heading is None:
        return summary

    grid = heading.find_next_sibling("div")
    if grid is None:
        return summary

    for card in grid.find_all("div", recursive=False):
        texts = [clean_text(text) for text in card.stripped_strings]
        if len(texts) < 2:
            continue
        value = texts[-2] if len(texts) >= 3 else texts[0]
        label = texts[-1]
        summary[SUMMARY_LABELS.get(label, slugify(label).replace("-", "_"))] = value

    return summary


def parse_abilities(node: Tag | None) -> dict[str, str]:
    abilities: dict[str, str] = {}
    if node is None:
        return abilities

    for item in node.select(".ability-item"):
        spans = item.select("span")
        if len(spans) < 2:
            continue
        label = clean_text(spans[0].get_text())
        value = clean_text(spans[1].get_text())
        if label and value:
            abilities[slugify(label).replace("-", "_")] = value

    return abilities


def parse_stats_section(section: Tag | None) -> list[dict[str, str]]:
    if section is None:
        return []

    title = section.select(".career-title h3")
    headers = [normalize_stats_header(node.get_text()) for node in title]
    if not headers:
        return []

    rows: list[dict[str, str]] = []
    for row in section.select(".stats-content .career-stat-item"):
        values = [clean_text(cell.get_text()) for cell in row.select(".box")]
        if len(values) != len(headers):
            continue
        rows.append(dict(zip(headers, values, strict=False)))

    return rows


def parse_honours(base_url: str, node: Tag | None) -> list[dict[str, str]]:
    honours: list[dict[str, str]] = []
    if node is None:
        return honours

    for honour in node.select(".team-honour"):
        image_el = honour.select_one("img")
        honours.append(
            {
                "season": clean_text((honour.select_one(".honour-season") or honour).get_text()),
                "title": clean_text((honour.select_one(".honour-title") or honour).get_text()),
                "type": clean_text((honour.select_one(".honour-type") or honour).get_text()),
                "image_url": to_abs(base_url, image_el.get("src") if image_el else None),
                "image_alt": clean_text(image_el.get("alt", "")) if image_el else "",
            }
        )

    return honours


def parse_highlight_team(node: Tag | None) -> dict[str, str]:
    if node is None:
        return {}

    texts = [clean_text(text) for text in node.stripped_strings if clean_text(text)]
    name = ""
    score = ""
    for text in texts:
        if re.fullmatch(r"\d+", text):
            score = text
        elif not name:
            name = text

    image_el = node.select_one("img")
    return {
        "name": name,
        "score": score,
        "logo_url": image_el.get("src", "") if image_el else "",
    }


def parse_highlights(base_url: str, node: Tag | None) -> list[dict[str, Any]]:
    highlights: list[dict[str, Any]] = []
    if node is None:
        return highlights

    for item in node.select(".highlight-item"):
        media_el = item.select_one(".highlight-media img")
        title_link = item.select_one(".highlight-title a[href]")
        teams = item.select(".match-info .team")
        league_date = [clean_text(text) for text in item.select_one(".league-date").stripped_strings] if item.select_one(".league-date") else []

        highlights.append(
            {
                "event_type": clean_text((item.select_one(".event-type-tag") or item).get_text()),
                "event_time": clean_text((item.select_one(".event-time") or item).get_text()),
                "title": clean_text((item.select_one(".highlight-title") or item).get_text()),
                "match_url": to_abs(base_url, title_link.get("href") if title_link else None),
                "media_url": to_abs(base_url, media_el.get("src") if media_el else None),
                "league": league_date[0] if len(league_date) >= 1 else "",
                "date": league_date[1] if len(league_date) >= 2 else "",
                "home_team": {
                    **parse_highlight_team(teams[0] if len(teams) >= 1 else None),
                    "logo_url": to_abs(
                        base_url,
                        parse_highlight_team(teams[0] if len(teams) >= 1 else None).get("logo_url"),
                    ),
                },
                "away_team": {
                    **parse_highlight_team(teams[1] if len(teams) >= 2 else None),
                    "logo_url": to_abs(
                        base_url,
                        parse_highlight_team(teams[1] if len(teams) >= 2 else None).get("logo_url"),
                    ),
                },
            }
        )

    return highlights


def parse_player_detail(base_url: str, html: str, player: SquadItem) -> SquadItem:
    soup = BeautifulSoup(html, "html.parser")
    root = soup.select_one(".team-single")
    if root is None:
        raise RuntimeError("Player detail layout not found")

    image_el = root.select_one(".team-intro .image img")
    if image_el and image_el.get("src"):
        player.image_url = to_abs(base_url, image_el.get("src"))

    name_el = root.select_one(".team-intro .information h3")
    if name_el:
        player.name = clean_text(name_el.get_text()) or player.name

    position_el = root.select_one(".team-intro .information h5")
    if position_el:
        player.position = clean_text(position_el.get_text()) or player.position

    about_el = root.select_one(".team-about .text")
    if about_el:
        player.description = clean_text(about_el.get_text())

    personal_info = parse_personal_info(root.select_one(".team-personal-info"))
    player.personal_info = personal_info
    player.nationality = personal_info.get("nationality", "")
    player.birth_date = personal_info.get("birth_date", "")
    player.age = personal_info.get("age", "")
    player.height = personal_info.get("height", "")
    player.current_club = personal_info.get("current_club", "")
    player.preferred_foot = personal_info.get("preferred_foot", "")
    player.jersey_number = personal_info.get("jersey_number", "")
    if player.jersey_number and player.number is None and player.jersey_number.isdigit():
        player.number = int(player.jersey_number)

    player.career_summary = parse_summary_cards(root.select_one(".team-intro .information"))
    player.abilities = parse_abilities(root.select_one(".player-features"))
    player.club_stats = parse_stats_section(root.select_one(".club-stats"))
    player.cup_stats = parse_stats_section(root.select_one(".cup-stats"))
    player.international_stats = parse_stats_section(root.select_one(".international-stats"))
    player.honours = parse_honours(base_url, root.select_one(".team-member-honours"))
    player.highlights = parse_highlights(base_url, root.select_one(".player-highlights"))

    return player


def dedupe_news(items: list[NewsItem]) -> list[NewsItem]:
    seen: set[str] = set()
    out: list[NewsItem] = []
    for item in items:
        key = item.href or item.title
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def dedupe_squad(items: list[SquadItem]) -> list[SquadItem]:
    seen: set[str] = set()
    out: list[SquadItem] = []
    for item in items:
        key = item.player_id or f"{item.name}|{item.href}"
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def guess_extension(image_url: str) -> str:
    path = urlparse(image_url).path
    suffix = Path(path).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        return suffix
    return ".jpg"


def download_player_image(
    session: requests.Session,
    repo_root: Path,
    base_url: str,
    player: SquadItem,
    output_dir_rel: str,
) -> str:
    if not player.image_url:
        return ""

    output_dir = repo_root / output_dir_rel
    output_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{player.player_id or slugify(player.name)}{guess_extension(player.image_url)}"
    output_file = output_dir / filename
    if not output_file.exists():
        content = fetch_binary(session, player.image_url, referer=player.href or f"{base_url}/Players")
        output_file.write_bytes(content)

    return output_file.relative_to(repo_root).as_posix()


def crawl_news_pages(session: requests.Session, base_url: str, errors: dict[str, str]) -> list[NewsItem]:
    news_items: list[NewsItem] = []
    for url in [f"{base_url}/", f"{base_url}/news"]:
        try:
            print(f"[crawl] fetch news: {url}")
            html = fetch_html(session, url, referer=base_url)
            news_items.extend(parse_news(base_url, html))
        except Exception as exc:  # noqa: BLE001
            errors[url] = str(exc)
            print(f"[crawl] failed: {url} -> {exc}")
    return dedupe_news(news_items)


def crawl_players(
    session: requests.Session,
    repo_root: Path,
    base_url: str,
    image_dir_rel: str,
    skip_images: bool,
    errors: dict[str, str],
    max_players: int | None = None,
    progress_callback: Callable[[list[SquadItem], dict[str, str]], None] | None = None,
) -> list[SquadItem]:
    players_url = f"{base_url}/Players"
    print(f"[crawl] fetch players: {players_url}")
    html = fetch_html(session, players_url, referer=base_url)
    players = dedupe_squad(parse_player_cards(base_url, html))
    if max_players is not None:
        players = players[:max_players]
    print(f"[crawl] player cards found: {len(players)}")

    for index, player in enumerate(players, start=1):
        try:
            print(f"[crawl] detail {index}/{len(players)}: {player.name} ({player.player_id})")
            if not skip_images and player.image_url:
                player.image_local_path = download_player_image(
                    session=session,
                    repo_root=repo_root,
                    base_url=base_url,
                    player=player,
                    output_dir_rel=image_dir_rel,
                )
            detail_html = fetch_html(session, player.href, referer=players_url)
            parse_player_detail(base_url, detail_html, player)
            if not skip_images and not player.image_local_path:
                player.image_local_path = download_player_image(
                    session=session,
                    repo_root=repo_root,
                    base_url=base_url,
                    player=player,
                    output_dir_rel=image_dir_rel,
                )
        except Exception as exc:  # noqa: BLE001
            player.detail_error = str(exc)
            errors[player.href] = str(exc)
            print(f"[crawl] detail failed: {player.href} -> {exc}")
        if progress_callback is not None:
            progress_callback(players, errors)
        time.sleep(0.3)

    return players


def write_payload(
    output_file: Path,
    *,
    base_url: str,
    image_dir_rel: str,
    skip_images: bool,
    news_items: list[NewsItem],
    squad_items: list[SquadItem],
    errors: dict[str, str],
) -> None:
    payload = {
        "source": base_url,
        "crawled_at": datetime.now(timezone.utc).isoformat(),
        "player_image_dir": "" if skip_images else image_dir_rel,
        "news": [asdict(item) for item in news_items],
        "squad": [asdict(item) for item in squad_items],
        "errors": errors,
    }

    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Crawl CDRCFC news and complete player profiles.")
    parser.add_argument("--skip-images", action="store_true", help="Skip downloading player images.")
    parser.add_argument("--max-players", type=int, default=None, help="Limit the number of players to crawl.")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[3]
    ensure_env(repo_root)

    base_url = os.environ.get("CDRCFC_BASE_URL", DEFAULT_BASE_URL).rstrip("/")
    output_rel = os.environ.get("CDRCFC_OUTPUT", DEFAULT_OUTPUT)
    image_dir_rel = os.environ.get("CDRCFC_PLAYER_IMAGE_DIR", DEFAULT_IMAGE_DIR)
    output_file = repo_root / output_rel

    session = build_session()
    page_errors: dict[str, str] = {}

    news_items = crawl_news_pages(session, base_url, page_errors)
    write_payload(
        output_file,
        base_url=base_url,
        image_dir_rel=image_dir_rel,
        skip_images=args.skip_images,
        news_items=news_items,
        squad_items=[],
        errors=page_errors,
    )
    squad_items = crawl_players(
        session=session,
        repo_root=repo_root,
        base_url=base_url,
        image_dir_rel=image_dir_rel,
        skip_images=args.skip_images,
        errors=page_errors,
        max_players=args.max_players,
        progress_callback=lambda items, errors: write_payload(
            output_file,
            base_url=base_url,
            image_dir_rel=image_dir_rel,
            skip_images=args.skip_images,
            news_items=news_items,
            squad_items=items,
            errors=errors,
        ),
    )
    write_payload(
        output_file,
        base_url=base_url,
        image_dir_rel=image_dir_rel,
        skip_images=args.skip_images,
        news_items=news_items,
        squad_items=squad_items,
        errors=page_errors,
    )

    print(f"[crawl] output: {output_file}")
    print(f"[crawl] news items: {len(news_items)}")
    print(f"[crawl] squad items: {len(squad_items)}")
    if not args.skip_images:
        print(f"[crawl] player images: {repo_root / image_dir_rel}")


if __name__ == "__main__":
    main()
