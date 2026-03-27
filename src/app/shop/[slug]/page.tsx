import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteToggle } from "@/components/site/favorite-toggle";
import { auth } from "@/lib/auth";
import { getProductBySlug } from "@/lib/data";
import { formatCny } from "@/lib/format";
import { prisma } from "@/lib/prisma";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  props: ProductDetailPageProps,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "商品详情" };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage(props: ProductDetailPageProps) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  const session = await auth();

  if (!product) {
    notFound();
  }

  const favorited =
    session?.user?.id
      ? Boolean(
          await prisma.favoriteProduct.findUnique({
            where: {
              userId_productId: { userId: session.user.id, productId: product.id },
            },
            select: { id: true },
          }),
        )
      : false;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 lg:px-8 lg:pt-16">
      <Link href="/shop" className="text-sm text-[color:var(--color-accent)] hover:underline">
        返回官方商店
      </Link>

      <section className="mt-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            {product.images.map((image) => (
              <div key={image.id} className="relative h-64 overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src={image.imageUrl}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              </div>
            ))}
          </div>

          <div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">{product.name}</h1>
            <p className="mt-4 leading-8 text-white/78">{product.description}</p>
            <p className="mt-6 text-2xl font-semibold text-[color:var(--color-accent)]">{formatCny(product.priceCny)}</p>
            <p className={`mt-2 text-sm ${product.stock > 0 ? "text-emerald-300" : "text-red-300"}`}>
              {product.stock > 0 ? `库存充足（${product.stock}）` : "暂时缺货"}
            </p>

            <button
              type="button"
              className="mt-6 rounded-full bg-[color:var(--color-primary)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--color-primary-strong)]"
            >
              加入购物车（模拟）
            </button>
            <div className="mt-3">
              <FavoriteToggle entityType="product" entityId={product.id} initialFavorited={favorited} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
