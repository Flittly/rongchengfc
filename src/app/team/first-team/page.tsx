import type { Metadata } from "next";
import { SquadType } from "@prisma/client";
import { PlayerGrid } from "@/components/site/player-grid";
import { getTeamBySquad } from "@/lib/data";

export const metadata: Metadata = {
  title: "一线队",
  description: "成都蓉城足球俱乐部一线队球员名单与基础资料。",
};

export default async function FirstTeamPage() {
  const players = await getTeamBySquad(SquadType.FIRST_TEAM);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <h1 className="font-[family:var(--font-display)] text-4xl font-semibold text-white sm:text-5xl">
        一线队
      </h1>
      <p className="mt-4 max-w-3xl text-white/70">按号码与位置整理，点击卡片可进入球员详情页查看技术统计和生涯信息。</p>

      <div className="mt-8">
        <PlayerGrid players={players} />
      </div>
    </div>
  );
}
