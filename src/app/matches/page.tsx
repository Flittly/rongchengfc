import type { Metadata } from "next";
import Link from "next/link";
import { MatchStatus } from "@prisma/client";
import { PageFrame } from "@/components/ui/page-frame";
import { formatDateTime, statusLabelMap } from "@/lib/format";
import { getMatches } from "@/lib/data";

export const metadata: Metadata = {
  title: "赛程结果",
  description: "查看成都蓉城赛季赛程、比赛状态、比分与详细比赛信息。",
};

const statusTabs: Array<{ label: string; value?: MatchStatus }> = [
  { label: "全部" },
  { label: "未开始", value: MatchStatus.UPCOMING },
  { label: "进行中", value: MatchStatus.LIVE },
  { label: "已结束", value: MatchStatus.FINISHED },
];

interface MatchesPageProps {
  searchParams: Promise<{
    page?: string;
    status?: MatchStatus;
  }>;
}

export default async function MatchesPage(props: MatchesPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page ?? "1");
  const status =
    searchParams.status && searchParams.status in MatchStatus
      ? (searchParams.status as MatchStatus)
      : undefined;

  const data = await getMatches({
    page: Number.isNaN(page) ? 1 : page,
    status,
    pageSize: 8,
  });

  return (
    <PageFrame
      eyebrow="Matches & Results"
      title="赛程结果"
      description="支持按状态筛选、分页浏览和单场详情查看，包含比赛时间、赛事类型、比分和战报信息。"
      stats={[
        { label: "比赛总数", value: String(data.total) },
        { label: "当前页", value: String(data.page) },
        { label: "总页数", value: String(data.totalPages) },
      ]}
      aside={
        <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(200,24,30,0.2),rgba(0,0,0,0.4))] p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.28em] text-white/55">筛选</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {statusTabs.map((tab) => {
              const active = tab.value === status || (!tab.value && !status);
              const href = tab.value ? `/matches?status=${tab.value}` : "/matches";

              return (
                <Link
                  key={tab.label}
                  href={href}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]"
                      : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      }
    >
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl lg:col-span-2">
        <div className="space-y-4">
          {data.items.map((match) => (
            <article
              key={match.id}
              className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-white/55">
                    {match.competition}
                    {match.round ? ` · ${match.round}` : ""}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    {match.homeTeam} vs {match.awayTeam}
                  </h2>
                  <p className="mt-2 text-sm text-white/65">{formatDateTime(match.kickoffAt)}</p>
                  <p className="mt-1 text-sm text-white/65">{match.venue}</p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/72">
                    {statusLabelMap[match.status]}
                  </p>
                  {match.status === MatchStatus.FINISHED ? (
                    <p className="mt-3 font-[family:var(--font-display)] text-3xl text-[color:var(--color-accent)]">
                      {match.homeScore} : {match.awayScore}
                    </p>
                  ) : null}
                  <Link
                    href={`/matches/${match.slug}`}
                    className="mt-3 inline-flex text-sm text-[color:var(--color-accent)] hover:underline"
                  >
                    查看详情
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between text-sm text-white/70">
          <Link
            href={data.page > 1 ? `/matches?page=${data.page - 1}${status ? `&status=${status}` : ""}` : "#"}
            className={`rounded-full border px-4 py-2 ${
              data.page > 1 ? "border-white/20 hover:bg-white/10" : "cursor-not-allowed border-white/10 opacity-50"
            }`}
          >
            上一页
          </Link>
          <span>
            第 {data.page} / {data.totalPages} 页
          </span>
          <Link
            href={
              data.page < data.totalPages
                ? `/matches?page=${data.page + 1}${status ? `&status=${status}` : ""}`
                : "#"
            }
            className={`rounded-full border px-4 py-2 ${
              data.page < data.totalPages
                ? "border-white/20 hover:bg-white/10"
                : "cursor-not-allowed border-white/10 opacity-50"
            }`}
          >
            下一页
          </Link>
        </div>
      </section>
    </PageFrame>
  );
}
