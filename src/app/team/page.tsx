import type { Metadata } from "next";
import Link from "next/link";
import { SquadType } from "@prisma/client";
import { PageFrame } from "@/components/ui/page-frame";
import { PlayerGrid } from "@/components/site/player-grid";
import { getTeamBySquad } from "@/lib/data";

export const metadata: Metadata = {
  title: "球队",
  description: "查看成都蓉城一线队、梯队和教练组信息。",
};

export default async function TeamPage() {
  const firstTeam = await getTeamBySquad(SquadType.FIRST_TEAM);

  return (
    <PageFrame
      eyebrow="Squad"
      title="球队阵容"
      description="你可以从这里进入一线队、梯队和教练组三个子页面，查看球员与职员的完整资料。"
      stats={[
        { label: "一线队人数", value: String(firstTeam.length) },
        { label: "数据结构", value: "Prisma" },
        { label: "展示方式", value: "网格卡片" },
      ]}
      aside={
        <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-white/55">子页面导航</p>
          <div className="mt-4 space-y-3">
            <Link className="block rounded-xl border border-white/10 px-4 py-3 text-sm text-white hover:bg-white/5" href="/team/first-team">
              一线队
            </Link>
            <Link className="block rounded-xl border border-white/10 px-4 py-3 text-sm text-white hover:bg-white/5" href="/team/academy">
              梯队
            </Link>
            <Link className="block rounded-xl border border-white/10 px-4 py-3 text-sm text-white hover:bg-white/5" href="/team/staff">
              教练组
            </Link>
          </div>
        </div>
      }
    >
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">一线队</h2>
          <Link href="/team/first-team" className="text-sm text-[color:var(--color-accent)] hover:underline">
            查看全部
          </Link>
        </div>
        <div className="mt-6">
          <PlayerGrid players={firstTeam} />
        </div>
      </section>
    </PageFrame>
  );
}
