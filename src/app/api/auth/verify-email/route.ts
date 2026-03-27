import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${getBaseUrl()}/login?verified=invalid`);
  }

  const dbToken = await prisma.registrationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!dbToken || dbToken.expiresAt < new Date()) {
    if (dbToken) {
      await prisma.registrationToken.delete({ where: { id: dbToken.id } });
    }
    return NextResponse.redirect(`${getBaseUrl()}/login?verified=expired`);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: dbToken.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.registrationToken.delete({ where: { id: dbToken.id } }),
  ]);

  return NextResponse.redirect(`${getBaseUrl()}/login?verified=success`);
}
