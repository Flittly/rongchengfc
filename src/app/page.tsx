import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Newspaper, Shield, ShoppingBag, Ticket } from "lucide-react";
import { getHomeStats, getLatestNews, getFeaturedPlayers, getUpcomingMatches } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "首页",
  description: "成都蓉城足球俱乐部官方网站首页，聚合赛程、球队、新闻、票务与商店信息。",
};

const modules = [
  {
    title: "赛程 / 结果",
    description: "查看完整赛季比赛安排、比分、状态与详情战报。",
    href: "/matches",
    icon: CalendarDays,
  },
  {
    title: "球队阵容",
    description: "覆盖一线队、梯队与教练组的完整人员资料。",
    href: "/team",
    icon: Shield,
  },
  {
    title: "新闻中心",
    description: "浏览官方新闻、公告和视频内容，支持分类与分页。",
    href: "/news",
    icon: Newspaper,
  },
  {
    title: "票务与商店",
    description: "比赛门票信息与官方周边商品，支持详情浏览。",
    href: "/tickets",
    icon: Ticket,
  },
];

export default async function HomePage() {
  const [stats, upcomingMatches, latestNews, featuredPlayers] = await Promise.all([
    getHomeStats(),
    getUpcomingMatches(3),
    getLatestNews(3),
    getFeaturedPlayers(4),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-10 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <Image
            src="/images/misc/hero-stadium.svg"
            alt="凤凰山体育公园"
            fill
            className="object-cover opacity-60"
            priority
          />
        </div>

        <div className="relative grid items-end gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-accent)]/25 bg-[color:var(--color-accent)]/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
              CD Rangers FC Official
            </div>

            <div className="space-y-5">
              <h1 className="font-[family:var(--font-display)] text-4xl font-semibold uppercase leading-none text-white sm:text-5xl lg:text-7xl">
                FOR THE CITY.
                <br />
                FIGHT IN RED.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                这是成都蓉城足球俱乐部的官方数字主场。我们将持续发布球队资讯、赛程结果、球员资料和球迷服务内容。
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/matches"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--color-primary-strong)]"
              >
                查看赛程结果
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/team"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/82 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
              >
                浏览球队阵容
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="font-[family:var(--font-display)] text-3xl font-semibold text-[color:var(--color-accent)]">
                  {stats.matchCount}
                </p>
                <p className="mt-2 text-sm text-white/68">已录入比赛</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="font-[family:var(--font-display)] text-3xl font-semibold text-[color:var(--color-accent)]">
                  {stats.playerCount}
                </p>
                <p className="mt-2 text-sm text-white/68">一线队球员</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="font-[family:var(--font-display)] text-3xl font-semibold text-[color:var(--color-accent)]">
                  {stats.newsCount}
                </p>
                <p className="mt-2 text-sm text-white/68">新闻内容</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/25 p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-accent)]">下一场比赛</p>
            {upcomingMatches[0] ? (
              <div className="mt-5 space-y-4">
                <h2 className="text-2xl font-semibold text-white">
                  {upcomingMatches[0].homeTeam} vs {upcomingMatches[0].awayTeam}
                </h2>
                <p className="text-sm text-white/65">{upcomingMatches[0].competition}</p>
                <p className="text-sm text-white/65">{formatDateTime(upcomingMatches[0].kickoffAt)}</p>
                <p className="text-sm text-white/65">{upcomingMatches[0].venue}</p>
                <Link
                  href={`/matches/${upcomingMatches[0].slug}`}
                  className="inline-flex rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  查看详情
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/70">暂无近期比赛数据</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">近期新闻</h2>
            <Link href="/news" className="text-sm text-[color:var(--color-accent)] hover:underline">
              查看全部
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {latestNews.map((post) => (
              <article key={post.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/50">{formatDateTime(post.publishedAt)}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{post.title}</h3>
                <p className="mt-2 text-sm text-white/65">{post.excerpt}</p>
                <Link href={`/news/${post.slug}`} className="mt-3 inline-flex text-sm text-[color:var(--color-accent)] hover:underline">
                  阅读全文
                </Link>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-7 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">核心模块</h2>
            <ShoppingBag className="hidden h-8 w-8 text-white/30 sm:block" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {modules.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[1.5rem] border border-white/10 bg-black/20 p-5 transition hover:-translate-y-1 hover:border-[color:var(--color-accent)]/35 hover:bg-black/30"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-[color:var(--color-accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white group-hover:text-[color:var(--color-accent)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/65">{item.description}</p>
                </Link>
              );
            })}
          </div>

          <h3 className="mt-8 text-lg font-semibold text-white">球员聚焦</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {featuredPlayers.map((player) => (
              <Link
                key={player.id}
                href={`/team/players/${player.slug}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <p className="text-sm text-white/50">#{player.jerseyNumber ?? "--"}</p>
                <p className="mt-1 text-lg font-semibold text-white">{player.name}</p>
                <p className="text-sm text-white/65">{player.position}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
