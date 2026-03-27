import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteToggle } from "@/components/site/favorite-toggle";
import { auth } from "@/lib/auth";
import { MatchStatus } from "@prisma/client";
import { getMatchBySlug } from "@/lib/data";
import { formatDateTime, statusLabelMap } from "@/lib/format";
import { prisma } from "@/lib/prisma";

interface MatchDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  props: MatchDetailPageProps,
): Promise<Metadata> {
  const { slug } = await props.params;
  const match = await getMatchBySlug(slug);

  if (!match) {
    return {
      title: "比赛详情",
    };
  }

  return {
    title: `${match.homeTeam} vs ${match.awayTeam}`,
    description: `${match.competition} ${match.round ?? ""}，${formatDateTime(match.kickoffAt)}，${match.venue}`,
  };
}

export default async function MatchDetailPage(props: MatchDetailPageProps) {
  const { slug } = await props.params;
  const match = await getMatchBySlug(slug);
  const session = await auth();

  if (!match) {
    notFound();
  }

  const favorited =
    session?.user?.id
      ? Boolean(
          await prisma.favoriteMatch.findUnique({
            where: { userId_matchId: { userId: session.user.id, matchId: match.id } },
            select: { id: true },
          }),
        )
      : false;

  const stats =
    match.technicalStats && typeof match.technicalStats === "object"
      ? (match.technicalStats as Record<string, unknown>)
      : {};

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
        <Link href="/matches" className="text-sm text-[color:var(--color-accent)] hover:underline">
          返回赛程列表
        </Link>
        <p className="mt-4 text-sm text-white/55">
          {match.competition}
          {match.round ? ` · ${match.round}` : ""}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
          {match.homeTeam} vs {match.awayTeam}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
          <span>{statusLabelMap[match.status]}</span>
          <span>·</span>
          <span>{formatDateTime(match.kickoffAt)}</span>
          <span>·</span>
          <span>{match.venue}</span>
        </div>

        {match.status === MatchStatus.FINISHED ? (
          <p className="mt-6 font-[family:var(--font-display)] text-5xl text-[color:var(--color-accent)]">
            {match.homeScore} : {match.awayScore}
          </p>
        ) : null}

        {match.report ? <p className="mt-8 leading-8 text-white/78">{match.report}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {match.highlightsUrl ? (
            <a
              href={match.highlightsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-white transition hover:bg-white/10"
            >
              查看比赛集锦
            </a>
          ) : null}
          <FavoriteToggle entityId={match.id} entityType="match" initialFavorited={favorited} />
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-black/20 p-8">
        <h2 className="text-2xl font-semibold text-white">技术统计</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {Object.entries(stats).length ? (
            Object.entries(stats).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-sm text-white/55">{key}</p>
                <p className="mt-1 text-lg font-semibold text-white">{String(value)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/65">暂无可展示的技术统计数据。</p>
          )}
        </div>
      </section>
    </div>
  );
}
