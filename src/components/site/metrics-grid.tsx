import type { ReactNode } from "react";

type MetricItem = {
  value: string;
  label: string;
  detail?: string;
};

type MetricsGridProps = {
  items: MetricItem[];
  footer?: ReactNode;
};

export function MetricsGrid({ items, footer }: MetricsGridProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <p className="font-[family:var(--font-display)] text-3xl font-semibold text-[color:var(--color-accent)]">
              {item.value}
            </p>
            <p className="mt-2 text-sm font-medium text-white">{item.label}</p>
            {item.detail ? (
              <p className="mt-2 text-sm leading-6 text-white/58">{item.detail}</p>
            ) : null}
          </div>
        ))}
      </div>
      {footer}
    </div>
  );
}
