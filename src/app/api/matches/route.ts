import { MatchStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getMatches } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const statusParam = searchParams.get("status");

  const status =
    statusParam && statusParam in MatchStatus
      ? (statusParam as MatchStatus)
      : undefined;

  const data = await getMatches({
    page: Number.isNaN(page) ? 1 : page,
    status,
  });

  return NextResponse.json(data);
}
