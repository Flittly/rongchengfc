import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  children?: ReactNode;
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  badge,
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-8 sm:py-10 lg:px-10",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,37,43,0.22),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(244,197,78,0.12),transparent_30%)]" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-accent)]">
            {eyebrow}
          </p>
          <div className="space-y-3">
            <h1 className="font-[family:var(--font-display)] text-3xl font-semibold uppercase leading-none text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-white/68 sm:text-base sm:leading-8">
              {description}
            </p>
          </div>
        </div>

        {(badge || children) && (
          <div className="flex flex-col gap-4 lg:items-end">
            {badge ? (
              <div className="inline-flex w-fit rounded-full border border-[color:var(--color-accent)]/25 bg-[color:var(--color-accent)]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
                {badge}
              </div>
            ) : null}
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
