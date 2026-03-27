import "server-only";

import { cache } from "react";
import { MatchStatus, NewsCategory, SquadType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const NEWS_PAGE_SIZE = 6;

export const getHomeStats = cache(async () => {
  const [matchCount, playerCount, newsCount] = await Promise.all([
    prisma.match.count(),
    prisma.player.count({ where: { squad: SquadType.FIRST_TEAM } }),
    prisma.newsPost.count(),
  ]);

  return {
    matchCount,
    playerCount,
    newsCount,
  };
});

export const getUpcomingMatches = cache(async (limit = 4) => {
  return prisma.match.findMany({
    where: { status: { in: [MatchStatus.UPCOMING, MatchStatus.LIVE] } },
    orderBy: { kickoffAt: "asc" },
    take: limit,
  });
});

export const getRecentResults = cache(async (limit = 4) => {
  return prisma.match.findMany({
    where: { status: MatchStatus.FINISHED },
    orderBy: { kickoffAt: "desc" },
    take: limit,
  });
});

export async function getMatches(options?: {
  status?: MatchStatus;
  page?: number;
  pageSize?: number;
}) {
  const pageSize = options?.pageSize ?? 12;
  const page = options?.page ?? 1;
  const where = options?.status ? { status: options.status } : {};

  const [total, items] = await Promise.all([
    prisma.match.count({ where }),
    prisma.match.findMany({
      where,
      orderBy: { kickoffAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items,
  };
}

export const getMatchBySlug = cache(async (slug: string) => {
  return prisma.match.findUnique({
    where: { slug },
  });
});

export const getTeamBySquad = cache(async (squad: SquadType) => {
  return prisma.player.findMany({
    where: { squad },
    orderBy: [{ jerseyNumber: "asc" }, { name: "asc" }],
  });
});

export const getFeaturedPlayers = cache(async (limit = 6) => {
  return prisma.player.findMany({
    where: { squad: SquadType.FIRST_TEAM },
    orderBy: [{ goals: "desc" }, { assists: "desc" }],
    take: limit,
  });
});

export const getPlayerBySlug = cache(async (slug: string) => {
  return prisma.player.findUnique({
    where: { slug },
    include: {
      moments: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
});

export async function getNewsPage(options?: {
  category?: NewsCategory;
  page?: number;
  pageSize?: number;
}) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? NEWS_PAGE_SIZE;
  const where = options?.category ? { category: options.category } : {};

  const [total, items] = await Promise.all([
    prisma.newsPost.count({ where }),
    prisma.newsPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items,
  };
}

export const getLatestNews = cache(async (limit = 3) => {
  return prisma.newsPost.findMany({
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
});

export const getNewsBySlug = cache(async (slug: string) => {
  return prisma.newsPost.findUnique({
    where: { slug },
  });
});

export const getTickets = cache(async () => {
  return prisma.ticketInfo.findMany({
    include: {
      match: true,
    },
    orderBy: { saleStartAt: "asc" },
  });
});

export const getProducts = cache(async () => {
  return prisma.product.findMany({
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
});

export const getProductBySlug = cache(async (slug: string) => {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
});

export const getClubHonors = cache(async () => {
  return prisma.clubHonor.findMany({
    orderBy: { year: "desc" },
  });
});
