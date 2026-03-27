import type { Metadata } from "next";
import { getClubHonors } from "@/lib/data";

export const metadata: Metadata = {
  title: "关于俱乐部",
  description: "成都蓉城足球俱乐部历史、荣誉、主场与联系方式。",
};

export default async function AboutPage() {
  const honors = await getClubHonors();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <h1 className="font-[family:var(--font-display)] text-4xl font-semibold text-white sm:text-5xl">
        关于俱乐部
      </h1>
      <p className="mt-4 max-w-3xl text-white/70">
        成都蓉城足球俱乐部扎根成都，以稳定竞技表现和主场文化建设为核心，持续推动职业足球与城市体育发展。
      </p>

      <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
        <h2 className="text-2xl font-semibold text-white">俱乐部信息</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-white/75">成立时间：2018 年</div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-white/75">
            主场：凤凰山体育公园专业足球场
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-white/75">联系方式：contact@cdrfc.cn</div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-white/75">地址：四川省成都市</div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-black/20 p-7">
        <h2 className="text-2xl font-semibold text-white">主要荣誉</h2>
        <div className="mt-4 space-y-3">
          {honors.map((honor) => (
            <article key={honor.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
              <p className="text-sm text-[color:var(--color-accent)]">{honor.year}</p>
              <h3 className="mt-1 text-lg font-semibold text-white">{honor.title}</h3>
              {honor.description ? <p className="mt-2 text-sm text-white/68">{honor.description}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
