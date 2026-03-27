import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://cdrfc.example.com";
  let matches: Array<{ slug: string; updatedAt: Date }> = [];
  let news: Array<{ slug: string; updatedAt: Date }> = [];
  let players: Array<{ slug: string; updatedAt: Date }> = [];
  let products: Array<{ slug: string; updatedAt: Date }> = [];

  try {
    [matches, news, players, products] = await Promise.all([
      prisma.match.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.newsPost.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.player.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
    ]);
  } catch {
    // Ignore database errors at build time and keep base sitemap entries.
  }

  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/matches`, lastModified: new Date() },
    { url: `${base}/team`, lastModified: new Date() },
    { url: `${base}/news`, lastModified: new Date() },
    { url: `${base}/tickets`, lastModified: new Date() },
    { url: `${base}/shop`, lastModified: new Date() },
    { url: `${base}/about`, lastModified: new Date() },
    ...matches.map((m) => ({
      url: `${base}/matches/${m.slug}`,
      lastModified: m.updatedAt,
    })),
    ...news.map((n) => ({
      url: `${base}/news/${n.slug}`,
      lastModified: n.updatedAt,
    })),
    ...players.map((p) => ({
      url: `${base}/team/players/${p.slug}`,
      lastModified: p.updatedAt,
    })),
    ...products.map((p) => ({
      url: `${base}/shop/${p.slug}`,
      lastModified: p.updatedAt,
    })),
  ];
}
