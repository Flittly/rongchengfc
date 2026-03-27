import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/data";
import { formatCny } from "@/lib/format";

export const metadata: Metadata = {
  title: "官方商店",
  description: "浏览俱乐部官方商品，查看价格、库存与多角度详情图。",
};

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <h1 className="font-[family:var(--font-display)] text-4xl font-semibold text-white sm:text-5xl">
        官方商店
      </h1>
      <p className="mt-4 max-w-3xl text-white/70">商品展示为模拟数据，可用于后续接入真实库存和订单系统。</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20">
            <div className="relative h-52">
              <Image src={product.coverImage} alt={product.name} fill className="object-cover" sizes="(max-width: 1280px) 50vw, 33vw" />
            </div>
            <div className="p-5">
              <h2 className="text-xl font-semibold text-white">{product.name}</h2>
              <p className="mt-2 text-sm text-white/68">{product.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-lg font-semibold text-[color:var(--color-accent)]">{formatCny(product.priceCny)}</p>
                <p className={`text-sm ${product.stock > 0 ? "text-emerald-300" : "text-red-300"}`}>
                  {product.stock > 0 ? `有库存（${product.stock}）` : "缺货"}
                </p>
              </div>
              <Link href={`/shop/${product.slug}`} className="mt-4 inline-flex text-sm text-[color:var(--color-accent)] hover:underline">
                查看详情
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
