/**
 * Server-side public product helpers — fetch from the Laravel API.
 */
import { apiFetch, ADMIN_API_TOKEN } from "@/lib/api";
import type { ProductSpec, RelatedProduct } from "@/lib/frontend-data";

// ─── shared types ─────────────────────────────────────────────

export type PublicProductVariant = {
  id: string;
  label: string;
  price: number;
  priceLabel: string;
  oldPrice?: string;
  stockQty: number;
  sku?: string;
  isDefault: boolean;
};

export type PublicProductGalleryItem = {
  id: string;
  image: string;
  alt: string;
  isVideo?: boolean;
};

export type PublicProductPageData = {
  id: string;
  categoryId?: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  brand?: string;
  currencyCode: string;
  storeName: string;
  storeLabel: string;
  rating: number;
  ratingsLabel: string;
  bestsellerLabel?: string;
  bestsellerCategory?: string;
  boughtLabel?: string;
  shippingLabel: string;
  inStockLabel: string;
  deliveryLabel: string;
  returnsLabel: string;
  paymentLabel: string;
  category?: {
    name: string;
    slug: string;
    parent?: { name: string; slug: string };
  };
  gallery: PublicProductGalleryItem[];
  variants: PublicProductVariant[];
  specs: ProductSpec[];
  aboutItems: string[];
};

export type FeaturedSidebarProduct = {
  id: string;
  title: string;
  image: string;
  href: string;
  rating: number;
  reviews: string;
  currencyCode: string;
  priceWhole: string;
  priceDecimal: string;
  extraPrice?: string;
  shipping: string;
  delivery?: string;
  price: number;
};

export type PublicOfferTargetProduct = {
  id: string;
  slug: string;
  title: string;
  image: string;
  shortDescription: string;
  href: string;
};

export type CategoryListingProduct = {
  id: string;
  name: string;
  image: string;
  href: string;
  shortDesc: string;
  price: number;
  rating?: number;
  oldPrice?: number;
};

// ─── functions ────────────────────────────────────────────────

export async function getPublicProductBySlug(
  slug: string
): Promise<PublicProductPageData | null> {
  try {
    const data = await apiFetch<{ product: PublicProductPageData }>(
      `/products/${encodeURIComponent(slug)}`
    );
    return data.product ?? null;
  } catch {
    return null;
  }
}

export async function getRelatedProductsForProduct(
  productId: string,
  _categoryId?: string | null,
  _limit = 8
): Promise<RelatedProduct[]> {
  try {
    // We look up the slug first from the product list — or pass slug directly.
    // The backend route is /products/{slug}/related.
    // Since we only have the ID here, we'll hit the admin route to get the slug.
    const detail = await apiFetch<{ product: { slug: string } }>(
      `/admin/products/${productId}`
    ).catch(() => null);

    if (!detail?.product?.slug) return [];

    const data = await apiFetch<{ products: RelatedProduct[] }>(
      `/products/${encodeURIComponent(detail.product.slug)}/related`
    );
    return data.products ?? [];
  } catch {
    return [];
  }
}

export async function getFeaturedSidebarProducts(
  limit = 5
): Promise<FeaturedSidebarProduct[]> {
  try {
    const data = await apiFetch<{ products: FeaturedSidebarProduct[] }>(
      `/products/featured`
    );
    return (data.products ?? []).slice(0, limit);
  } catch {
    return [];
  }
}

export async function getOfferTargetProductsBySlugs(
  slugs: string[]
): Promise<PublicOfferTargetProduct[]> {
  const unique = Array.from(new Set(slugs.filter(Boolean)));
  if (!unique.length) return [];

  const params = unique.map((s) => `slugs[]=${encodeURIComponent(s)}`).join("&");

  try {
    const data = await apiFetch<{ products: PublicOfferTargetProduct[] }>(
      `/products/offer-targets?${params}`
    );
    return data.products ?? [];
  } catch {
    return [];
  }
}

export type CategorySubCategory = {
  id: string;
  name: string;
  slug: string;
  image: string;
  products: CategoryListingProduct[];
};

