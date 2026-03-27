import { NewsCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createNewsSchema = z.object({
  title: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  excerpt: z.string().trim().min(5),
  content: z.string().trim().min(20),
  coverImage: z.string().trim().min(1),
  category: z.nativeEnum(NewsCategory),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "无权限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createNewsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误" }, { status: 400 });
  }

  const news = await prisma.newsPost.create({
    data: {
      ...parsed.data,
      publishedAt: new Date(),
    },
  });

  return NextResponse.json({ news });
}
