import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import SafeImage from "@/components/SafeImage";
import CategoryProductsClient from "@/components/CategoryProductsClient";
import { readFrontendData } from "@/lib/site-settings";
import { mergeFrontendData } from "@/lib/frontend-data-merge";
import {
  getProductsByCategorySlug,
  getSearchSuggestionsByCategory,
  searchPublicProducts,
} from "@/lib/products-public";
import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  buildCategoryKeywords,
  jsonLdString,
} from "@/lib/seo";

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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ search?: string }>;
}) {
  const { slug } = await params;
  const searchTerm = ((await searchParams)?.search ?? "").trim();
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

  const [suggestions, backendSearchResults] = await Promise.all([
    getSearchSuggestionsByCategory(categoryData.categoryId),
    searchTerm ? searchPublicProducts(searchTerm, 30) : Promise.resolve([]),
  ]);
  const normalizedSearchTerm = searchTerm.toLowerCase();
  const locallyMatchedProducts = normalizedSearchTerm
    ? categoryData.products.filter((product) =>
        [product.name, product.shortDesc, product.href]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearchTerm)
      )
    : categoryData.products;
  const visibleProducts = normalizedSearchTerm
    ? Array.from(
        new Map(
          [...backendSearchResults, ...locallyMatchedProducts].map((product) => [
            product.id,
            product,
          ])
        ).values()
      )
    : locallyMatchedProducts;
  const visibleProductIds = new Set(visibleProducts.map((product) => product.id));
  const visibleSubCategories = categoryData.subCategories
    ?.map((sub) => ({
      ...sub,
      products: sub.products.filter((product) => visibleProductIds.has(product.id)),
    }))
    .filter((sub) => sub.products.length > 0);

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

        <CategoryProductsClient
          categoryTitle={categoryData.title}
          categorySlug={categoryData.slug}
          searchTerm={searchTerm}
          products={visibleProducts}
          subCategories={visibleSubCategories}
        />
      </main>
    </>
  );
}
