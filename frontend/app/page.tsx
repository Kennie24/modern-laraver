import type { Metadata } from "next";
import { mergeFrontendData } from "@/lib/frontend-data-merge";
import { readFrontendData } from "@/lib/site-settings";
import NavBar from "@/components/NavBar";
import HeroCarouselWithRightCards from "@/components/HeroCarouselWithRightCards";
import TrustBar from "@/components/TrustBar";
import DynamicCategorySection from "@/components/DynamicCategorySection";
import CategoryTilesSection from "@/components/CategoryTilesSection";
import LatestProductsSection from "@/components/LatestProductsSection";
import Footer from "@/components/Footer";
import { getLatestPublishedProducts } from "@/lib/products-admin";
import { getSparePartsCategoryFeature, getApplianceCategoryFeature, getArduinoCategoryFeature } from "@/lib/products-public";
import {
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  // Home page stays on the site-wide default title so Google shows the full
  // keyword-rich branded title for navigational queries.
  const title = DEFAULT_TITLE;
  const description = DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    keywords: DEFAULT_KEYWORDS,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      url: "/",
      type: "website",
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
    },
  };
}

export default async function Home() {
  const frontendData =
    (await readFrontendData().catch(() => null)) ?? mergeFrontendData({});
  const [latestProductsResult, sparePartsCategoryResult, applianceCategoryResult, arduinoCategoryResult] = await Promise.allSettled([
    getLatestPublishedProducts(10),
    getSparePartsCategoryFeature(),
    getApplianceCategoryFeature(),
    getArduinoCategoryFeature(),
  ]);
  const latestProducts = latestProductsResult.status === "fulfilled" ? latestProductsResult.value : [];
  const sparePartsCategory =
    sparePartsCategoryResult.status === "fulfilled" ? sparePartsCategoryResult.value : null;
  const applianceCategory =
    applianceCategoryResult.status === "fulfilled" ? applianceCategoryResult.value : null;
  const arduinoCategory =
    arduinoCategoryResult.status === "fulfilled" ? arduinoCategoryResult.value : null;
  const latestSection = frontendData.latestProducts;
  const products = latestProducts.length > 0 ? latestProducts : latestSection.products;

  const productSuggestions = latestProducts.map(p => ({
    id: p.id,
    title: p.name,
    image: p.image,
    href: p.href
  }));

  return (
    <main className="min-h-screen bg-white">
      <NavBar searchSuggestions={productSuggestions} initialData={frontendData} />
      <HeroCarouselWithRightCards initialData={frontendData} />
      <TrustBar />
      <CategoryTilesSection
        arduinoFeature={
          arduinoCategory
            ? {
                title: arduinoCategory.title,
                href: `/category/${arduinoCategory.slug}`,
                products: arduinoCategory.products.map((p) => ({
                  id: p.id,
                  name: p.name,
                  image: p.image,
                  href: p.href,
                })),
              }
            : undefined
        }
        sparePartsFeature={
          sparePartsCategory
            ? {
                title: sparePartsCategory.title,
                href: `/category/${sparePartsCategory.slug}`,
                products: sparePartsCategory.products.map((product) => ({
                  id: product.id,
                  name: product.name,
                  image: product.image,
                  href: product.href,
                })),
                featuredProducts: sparePartsCategory.products
                  .filter((product) => product.isFeatured)
                  .map((product) => ({
                    id: product.id,
                    name: product.name,
                    image: product.image,
                    href: product.href,
                  })),
              }
            : undefined
        }
        applianceFeature={
          applianceCategory
            ? {
                title: applianceCategory.title,
                href: `/category/${applianceCategory.slug}`,
                products: applianceCategory.products.map((product) => ({
                  id: product.id,
                  name: product.name,
                  image: product.image,
                  href: product.href,
                })),
              }
            : undefined
        }
      />
      <LatestProductsSection
        title={latestSection.title}
        ctaHref={latestSection.ctaHref}
        ctaLabel={latestSection.ctaLabel}
        products={products}
      />
      <Footer />
    </main>
  );
}
