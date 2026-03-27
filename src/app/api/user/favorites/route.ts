import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { favoriteSchema } from "@/lib/validation";

async function getUserOr401() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user.id;
}

export async function GET() {
  const userId = await getUserOr401();
  if (!userId) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const [news, matches, products] = await Promise.all([
    prisma.favoriteNews.findMany({
      where: { userId },
      include: { news: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favoriteMatch.findMany({
      where: { userId },
      include: { match: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favoriteProduct.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    news: news.map((x) => x.news),
    matches: matches.map((x) => x.match),
    products: products.map((x) => x.product),
  });
}

export async function POST(request: Request) {
  const userId = await getUserOr401();
  if (!userId) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = favoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误" }, { status: 400 });
  }

  const { entityType, entityId } = parsed.data;

  if (entityType === "news") {
    await prisma.favoriteNews.upsert({
      where: { userId_newsId: { userId, newsId: entityId } },
      update: {},
      create: { userId, newsId: entityId },
    });
  }

  if (entityType === "match") {
    await prisma.favoriteMatch.upsert({
      where: { userId_matchId: { userId, matchId: entityId } },
      update: {},
      create: { userId, matchId: entityId },
    });
  }

  if (entityType === "product") {
    await prisma.favoriteProduct.upsert({
      where: { userId_productId: { userId, productId: entityId } },
      update: {},
      create: { userId, productId: entityId },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const userId = await getUserOr401();
  if (!userId) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = favoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误" }, { status: 400 });
  }

  const { entityType, entityId } = parsed.data;

  if (entityType === "news") {
    await prisma.favoriteNews.deleteMany({
      where: { userId, newsId: entityId },
    });
  }
  if (entityType === "match") {
    await prisma.favoriteMatch.deleteMany({
      where: { userId, matchId: entityId },
    });
  }
  if (entityType === "product") {
    await prisma.favoriteProduct.deleteMany({
      where: { userId, productId: entityId },
    });
  }

  return NextResponse.json({ success: true });
}
