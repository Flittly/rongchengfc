import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/layout/sign-out-button";

const navItems = [
  { href: "/matches", label: "赛程结果" },
  { href: "/team", label: "球队" },
  { href: "/news", label: "新闻中心" },
  { href: "/tickets", label: "票务" },
  { href: "/shop", label: "官方商店" },
  { href: "/about", label: "关于俱乐部" },
];

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[color:var(--color-surface)]/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[color:var(--color-primary)] text-sm font-semibold tracking-[0.3em] text-white shadow-[0_0_30px_rgba(204,24,30,0.45)]">
            CDR
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.32em] text-white/55">
              CD Rangers FC
            </p>
            <p className="text-sm font-semibold text-white">成都蓉城足球俱乐部</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm text-white/72 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href="/profile"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/72 transition hover:border-white/25 hover:text-white"
              >
                {session.user.name ?? "个人中心"}
              </Link>
              {session.user.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className="rounded-full border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/10 px-4 py-2 text-sm text-[color:var(--color-accent)]"
                >
                  后台管理
                </Link>
              ) : null}
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/72 transition hover:border-white/25 hover:text-white"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="inline-flex rounded-full bg-[color:var(--color-accent)] px-4 py-2 text-sm font-semibold text-[color:var(--color-ink)] transition hover:brightness-110"
              >
                会员注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
