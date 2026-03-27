import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.cdrcfc.com.cn";
const OUTPUT_DIR = path.resolve("data/scraped");

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CD-Rangers-Bot/1.0; +https://www.cdrcfc.com.cn)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}, status=${response.status}`);
  }

  return response.text();
}

function absoluteUrl(href) {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return new URL(href, BASE_URL).toString();
}

function collectNewsItems(html) {
  const $ = cheerio.load(html);
  const items = [];

  $(".news-list li, .news-item, .article-item").each((_, element) => {
    const node = $(element);
    const title =
      node.find("h3,h4,.title,a").first().text().trim() ||
      node.find("a").first().text().trim();
    const href = absoluteUrl(node.find("a").first().attr("href"));
    const date = node.find(".date,.time,time").first().text().trim();
    const summary = node.find("p,.desc,.summary").first().text().trim();
    if (title && href) {
      items.push({ title, href, date, summary });
    }
  });

  return items;
}

function collectSquadItems(html) {
  const $ = cheerio.load(html);
  const players = [];

  $(".player-item, .team-item, .lineup-item, li").each((_, element) => {
    const node = $(element);
    const name =
      node.find(".name,h3,h4,strong").first().text().trim() ||
      node.find("img").attr("alt") ||
      "";
    const numberText = node.find(".number,.num").first().text().trim();
    const numberMatch = numberText.match(/\d+/);
    const number = numberMatch ? Number(numberMatch[0]) : null;
    const position = node.find(".position,.pos").first().text().trim();
    const image = absoluteUrl(node.find("img").attr("src"));

    if (name) {
      players.push({
        name,
        number,
        position,
        image,
      });
    }
  });

  return players;
}

async function run() {
  const pages = {
    home: BASE_URL,
    news: `${BASE_URL}/news`,
    team: `${BASE_URL}/team`,
  };

  const result = {
    fetchedAt: new Date().toISOString(),
    source: BASE_URL,
    pages,
    news: [],
    squad: [],
  };

  for (const [key, url] of Object.entries(pages)) {
    try {
      const html = await fetchHtml(url);
      if (key === "news" || key === "home") {
        result.news.push(...collectNewsItems(html));
      }
      if (key === "team" || key === "home") {
        result.squad.push(...collectSquadItems(html));
      }
    } catch (error) {
      console.error(`[scrape] ${url} failed:`, error.message);
    }
  }

  const dedupNews = Array.from(
    new Map(result.news.map((item) => [item.href, item])).values(),
  );
  const dedupSquad = Array.from(
    new Map(result.squad.map((item) => [item.name, item])).values(),
  );

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const filename = `cdrcfc-${new Date().toISOString().slice(0, 10)}.json`;
  const outputPath = path.join(OUTPUT_DIR, filename);

  await fs.writeFile(
    outputPath,
    JSON.stringify(
      {
        ...result,
        news: dedupNews,
        squad: dedupSquad,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`[scrape] wrote ${outputPath}`);
  console.log(`[scrape] news items: ${dedupNews.length}`);
  console.log(`[scrape] squad items: ${dedupSquad.length}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
