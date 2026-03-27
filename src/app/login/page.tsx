import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/app/login/login-form";

export const metadata: Metadata = {
  title: "登录",
  description: "使用邮箱和密码登录成都蓉城球迷账号。",
};

interface LoginPageProps {
  searchParams: Promise<{
    verified?: "success" | "expired" | "invalid";
  }>;
}

export default async function LoginPage(props: LoginPageProps) {
  const searchParams = await props.searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 pb-20 pt-14 lg:pt-20">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
        <h1 className="text-3xl font-semibold text-white">账号登录</h1>
        <p className="mt-3 text-sm text-white/70">登录后可以收藏内容、设置偏好并访问个人中心。</p>

        {searchParams.verified === "success" ? (
          <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            邮箱验证成功，请登录。
          </p>
        ) : null}
        {searchParams.verified === "expired" ? (
          <p className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">
            验证链接已过期，请重新注册或联系管理员。
          </p>
        ) : null}
        {searchParams.verified === "invalid" ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            验证链接无效。
          </p>
        ) : null}

        <div className="mt-6">
          <LoginForm />
        </div>

        <p className="mt-5 text-sm text-white/65">
          还没有账号？
          <Link href="/register" className="ml-2 text-[color:var(--color-accent)] hover:underline">
            去注册
          </Link>
        </p>
      </div>
    </div>
  );
}
