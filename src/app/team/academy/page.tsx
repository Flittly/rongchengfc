import type { Metadata } from "next";
import { SquadType } from "@prisma/client";
import { PlayerGrid } from "@/components/site/player-grid";
import { getTeamBySquad } from "@/lib/data";

export const metadata: Metadata = {
  title: "梯队",
  description: "成都蓉城足球俱乐部梯队球员信息。",
};

export default async function AcademyPage() {
  const players = await getTeamBySquad(SquadType.ACADEMY);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <h1 className="font-[family:var(--font-display)] text-4xl font-semibold text-white sm:text-5xl">
        梯队
      </h1>
      <p className="mt-4 max-w-3xl text-white/70">梯队页面用于展示俱乐部后备力量和青训培养进展。</p>
      <div className="mt-8">
        <PlayerGrid players={players} />
      </div>
    </div>
  );
}
