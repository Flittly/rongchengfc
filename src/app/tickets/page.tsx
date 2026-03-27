import type { Metadata } from "next";
import Link from "next/link";
import { getTickets } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "票务信息",
  description: "主场比赛票务信息、票档价格和购票入口（模拟）。",
};

interface PriceTier {
  name: string;
  price: number;
}

export default async function TicketsPage() {
  const tickets = await getTickets();

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <h1 className="font-[family:var(--font-display)] text-4xl font-semibold text-white sm:text-5xl">
        票务信息
      </h1>
      <p className="mt-4 max-w-3xl text-white/70">以下购票链接用于演示，实际购买请跳转官方合作票务平台。</p>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {tickets.map((ticket) => {
          const tiers = Array.isArray(ticket.priceTiers)
            ? (ticket.priceTiers as unknown as PriceTier[])
            : [];

          return (
            <article key={ticket.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-semibold text-white">{ticket.title}</h2>
              <p className="mt-2 text-white/70">{ticket.description}</p>
              <p className="mt-3 text-sm text-white/55">开售时间：{formatDateTime(ticket.saleStartAt)}</p>
              {ticket.match ? (
                <p className="mt-2 text-sm text-white/55">
                  对阵：{ticket.match.homeTeam} vs {ticket.match.awayTeam}
                </p>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {tiers.map((tier) => (
                  <div key={tier.name} className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <p className="text-sm text-white/60">{tier.name}</p>
                    <p className="mt-1 text-lg font-semibold text-[color:var(--color-accent)]">¥{tier.price}</p>
                  </div>
                ))}
              </div>

              <Link
                href={ticket.purchaseUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                前往购票
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
