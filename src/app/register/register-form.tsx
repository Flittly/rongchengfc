"use client";

import { useState } from "react";

interface RegisterResponse {
  message: string;
  verifyUrl?: string;
}

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegisterResponse | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = (await response.json().catch(() => null)) as RegisterResponse | null;
    setPending(false);

    if (!response.ok || !data) {
      setError(data?.message ?? "注册失败，请稍后重试。");
      return;
    }

    setResult(data);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-white/70" htmlFor="name">
          昵称
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-[color:var(--color-accent)]/50"
        />
      </div>
      <div>
        <label className="text-sm text-white/70" htmlFor="email">
          邮箱
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-[color:var(--color-accent)]/50"
        />
      </div>
      <div>
        <label className="text-sm text-white/70" htmlFor="password">
          密码
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-[color:var(--color-accent)]/50"
        />
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {result ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          <p>{result.message}</p>
          {result.verifyUrl ? (
            <a className="mt-2 inline-flex underline" href={result.verifyUrl}>
              开发环境验证链接（点击完成验证）
            </a>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[color:var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--color-primary-strong)] disabled:opacity-60"
      >
        {pending ? "提交中..." : "注册"}
      </button>
    </form>
  );
}
