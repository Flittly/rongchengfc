"use client";

import { useState } from "react";

export function NewsPublisher() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("/images/news/news-1.svg");
  const [category, setCategory] = useState("NEWS");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    const response = await fetch("/api/admin/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        excerpt,
        content,
        coverImage,
        category,
      }),
    });

    setPending(false);
    if (!response.ok) {
      setMessage("发布失败，请检查参数或权限。");
      return;
    }

    setMessage("新闻发布成功。");
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="标题"
        required
        className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none"
      />
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="slug（如 team-news-2026-1）"
        required
        className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none"
      />
      <input
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        placeholder="摘要"
        required
        className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="正文"
        required
        rows={5}
        className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="封面地址"
          required
          className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none"
        >
          <option value="NEWS">新闻</option>
          <option value="ANNOUNCEMENT">公告</option>
          <option value="VIDEO">视频</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[color:var(--color-primary)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "发布中..." : "发布新闻"}
      </button>
      {message ? <p className="text-sm text-white/75">{message}</p> : null}
    </form>
  );
}
