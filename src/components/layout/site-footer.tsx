import Link from "next/link";

const quickLinks = [
  { href: "/matches", label: "赛程结果" },
  { href: "/team", label: "球队" },
  { href: "/news", label: "新闻中心" },
  { href: "/tickets", label: "票务" },
  { href: "/shop", label: "官方商店" },
  { href: "/about", label: "关于俱乐部" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/30">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.3fr_1fr] lg:px-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-accent)]">
            For The City
          </p>
          <h2 className="max-w-xl text-2xl font-semibold text-white sm:text-3xl">
            为红而战，为城而生。打造连接球迷、球队与城市的数字主场。
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-white/64">
            本站基于 Next.js App Router、Prisma、PostgreSQL 和 NextAuth 构建，
            面向赛程内容、球队信息、球迷服务与后台运营管理。
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-semibold text-white">快速入口</p>
            <ul className="space-y-3 text-sm text-white/68">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold text-white">俱乐部信息</p>
            <ul className="space-y-3 text-sm text-white/68">
              <li>主场：凤凰山体育公园专业足球场</li>
              <li>邮箱：contact@cdrfc.cn</li>
              <li>技术栈：Next.js + Prisma + PostgreSQL</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