type CategoryListingData = {
  categoryId: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  rootCategory: string;
  products: CategoryListingProduct[];
  subCategories?: CategorySubCategory[];
};

type FrontendCategory = {
  title: string;
  slug: string;
  rootCategory?: string;
  isActive: boolean;
};

// Sub-categories that belong under the "spare-parts" umbrella.
// When no parent category exists in the DB we aggregate products from each of
// these slugs directly and synthesise a CategoryListingData response.
const SPARE_PARTS_SUB_SLUGS = [
  "transistors",
  "cables-adapters",
  "cables-and-adapters",
  "arduino-kits",
  "arduino",
  "microcontrollers",
  "computer-accessories",
  "batteries-accessories",
  "batteries-and-accessories",
  "electronics-lab-tools",
  "lab-tools",
];

export async function getProductsByCategorySlug(slug: string, tiles = false) {
  const data = await fetchCategoryListing(slug, tiles);
  if (data) return data;

  const alias = await resolveCategorySlugAlias(slug);
  if (alias && alias !== slug) {
    const aliasData = await fetchCategoryListing(alias, tiles);
    if (aliasData) return aliasData;
  }

  // Last-resort aggregation for spare-parts: fetch every known sub-category
  // and merge them into a synthetic parent category response.
  const norm = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (norm.includes("spare") || norm.includes("parts") || norm.includes("component")) {
    return aggregateSparePartsCategoryData(tiles);
  }

  return null;
}

async function aggregateSparePartsCategoryData(tiles = false): Promise<CategoryListingData | null> {
  // Fetch all known sub-slugs in parallel, discard nulls.
  const results = await Promise.all(
    SPARE_PARTS_SUB_SLUGS.map((s) => fetchCategoryListing(s, tiles))
  );

  const found = results.filter((r): r is CategoryListingData => r !== null);

  if (found.length === 0) {
    // Try a broader search: look for any active category whose title matches.
    const all = await getFrontendCategories();
    const patterns = [
      /transistor/i, /cable/i, /arduino/i, /microcontroller/i,
      /computer accessor/i, /batter/i, /lab tool/i,
    ];
    const matchedSlugs = all
      .filter((c) => c.isActive !== false && patterns.some((p) => p.test(c.title)))
      .map((c) => c.slug);

    if (matchedSlugs.length === 0) return null;

    const broader = await Promise.all(matchedSlugs.map((s) => fetchCategoryListing(s, tiles)));
    found.push(...broader.filter((r): r is CategoryListingData => r !== null));

    if (found.length === 0) return null;
  }

  // Build synthetic subCategories array (one entry per sub-slug that returned data).
  const seen = new Set<string>();
  const subCategories: CategorySubCategory[] = [];
  const allProducts: CategoryListingData["products"] = [];

  for (const cat of found) {
    // Merge the sub's direct products into the flat list.
    for (const p of cat.products) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        allProducts.push(p);
      }
    }
    // Add sub-categories from the sub (if backend already expanded them).
    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        for (const p of sub.products) {
          if (!seen.has(p.id)) {
            seen.add(p.id);
            allProducts.push(p);
          }
        }
      }
    }
    subCategories.push({
      id: cat.categoryId,
      name: cat.title,
      slug: cat.slug,
      image: cat.image,
      products: cat.products,
    });
  }

  return {
    categoryId: "spare-parts",
    slug: "spare-parts",
    title: "Spare Parts & Components",
    description:
      "Transistors, cables, Arduino kits, microcontrollers, computer accessories, batteries, and lab tools — everything you need for electronics projects and repairs.",
    image: found[0]?.image ?? "",
    rootCategory: "",
    products: allProducts,
    subCategories,
  };
}

async function fetchCategoryListing(slug: string, tiles = false): Promise<CategoryListingData | null> {
  try {
    const qs = tiles ? "?tiles=1" : "";
    const data = await apiFetch<CategoryListingData>(`/categories/${encodeURIComponent(slug)}/products${qs}`);
    return data;
  } catch {
    return null;
  }
}

