import { NewsCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { getNewsPage } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const categoryParam = searchParams.get("category");

  const category =
    categoryParam && categoryParam in NewsCategory
      ? (categoryParam as NewsCategory)
      : undefined;

  const data = await getNewsPage({
    page: Number.isNaN(page) ? 1 : page,
    category,
  });

  return NextResponse.json(data);
}
