import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { NewsCategory } from "@prisma/client";
import { getNewsPage } from "@/lib/data";
import { formatDateTime, newsCategoryLabelMap } from "@/lib/format";

export const metadata: Metadata = {
  title: "新闻中心",
  description: "浏览成都蓉城官方新闻、公告与视频内容，支持分类筛选和分页。",
};

const categoryTabs: Array<{ label: string; value?: NewsCategory }> = [
  { label: "全部" },
  { label: "新闻", value: NewsCategory.NEWS },
  { label: "公告", value: NewsCategory.ANNOUNCEMENT },
  { label: "视频", value: NewsCategory.VIDEO },
];

interface NewsPageProps {
  searchParams: Promise<{
    category?: NewsCategory;
    page?: string;
  }>;
}

export default async function NewsPage(props: NewsPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page ?? "1");
  const category =
    searchParams.category && searchParams.category in NewsCategory
      ? (searchParams.category as NewsCategory)
      : undefined;

  const data = await getNewsPage({
    category,
    page: Number.isNaN(page) ? 1 : page,
    pageSize: 6,
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <h1 className="font-[family:var(--font-display)] text-4xl font-semibold text-white sm:text-5xl">
        新闻中心
      </h1>
      <p className="mt-4 max-w-3xl text-white/70">包含俱乐部新闻、官方公告和视频内容，支持按类别筛选与分页浏览。</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {categoryTabs.map((tab) => {
          const active = tab.value === category || (!tab.value && !category);
          const href = tab.value ? `/news?category=${tab.value}` : "/news";

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

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.items.map((post) => (
          <article key={post.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20">
            <div className="relative h-48">
              <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="(max-width: 1280px) 50vw, 33vw" />
            </div>
            <div className="p-5">
              <p className="text-xs text-white/50">
                {newsCategoryLabelMap[post.category]} · {formatDateTime(post.publishedAt)}
              </p>
              <h2 className="mt-2 line-clamp-2 text-xl font-semibold text-white">{post.title}</h2>
              <p className="mt-3 line-clamp-3 text-sm text-white/68">{post.excerpt}</p>
              <Link href={`/news/${post.slug}`} className="mt-4 inline-flex text-sm text-[color:var(--color-accent)] hover:underline">
                阅读详情
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between text-sm text-white/70">
        <Link
          href={data.page > 1 ? `/news?page=${data.page - 1}${category ? `&category=${category}` : ""}` : "#"}
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
              ? `/news?page=${data.page + 1}${category ? `&category=${category}` : ""}`
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
    </div>
  );
}
