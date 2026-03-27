import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type HeroAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type HighlightItem = {
  label: string;
  value: string;
};

type SectionItem = {
  title: string;
  description: string;
  meta?: string;
};

type QuickLinkItem = {
  href: string;
  label: string;
};

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  heroActions?: HeroAction[];
  highlights: HighlightItem[];
  sections: SectionItem[];
  quickLinks?: QuickLinkItem[];
  icon: LucideIcon;
  asideTitle: string;
  asideDescription: string;
  asidePoints: string[];
};

export function PageShell({
  eyebrow,
  title,
  description,
  badge,
  heroActions = [],
  highlights,
  sections,
  quickLinks = [],
  icon: Icon,
  asideTitle,
  asideDescription,
  asidePoints,
}: PageShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-20 pt-10 lg:px-8 lg:pt-14">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(225,37,43,0.24),transparent_62%)] blur-2xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-[color:var(--color-accent)]/25 bg-[color:var(--color-accent)]/10 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
                {eyebrow}
              </span>
              {badge ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/68">
                  {badge}
                </span>
              ) : null}
            </div>

            <div className="space-y-4">
              <h1 className="font-[family:var(--font-display)] text-4xl font-semibold uppercase leading-none text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-white/70 sm:text-lg">
                {description}
              </p>
            </div>

            {heroActions.length > 0 ? (
              <div className="flex flex-col gap-4 sm:flex-row">
                {heroActions.map((action) => (
                  <Link
                    key={action.href + action.label}
                    href={action.href}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
                      action.variant === "secondary"
                        ? "border border-white/15 bg-white/5 text-white/82 hover:border-white/25 hover:bg-white/10 hover:text-white"
                        : "bg-[color:var(--color-primary)] text-white hover:bg-[color:var(--color-primary-strong)]"
                    )}
                  >
                    {action.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/50">Module Focus</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">{asideTitle}</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary)]/20 text-[color:var(--color-accent)]">
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-white/68">{asideDescription}</p>
            <div className="mt-6 space-y-3">
              {asidePoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/72"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-accent)]">
            关键内容
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="font-[family:var(--font-display)] text-3xl font-semibold text-[color:var(--color-accent)]">
                  {item.value}
                </p>
                <p className="mt-2 text-sm text-white/68">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            {sections.map((section) => (
              <div
                key={section.title}
                className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 transition hover:border-white/15 hover:bg-black/25"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                  {section.meta ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/62">
                      {section.meta}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/66">{section.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-7 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-accent)]">
            页面导览
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">统一版式已接入主栏目骨架</h2>
          <p className="mt-4 text-sm leading-7 text-white/66">
            当前阶段聚焦于完成信息架构、基础视觉与页面入口布置，后续会继续接入 Prisma 数据模型、NextAuth 登录体系、内容管理与交互逻辑。
          </p>

          <div className="mt-8 space-y-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/72 transition hover:border-[color:var(--color-accent)]/30 hover:text-white"
              >
                <span>{link.label}</span>
                <ArrowRight className="h-4 w-4 text-[color:var(--color-accent)] transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
