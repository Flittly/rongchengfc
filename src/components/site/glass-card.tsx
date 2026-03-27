import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = {
  title?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
};

export function GlassCard({
  title,
  description,
  className,
  children,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 backdrop-blur-xl",
        className,
      )}
    >
      {title ? (
        <div className="mb-5 space-y-2">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {description ? (
            <p className="text-sm leading-7 text-white/62">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
