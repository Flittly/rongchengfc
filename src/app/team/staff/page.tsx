import type { Metadata } from "next";
import { SquadType } from "@prisma/client";
import { PlayerGrid } from "@/components/site/player-grid";
import { getTeamBySquad } from "@/lib/data";

export const metadata: Metadata = {
  title: "教练组",
  description: "成都蓉城足球俱乐部教练组成员信息。",
};

export default async function StaffPage() {
  const staff = await getTeamBySquad(SquadType.COACHING_STAFF);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <h1 className="font-[family:var(--font-display)] text-4xl font-semibold text-white sm:text-5xl">
        教练组
      </h1>
      <p className="mt-4 max-w-3xl text-white/70">教练组页面展示主教练与核心技术团队成员信息。</p>
      <div className="mt-8">
        <PlayerGrid players={staff} />
      </div>
    </div>
  );
}
