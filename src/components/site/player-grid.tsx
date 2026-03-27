import Image from "next/image";
import Link from "next/link";
import type { Player } from "@prisma/client";

interface PlayerGridProps {
  players: Player[];
}

export function PlayerGrid({ players }: PlayerGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {players.map((player) => (
        <Link
          key={player.id}
          href={`/team/players/${player.slug}`}
          className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20 transition hover:-translate-y-1 hover:border-[color:var(--color-accent)]/35"
        >
          <div className="relative h-56 bg-black/20">
            <Image
              src={player.portraitUrl}
              alt={player.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 50vw, 33vw"
            />
          </div>
          <div className="p-4">
            <p className="text-sm text-white/55">#{player.jerseyNumber ?? "--"} · {player.position}</p>
            <h3 className="mt-1 text-lg font-semibold text-white">{player.name}</h3>
            <p className="mt-1 text-sm text-white/65">{player.nationality}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
