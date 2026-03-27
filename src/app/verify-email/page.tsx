import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "邮箱验证",
  description: "完成成都蓉城账号邮箱验证。",
};

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage(props: VerifyEmailPageProps) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 pb-20 pt-14 lg:pt-20">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
        <h1 className="text-3xl font-semibold text-white">邮箱验证</h1>
        {token ? (
          <>
            <p className="mt-3 text-sm text-white/70">点击下方按钮完成邮箱验证，验证成功后会自动跳转登录页。</p>
            <Link
              href={`/api/auth/verify-email?token=${token}`}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[color:var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--color-primary-strong)]"
            >
              立即验证
            </Link>
          </>
        ) : (
          <p className="mt-3 text-sm text-yellow-100">未找到有效 token，请检查链接是否完整。</p>
        )}
      </div>
    </div>
  );
}
