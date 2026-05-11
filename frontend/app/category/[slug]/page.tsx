import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import NavBar from "@/components/NavBar";
import SafeImage from "@/components/SafeImage";
import { readFrontendData } from "@/lib/site-settings";
import { mergeFrontendData } from "@/lib/frontend-data-merge";
import { getProductsByCategorySlug, getSearchSuggestionsByCategory, type CategorySubCategory } from "@/lib/products-public";
import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  buildCategoryKeywords,
  jsonLdString,
} from "@/lib/seo";

function formatUGX(value: number) {
  return `UGX ${value.toLocaleString("en-US")}`;
}

function ProductCard({ product }: { product: { id: string; name: string; image: string; href: string; shortDesc: string; price: number; oldPrice?: number | null; rating?: number } }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <Link href={product.href} className="block bg-gray-50">
        <SafeImage
          src={product.image}
          alt={product.name}
          width={400}
          height={240}
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
      className="h-[160px] sm:h-[240px] w-full object-cover"
        />
      </Link>
      <div className="p-5">
        <Link
          href={product.href}
          className="line-clamp-2 text-[17px] font-semibold text-gray-900 hover:text-[#0b63ce]"
        >
          {product.name}
        </Link>
        <p className="mt-2 line-clamp-3 text-[14px] leading-6 text-gray-600">
          {product.shortDesc}
        </p>
        <div className="mt-4 flex items-center gap-2 text-[#f59e0b]">
          <Star size={16} className="fill-current" />
          <span className="text-[14px] font-medium text-gray-700">
            {(product.rating ?? 4).toFixed(1)}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="text-[23px] font-bold text-[#16a34a]">
            {formatUGX(product.price)}
          </div>
          {product.oldPrice ? (
            <div className="text-[14px] text-gray-400 line-through">
              {formatUGX(product.oldPrice)}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductsByCategorySlug(slug);
  if (!data) {
    return {
      title: "Category not found",
      robots: { index: false, follow: false },
    };
  }

  const title = `${data.title} in Uganda — Buy ${data.title} Online | Best Prices, Free Delivery Kampala`;
  const description =
    (data.description?.replace(/\s+/g, " ").trim().slice(0, 160)) ||
    `Shop ${data.products.length} ${data.title} online in Uganda at ${SITE_NAME}. Genuine products, best prices in UGX, pay on delivery, fast delivery in Kampala, Wakiso, Entebbe, Jinja & Mbarara.`;
  const canonical = `/category/${data.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    keywords: buildCategoryKeywords(data.title, data.rootCategory),
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: data.image ? [{ url: data.image, alt: data.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: data.image ? [data.image] : undefined,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [categoryData, frontendData] = await Promise.all([
    getProductsByCategorySlug(slug),
    readFrontendData().then((d) => d ?? mergeFrontendData({})),
  ]);

  // If the category doesn't exist in the API yet, show a friendly empty page
  // rather than a hard 404 — the slug may exist once the backend is seeded.
  if (!categoryData) {
    const label = slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const { default: NavBar } = await import("@/components/NavBar");
    const { default: Footer } = await import("@/components/Footer");
    return (
      <>
        <NavBar initialData={frontendData} />
        <main className="min-h-screen bg-[#f7f7f7]">
          <section className="mx-auto w-[98%] max-w-[1400px] px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-gray-900">{label}</h1>
            <p className="mt-4 text-gray-500">
              No products have been added to this category yet. Check back soon!
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-full bg-[#114f8f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0d3c6d]"
            >
              Back to home
            </Link>
          </section>
          <Footer />
        </main>
      </>
    );
  }

  const suggestions = await getSearchSuggestionsByCategory(categoryData.categoryId);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryData.title,
        item: absoluteUrl(`/category/${categoryData.slug}`),
      },
    ],
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: categoryData.title,
    numberOfItems: categoryData.products.length,
    itemListElement: categoryData.products.slice(0, 30).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(p.href),
      name: p.name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(itemListLd) }}
      />
      <NavBar
        searchSuggestions={suggestions}
        searchContextLabel={categoryData.title}
        initialData={frontendData}
      />
      <main className="min-h-screen bg-[#f7f7f7]">
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto w-[98%] max-w-[1400px] px-4 py-8">
            <div className="mb-4 text-[13px] text-gray-500">
              <Link href="/" className="hover:text-[#0b63ce] hover:underline">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-700">{categoryData.title}</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div>
                <h1 className="text-[24px] sm:text-[34px] font-bold tracking-tight text-gray-900">
                  {categoryData.title}
                </h1>
                <p className="mt-3 max-w-[760px] text-[15px] leading-7 text-gray-600">
                  {categoryData.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="#products"
                    className="rounded-full bg-[#114f8f] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#0d3c6d]"
                  >
                    Browse products
                  </Link>
                  <Link
                    href="/"
                    className="rounded-full border border-gray-300 bg-white px-5 py-3 text-[14px] font-semibold text-gray-900 hover:border-gray-400"
                  >
                    Continue shopping
                  </Link>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-gray-50">
                <SafeImage
                  src={categoryData.image}
                  alt={categoryData.title}
                  width={800}
                  height={260}
                  priority
                  sizes="(max-width:768px) 100vw, 50vw"
                  className="h-[180px] sm:h-[260px] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="products" className="mx-auto w-[98%] max-w-[1400px] px-4 py-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-[24px] font-bold text-gray-900">Available Items</h2>
              <p className="mt-1 text-[14px] text-gray-600">
                {categoryData.products.length} item{categoryData.products.length === 1 ? "" : "s"} in this collection
              </p>
            </div>
          </div>

          {categoryData.subCategories && categoryData.subCategories.length > 0 ? (
            <div className="space-y-12">
              {categoryData.subCategories.map((sub: CategorySubCategory) => (
                <div key={sub.id}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-[20px] font-bold text-gray-900">{sub.name}</h3>
                    <Link
                      href={`/category/${sub.slug}`}
                      className="text-[13px] font-semibold text-[#0b63ce] hover:underline"
                    >
                      See all in {sub.name}
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sub.products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              ))}
              {categoryData.products.filter(
                (p) => !(categoryData.subCategories ?? []).some((s: CategorySubCategory) =>
                  s.products.some((sp) => sp.id === p.id)
                )
              ).length > 0 && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-[20px] font-bold text-gray-900">Other {categoryData.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categoryData.products
                      .filter(
                        (p) => !(categoryData.subCategories ?? []).some((s: CategorySubCategory) =>
                          s.products.some((sp) => sp.id === p.id)
                        )
                      )
                      .map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categoryData.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
