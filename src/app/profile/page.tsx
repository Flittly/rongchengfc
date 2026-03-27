import type { Metadata } from "next";
import Link from "next/link";
import { PreferencesForm } from "@/app/profile/preferences-form";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "个人中心",
  description: "查看收藏内容并管理个人偏好。",
};

export default async function ProfilePage() {
  const session = await requireUser();

  const [preferences, favoritesNews, favoritesMatches, favoritesProducts] =
    await Promise.all([
      prisma.userPreference.findUnique({ where: { userId: session.user.id } }),
      prisma.favoriteNews.findMany({
        where: { userId: session.user.id },
        include: { news: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.favoriteMatch.findMany({
        where: { userId: session.user.id },
        include: { match: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.favoriteProduct.findMany({
        where: { userId: session.user.id },
        include: { product: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <h1 className="text-3xl font-semibold text-white sm:text-4xl">个人中心</h1>
      <p className="mt-3 text-white/70">
        欢迎回来，{session.user.name ?? session.user.email}。你可以在这里维护偏好设置并查看收藏内容。
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-semibold text-white">偏好设置</h2>
          <div className="mt-4">
            <PreferencesForm initial={preferences ?? {}} />
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
          <h2 className="text-2xl font-semibold text-white">我的收藏</h2>
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-sm text-white/55">新闻</p>
              <ul className="mt-2 space-y-2 text-sm">
                {favoritesNews.length ? (
                  favoritesNews.map((item) => (
                    <li key={item.id}>
                      <Link href={`/news/${item.news.slug}`} className="text-white/80 hover:text-white hover:underline">
                        {item.news.title}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-white/55">暂无收藏</li>
                )}
              </ul>
            </div>

            <div>
              <p className="text-sm text-white/55">比赛</p>
              <ul className="mt-2 space-y-2 text-sm">
                {favoritesMatches.length ? (
                  favoritesMatches.map((item) => (
                    <li key={item.id}>
                      <Link href={`/matches/${item.match.slug}`} className="text-white/80 hover:text-white hover:underline">
                        {item.match.homeTeam} vs {item.match.awayTeam}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-white/55">暂无收藏</li>
                )}
              </ul>
            </div>

            <div>
              <p className="text-sm text-white/55">商品</p>
              <ul className="mt-2 space-y-2 text-sm">
                {favoritesProducts.length ? (
                  favoritesProducts.map((item) => (
                    <li key={item.id}>
                      <Link href={`/shop/${item.product.slug}`} className="text-white/80 hover:text-white hover:underline">
                        {item.product.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-white/55">暂无收藏</li>
                )}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