async function resolveCategorySlugAlias(slug: string): Promise<string | null> {
  const categories = await getFrontendCategories();
  const candidates = categorySlugCandidates(slug);
  const normalized = normalizeCategoryText(slug);
  const activeCategories = categories.filter((category) => category.isActive !== false && category.slug);

  const exactMatch = activeCategories.find((category) =>
    candidates.includes(category.slug) ||
    candidates.includes(slugify(category.title))
  );

  if (exactMatch) return exactMatch.slug;

  // spare-parts / tv-parts / components aliases
  if (
    normalized.includes("spare") ||
    normalized.includes("parts") ||
    normalized.includes("component")
  ) {
    const spareMatch = activeCategories.find((category) => {
      const haystack = normalizeCategoryText([
        category.title,
        category.slug,
        category.rootCategory ?? "",
      ].join(" "));
      return (
        haystack.includes("spare") ||
        haystack.includes("parts") ||
        haystack.includes("component") ||
        haystack.includes("repair")
      );
    });
    if (spareMatch) return spareMatch.slug;

    for (const alias of ["spare-parts", "tv-spare-parts", "tv-parts", "components", "spare", "parts"]) {
      const data = await fetchCategoryListing(alias);
      if (data) return data.slug || alias;
    }
  }

  if (normalized.includes("appliance")) {
    const applianceMatch = activeCategories.find((category) => {
      const haystack = normalizeCategoryText([
        category.title,
        category.slug,
        category.rootCategory ?? "",
      ].join(" "));

      return haystack.includes("appliance") ||
        haystack.includes("home good") ||
        haystack.includes("household") ||
        haystack.includes("kitchen");
    });

    if (applianceMatch) return applianceMatch.slug;

    for (const alias of ["home-appliances", "home-appliance", "appliances", "appliance"]) {
      const data = await fetchCategoryListing(alias);
      if (data) return data.slug || alias;
    }
  }

  return null;
}

async function getFrontendCategories(): Promise<FrontendCategory[]> {
  try {
    const data = await apiFetch<{
      categories?: FrontendCategory[];
      data?: { categories?: FrontendCategory[] };
    }>(`/frontend-data`);

    return data.data?.categories ?? data.categories ?? [];
  } catch {
    return [];
  }
}

