import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/tokens";
import { getBaseUrl } from "@/lib/url";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "参数校验失败", errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data;
  const exists = await prisma.user.findUnique({
    where: { email },
  });

  if (exists?.emailVerified) {
    return NextResponse.json({ message: "该邮箱已注册" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user =
    exists ??
    (await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    }));

  if (exists && !exists.emailVerified) {
    await prisma.user.update({
      where: { id: exists.id },
      data: { passwordHash, name },
    });
  }

  await prisma.registrationToken.deleteMany({ where: { userId: user.id } });
  const token = createVerificationToken();
  await prisma.registrationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  const verifyUrl = `${getBaseUrl()}/verify-email?token=${token}`;
  console.log(`Email verification link for ${email}: ${verifyUrl}`);

  return NextResponse.json({
    message: "注册成功，请完成邮箱验证后登录。",
    verifyUrl: process.env.NODE_ENV === "development" ? verifyUrl : undefined,
  });
}
