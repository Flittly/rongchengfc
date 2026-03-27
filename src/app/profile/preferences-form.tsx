"use client";

import { useState } from "react";

interface Preferences {
  favoriteCompetition?: string | null;
  favoritePlayer?: string | null;
  language?: string;
  receiveNewsletter?: boolean;
}

export function PreferencesForm({
  initial,
}: {
  initial: Preferences;
}) {
  const [favoriteCompetition, setFavoriteCompetition] = useState(
    initial.favoriteCompetition ?? "",
  );
  const [favoritePlayer, setFavoritePlayer] = useState(initial.favoritePlayer ?? "");
  const [language, setLanguage] = useState(initial.language ?? "zh-CN");
  const [receiveNewsletter, setReceiveNewsletter] = useState(
    initial.receiveNewsletter ?? true,
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    const response = await fetch("/api/user/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        favoriteCompetition,
        favoritePlayer,
        language,
        receiveNewsletter,
      }),
    });
    setPending(false);
    setMessage(response.ok ? "偏好已保存。" : "保存失败，请稍后重试。");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="favoriteCompetition" className="text-sm text-white/70">
          最关注赛事
        </label>
        <input
          id="favoriteCompetition"
          value={favoriteCompetition}
          onChange={(e) => setFavoriteCompetition(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]/50"
        />
      </div>
      <div>
        <label htmlFor="favoritePlayer" className="text-sm text-white/70">
          最喜欢球员
        </label>
        <input
          id="favoritePlayer"
          value={favoritePlayer}
          onChange={(e) => setFavoritePlayer(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]/50"
        />
      </div>
      <div>
        <label htmlFor="language" className="text-sm text-white/70">
          语言
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]/50"
        >
          <option value="zh-CN">简体中文</option>
          <option value="en-US">English</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-white/75">
        <input
          type="checkbox"
          checked={receiveNewsletter}
          onChange={(e) => setReceiveNewsletter(e.target.checked)}
        />
        接收新闻邮件
      </label>

      {message ? <p className="text-sm text-white/75">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[color:var(--color-primary)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--color-primary-strong)] disabled:opacity-60"
      >
        {pending ? "保存中..." : "保存偏好"}
      </button>
    </form>
  );
}
