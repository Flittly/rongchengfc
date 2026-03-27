"use client";

import { useState } from "react";

type EntityType = "news" | "match" | "product";

interface FavoriteToggleProps {
  entityType: EntityType;
  entityId: string;
  initialFavorited: boolean;
}

export function FavoriteToggle({
  entityType,
  entityId,
  initialFavorited,
}: FavoriteToggleProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  async function toggleFavorite() {
    setPending(true);

    const response = await fetch("/api/user/favorites", {
      method: favorited ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId }),
    });
    setPending(false);

    if (response.ok) {
      setFavorited(!favorited);
      return;
    }

    if (response.status === 401) {
      window.location.href = "/login";
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={pending}
      className={`rounded-full border px-4 py-2 text-sm transition ${
        favorited
          ? "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]"
          : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
      } disabled:opacity-60`}
    >
      {favorited ? "已收藏" : "收藏"}
    </button>
  );
}
