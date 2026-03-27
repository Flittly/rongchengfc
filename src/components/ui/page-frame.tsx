import type { ReactNode } from "react";

interface PageFrameStat {
  label: string;
  value: string;
}

interface PageFrameProps {
  eyebrow: string;
  title: string;
  description: string;
  stats: PageFrameStat[];
  aside?: ReactNode;
  children: ReactNode;
}

export function PageFrame({
  eyebrow,
  title,
  description,
  stats,
  aside,
  children,
}: PageFrameProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.4)] backdrop-blur sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,rgba(225,37,43,0.24),transparent_56%)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--color-accent)]">
              {eyebrow}
            </p>
            <div className="space-y-4">
              <h1 className="max-w-4xl font-[family:var(--font-display)] text-4xl font-semibold uppercase leading-none text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-white/70 sm:text-lg">
                {description}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4"
                >
                  <p className="font-[family:var(--font-display)] text-2xl font-semibold text-[color:var(--color-accent)] sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-white/68">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          {aside ? <div className="relative">{aside}</div> : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">{children}</div>
    </div>
  );
}
