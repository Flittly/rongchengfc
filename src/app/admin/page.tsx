import type { Metadata } from "next";
import { NewsPublisher } from "@/app/admin/news-publisher";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "后台管理",
  description: "管理员内容管理页面。",
};

export default async function AdminPage() {
  await requireAdmin();

  const [newsCount, matchCount, productCount, userCount] = await Promise.all([
    prisma.newsPost.count(),
    prisma.match.count(),
    prisma.product.count(),
    prisma.user.count(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <h1 className="text-3xl font-semibold text-white sm:text-4xl">后台管理</h1>
      <p className="mt-3 text-white/70">当前页面用于演示管理员权限与内容发布能力。</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-sm text-white/55">新闻</p>
          <p className="mt-1 text-2xl font-semibold text-[color:var(--color-accent)]">{newsCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-sm text-white/55">比赛</p>
          <p className="mt-1 text-2xl font-semibold text-[color:var(--color-accent)]">{matchCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-sm text-white/55">商品</p>
          <p className="mt-1 text-2xl font-semibold text-[color:var(--color-accent)]">{productCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-sm text-white/55">用户</p>
          <p className="mt-1 text-2xl font-semibold text-[color:var(--color-accent)]">{userCount}</p>
        </div>
      </div>

      <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-2xl font-semibold text-white">发布新闻</h2>
        <p className="mt-2 text-sm text-white/65">通过 API Route 创建新闻内容（示例功能）。</p>
        <div className="mt-4">
          <NewsPublisher />
        </div>
      </section>
    </div>
  );
}