function categorySlugCandidates(slug: string): string[] {
  const normalized = slugify(slug);
  const candidates = [slug, normalized];
  const segments = normalized.split("-").filter(Boolean);
  const lastSegment = segments.pop();

  if (lastSegment) {
    const roots = segments.join("-");
    const singular = lastSegment.endsWith("s") ? lastSegment.slice(0, -1) : lastSegment;
    const plural = singular.endsWith("s") ? singular : `${singular}s`;

    for (const suffix of [singular, plural]) {
      candidates.push(roots ? `${roots}-${suffix}` : suffix);
    }
  }

  if (normalized.includes("appliance")) {
    candidates.push(
      "large-appliance",
      "large-appliances",
      "home-appliance",
      "home-appliances",
      "appliance",
      "appliances"
    );
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCategoryText(value: string) {
  return value.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

export async function getSearchSuggestionsByCategory(
  categoryId: string,
  limit = 8
): Promise<{ id: string; title: string; image: string; href: string }[]> {
  try {
    const data = await apiFetch<{ products: { id: string; name: string; image: string; href: string }[] }>(
      `/categories/by-id/${categoryId}/products`
    );
    return (data.products ?? []).slice(0, limit).map((p) => ({
      id: p.id, title: p.name, image: p.image, href: p.href,
    }));
  } catch {
    return [];
  }
}

export async function getSameCategoryProductsForSearch(
  _productId: string,
  _categoryId?: string | null,
  _limit = 8
): Promise<{ id: string; title: string; image: string; href: string }[]> {
  return [];
}

export async function getFrequentlyViewedProducts(
  productId: string,
  categoryId?: string | null,
  limit = 8
): Promise<RelatedProduct[]> {
  return getRelatedProductsForProduct(productId, categoryId, limit);
}

// ─── home "featured category" loaders ─────────────────────────
//
// These populate the 3 cards under the hero (CategoryTilesSection).
// We locate a matching category by title/slug via the public frontend-data
// endpoint, then load its products through /categories/{slug}/products.

type FeatureCategory = {
  title: string;
  slug: string;
  products: {
    id: string;
    name: string;
    image: string;
    href: string;
    price: number;
    isFeatured?: boolean;
  }[];
};

async function findFirstActiveCategoryBy(
  predicates: ((c: {
    title: string;
    slug: string;
    rootCategory?: string;
    isActive: boolean;
  }) => boolean)[]
): Promise<{ title: string; slug: string } | null> {
  try {
    const list = await getFrontendCategories();

    const activeCategories = list.filter((c) => c.isActive !== false && c.slug);
    for (const predicate of predicates) {
      const hit = activeCategories.find(predicate);
      if (hit) return { title: hit.title, slug: hit.slug };
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function loadCategoryFeatureByCandidates(
  predicates: ((c: {
    title: string;
    slug: string;
    rootCategory?: string;
    isActive: boolean;
  }) => boolean)[]
): Promise<FeatureCategory | null> {
  const match = await findFirstActiveCategoryBy(predicates);
  if (!match) return null;

  const data = await getProductsByCategorySlug(match.slug, true);
  if (!data || !data.products?.length) return null;

  return {
    title: data.title || match.title,
    slug: data.slug || match.slug,
    products: data.products.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      href: p.href,
      price: p.price,
      // CategoryListingProduct doesn't include isFeatured; leave undefined so
      // the UI falls back to the regular product list.
    })),
  };
}

/**
 * Fetch products from the admin endpoint and filter by category slug or name.
 * Used as a last resort when the public /categories/{slug}/products returns
 * empty (e.g. because products have no price set and are filtered out).
 */
async function getProductsFromAdminByCategoryMatch(
  slugKeywords: string[],
  nameKeywords: string[]
): Promise<FeatureCategory | null> {
  try {
    const data = await apiFetch<{
      products: Array<{
        id: string;
        name: string;
        image: string;
        slug: string;
        category: string;
        price: number;
        isPublished: boolean;
      }>;
    }>("/admin/products", { token: ADMIN_API_TOKEN || null });

    const all = data.products ?? [];

    // Match by category name or slug keywords (case-insensitive)
    const matched = all.filter((p) => {
      if (!p.isPublished) return false;
      const cat = (p.category ?? "").toLowerCase();
      return (
        slugKeywords.some((k) => cat.includes(k.toLowerCase())) ||
        nameKeywords.some((k) => cat.includes(k.toLowerCase()))
      );
    });

    const withImages = matched.filter((p) => p.image);
    if (!withImages.length) return null;

    const catName = withImages[0].category || "Spare parts and Components";
    return {
      title: catName,
      slug: slugKeywords[0],
      products: withImages.map((p) => ({
        id: p.id,
        name: p.name,
        image: p.image,
        href: `/product/${p.slug}`,
        price: p.price,
      })),
    };
  } catch {
    return null;
  }
}

export async function getSparePartsCategoryFeature(): Promise<FeatureCategory | null> {
  // 1. Try canonical slugs directly — pass tiles=true to bypass price filter.
  const directSlugs = [
    "spare-parts", "tv-spare-parts", "tv-parts", "spare-parts-components",
    "components", "spare", "parts",
  ];
  for (const slug of directSlugs) {
    const data = await getProductsByCategorySlug(slug, true);
    if (data?.products && data.products.filter((p) => p.image).length > 0) {
      return {
        title: data.title || "Spare parts and Components",
        slug: data.slug || slug,
        products: data.products
          .filter((p) => p.image)
          .map((p) => ({ id: p.id, name: p.name, image: p.image, href: p.href, price: p.price })),
      };
    }
  }

  // 2. Pattern-match against the live category list.
  const lc = (s?: string) => (s ?? "").toLowerCase();
  const patternMatch = await loadCategoryFeatureByCandidates([
    (c) => /spare\s*parts?/i.test(c.title) || /spare[-_]?parts?/i.test(c.slug),
    (c) => /tv\s*parts?/i.test(c.title) || /tv[-_]?parts?/i.test(c.slug),
    (c) => /parts?/i.test(c.title) || /parts?/.test(lc(c.slug)),
    (c) => lc(c.rootCategory).includes("spare") || lc(c.rootCategory).includes("parts"),
    (c) => /component|board|panel|module|circuit|capacitor|resistor/i.test(c.title),
  ]);
  if (patternMatch) return patternMatch;

  // 3. Try admin endpoint — bypasses the public price > 0 filter entirely.
  const adminMatch = await getProductsFromAdminByCategoryMatch(
    ["spare-parts", "spare_parts", "tv-parts", "components"],
    ["spare parts", "tv parts", "spare", "parts", "component"]
  );
  if (adminMatch) return adminMatch;

  // No spare-parts category found — return null so the card shows empty state
  // rather than showing products from a completely unrelated category.
  return null;
}

export async function getArduinoCategoryFeature(): Promise<FeatureCategory | null> {
  // Try canonical slugs first.
  const directSlugs = ["arduino-kits", "arduino", "arduino-kit"];
  for (const slug of directSlugs) {
    const data = await getProductsByCategorySlug(slug, true);
    if (data?.products && data.products.filter((p) => p.image).length > 0) {
      return {
        title: data.title || "Arduino Kits",
        slug: data.slug || slug,
        products: data.products
          .filter((p) => p.image)
          .map((p) => ({ id: p.id, name: p.name, image: p.image, href: p.href, price: p.price })),
      };
    }
  }

  // Pattern-match against the live category list.
  const patternMatch = await loadCategoryFeatureByCandidates([
    (c) => /arduino/i.test(c.title) || /arduino/.test(c.slug.toLowerCase()),
  ]);
  if (patternMatch) return patternMatch;

  // Admin fallback.
  const adminMatch = await getProductsFromAdminByCategoryMatch(
    ["arduino-kits", "arduino"],
    ["arduino", "arduino kit"]
  );
  return adminMatch;
}

export async function getApplianceCategoryFeature(): Promise<FeatureCategory | null> {
  // Try the canonical slug directly first, then fall back to pattern matching.
  const directSlugs = ["home-appliances", "home-appliance", "appliances", "appliance"];
  for (const slug of directSlugs) {
    const data = await getProductsByCategorySlug(slug, true);
    if (data?.products?.length) {
      return {
        title: data.title || "Home Appliances",
        slug: data.slug || slug,
        products: data.products.map((p) => ({
          id: p.id,
          name: p.name,
          image: p.image,
          href: p.href,
          price: p.price,
        })),
      };
    }
  }

  // Fallback: scan all active categories for appliance-related names.
  const lc = (s?: string) => (s ?? "").toLowerCase();
  const patternMatch = await loadCategoryFeatureByCandidates([
    (c) => /appliance/i.test(c.title) || /appliance/.test(lc(c.slug)),
    (c) => lc(c.rootCategory).includes("appliance"),
    (c) => /home/i.test(c.title) && /good|ware|appliance/i.test(c.title),
    (c) => /household|kitchen|refrigerat|washing|microwave|freezer|cooker|blender|iron|fan/i.test(c.title),
  ]);
  if (patternMatch) return patternMatch;

  // Try admin endpoint — bypasses the price > 0 filter.
  const adminMatch = await getProductsFromAdminByCategoryMatch(
    ["home-appliances", "appliances", "appliance"],
    ["appliance", "home appliance", "refrigerator", "washing", "kitchen"]
  );
  if (adminMatch) return adminMatch;

  // Last resort: try every active category that has products with images.
  try {
    const allCategories = await getFrontendCategories();
    const active = allCategories.filter((c) => c.isActive !== false && c.slug);
    for (const cat of active) {
      const data = await getProductsByCategorySlug(cat.slug);
      if (data?.products && data.products.filter((p) => p.image).length > 0) {
        return {
          title: data.title || cat.title,
          slug: data.slug || cat.slug,
          products: data.products
            .filter((p) => p.image)
            .map((p) => ({ id: p.id, name: p.name, image: p.image, href: p.href, price: p.price })),
        };
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}
