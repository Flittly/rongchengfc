import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteToggle } from "@/components/site/favorite-toggle";
import { auth } from "@/lib/auth";
import { getNewsBySlug } from "@/lib/data";
import { formatDateTime, newsCategoryLabelMap } from "@/lib/format";
import { prisma } from "@/lib/prisma";

interface NewsDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  props: NewsDetailPageProps,
): Promise<Metadata> {
  const { slug } = await props.params;
  const news = await getNewsBySlug(slug);

  if (!news) {
    return { title: "新闻详情" };
  }

  return {
    title: news.title,
    description: news.excerpt,
  };
}

export default async function NewsDetailPage(props: NewsDetailPageProps) {
  const { slug } = await props.params;
  const news = await getNewsBySlug(slug);
  const session = await auth();

  if (!news) {
    notFound();
  }

  const favorited =
    session?.user?.id
      ? Boolean(
          await prisma.favoriteNews.findUnique({
            where: { userId_newsId: { userId: session.user.id, newsId: news.id } },
            select: { id: true },
          }),
        )
      : false;

  return (
    <article className="mx-auto w-full max-w-4xl px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <Link href="/news" className="text-sm text-[color:var(--color-accent)] hover:underline">
        返回新闻中心
      </Link>
      <p className="mt-5 text-sm text-white/55">
        {newsCategoryLabelMap[news.category]} · {formatDateTime(news.publishedAt)}
      </p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">{news.title}</h1>
      <p className="mt-4 text-white/72">{news.excerpt}</p>
      <div className="mt-4">
        <FavoriteToggle entityType="news" entityId={news.id} initialFavorited={favorited} />
      </div>

      <div className="relative mt-8 h-72 overflow-hidden rounded-2xl border border-white/10 sm:h-96">
        <Image src={news.coverImage} alt={news.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 1024px" />
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 leading-8 text-white/80">
        {news.content}
      </div>
    </article>
  );
}
