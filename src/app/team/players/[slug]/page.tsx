import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayerBySlug } from "@/lib/data";
import { calculateAge, formatDate } from "@/lib/format";

interface PlayerDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  props: PlayerDetailPageProps,
): Promise<Metadata> {
  const { slug } = await props.params;
  const player = await getPlayerBySlug(slug);

  if (!player) {
    return { title: "球员详情" };
  }

  return {
    title: `${player.name} | 球员详情`,
    description: `${player.name}（${player.position}）个人资料、赛季数据与生涯高光。`,
  };
}

export default async function PlayerDetailPage(props: PlayerDetailPageProps) {
  const { slug } = await props.params;
  const player = await getPlayerBySlug(slug);

  if (!player) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <Link href="/team" className="text-sm text-[color:var(--color-accent)] hover:underline">
        返回球队页面
      </Link>

      <section className="mt-4 grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl lg:grid-cols-[320px_1fr]">
        <div className="relative h-80 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <Image src={player.portraitUrl} alt={player.name} fill className="object-cover" priority />
        </div>
        <div>
          <p className="text-sm text-white/55">
            #{player.jerseyNumber ?? "--"} · {player.position}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{player.name}</h1>
          <p className="mt-3 leading-8 text-white/78">{player.bio}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
              国籍：{player.nationality}
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
              出生日期：{formatDate(player.birthDate)}（{calculateAge(player.birthDate)} 岁）
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
              身高：{player.heightCm ?? "--"} cm
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
              体重：{player.weightKg ?? "--"} kg
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-sm text-white/55">出场</p>
              <p className="mt-1 text-2xl font-semibold text-[color:var(--color-accent)]">{player.appearances}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-sm text-white/55">进球</p>
              <p className="mt-1 text-2xl font-semibold text-[color:var(--color-accent)]">{player.goals}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-sm text-white/55">助攻</p>
              <p className="mt-1 text-2xl font-semibold text-[color:var(--color-accent)]">{player.assists}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-black/20 p-7">
        <h2 className="text-2xl font-semibold text-white">生涯高光 / 视频集锦</h2>
        {player.moments.length ? (
          <div className="mt-4 space-y-3">
            {player.moments.map((moment) => (
              <article key={moment.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
                <h3 className="text-lg font-semibold text-white">{moment.title}</h3>
                <a
                  href={moment.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-sm text-[color:var(--color-accent)] hover:underline"
                >
                  打开视频
                </a>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-white/65">暂无公开视频内容。</p>
        )}
      </section>
    </div>
  );
}
