import type { Metadata } from "next";
import { Noto_Sans_SC, Oxanium } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const displayFont = Oxanium({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Noto_Sans_SC({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cdrfc.example.com"),
  title: {
    default: "成都蓉城足球俱乐部 | CD Rangers FC",
    template: "%s | 成都蓉城足球俱乐部",
  },
  description:
    "成都蓉城足球俱乐部官方网站，提供赛程结果、球队阵容、新闻中心、票务信息、官方商店与俱乐部介绍。",
  keywords: [
    "成都蓉城",
    "成都蓉城足球俱乐部",
    "CD Rangers FC",
    "中超",
    "成都足球",
  ],
  openGraph: {
    title: "成都蓉城足球俱乐部",
    description: "以比赛、球队、新闻和球迷服务为核心的官方站点。",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${displayFont.variable} ${bodyFont.variable} h-full scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full bg-[color:var(--color-background)] text-[color:var(--color-foreground)] antialiased">
        <div className="relative flex min-h-screen flex-col overflow-x-clip bg-[radial-gradient(circle_at_top,rgba(204,24,30,0.28),transparent_35%),linear-gradient(180deg,#180708_0%,#090909_40%,#050505_100%)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_center,rgba(255,196,58,0.14),transparent_58%)]" />
          <SiteHeader />
          <main className="relative flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
