"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, SlidersHorizontal, Star, X } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import type { CategoryListingProduct, CategorySubCategory } from "@/lib/products-public";

type SortMode = "relevance" | "price-low" | "price-high" | "rating-high";

type CategoryProductsClientProps = {
  categoryTitle: string;
  categorySlug: string;
  searchTerm?: string;
  products: CategoryListingProduct[];
  subCategories?: CategorySubCategory[];
};

function formatUGX(value: number) {
  return `UGX ${value.toLocaleString("en-US")}`;
}

function ProductCard({ product }: { product: CategoryListingProduct }) {
  return (
    <article className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
      <Link
        href={product.href}
        className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-gray-50 p-3"
      >
        {product.discountPercent ? (
          <span className="absolute left-3 top-3 rounded-md bg-[#d62828] px-2 py-1 text-[12px] font-bold text-white">
            -{product.discountPercent}%
          </span>
        ) : null}
        <SafeImage
          src={product.image}
          alt={product.name}
          width={400}
          height={240}
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
          className="max-h-full max-w-full object-contain"
        />
      </Link>
      <div className="p-4">
        <Link
          href={product.href}
          className="line-clamp-2 text-[16px] font-semibold leading-6 text-gray-900 hover:text-[#0b63ce]"
        >
          {product.name}
        </Link>
        {(product.brand || product.color) ? (
          <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-gray-500">
            {product.brand ? <span>{product.brand}</span> : null}
            {product.color ? <span>{product.color}</span> : null}
          </div>
        ) : null}
        <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-gray-600">
          {product.shortDesc}
        </p>
        <div className="mt-3 flex items-center gap-2 text-[#f59e0b]">
          <Star size={15} className="fill-current" />
          <span className="text-[13px] font-medium text-gray-700">
            {(product.rating ?? 4).toFixed(1)}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <div className="text-[20px] font-bold text-[#16a34a]">
            {formatUGX(product.price)}
          </div>
          {product.oldPrice ? (
            <div className="text-[13px] text-gray-400 line-through">
              {formatUGX(product.oldPrice)}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function CategoryProductsClient({
  categoryTitle,
  categorySlug,
  searchTerm = "",
  products,
  subCategories = [],
}: CategoryProductsClientProps) {
  const maxProductPrice = Math.max(0, ...products.map((product) => product.price || 0));
  const [maxPrice, setMaxPrice] = useState(maxProductPrice);
  const [minRating, setMinRating] = useState(0);
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const [activeSubCategory, setActiveSubCategory] = useState("all");
  const [activeBrand, setActiveBrand] = useState("all");
  const [activeColor, setActiveColor] = useState("all");
  const [discountedOnly, setDiscountedOnly] = useState(false);
  const [minDiscount, setMinDiscount] = useState(0);

  const brands = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.brand).filter(Boolean) as string[]))
        .sort((a, b) => a.localeCompare(b)),
    [products]
  );

  const colors = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.color).filter(Boolean) as string[]))
        .sort((a, b) => a.localeCompare(b)),
    [products]
  );

  const maxDiscount = Math.max(
    0,
    ...products.map((product) => product.discountPercent || 0)
  );

  const subCategoryProductIds = useMemo(() => {
    const pairs = subCategories.map((sub) => [
      sub.id,
      new Set(sub.products.map((product) => product.id)),
    ] as const);
    return new Map(pairs);
  }, [subCategories]);

  const filteredProducts = useMemo(() => {
    const activeIds = subCategoryProductIds.get(activeSubCategory);
    const next = products.filter((product) => {
      if (activeIds && !activeIds.has(product.id)) return false;
      if (activeBrand !== "all" && product.brand !== activeBrand) return false;
      if (activeColor !== "all" && product.color !== activeColor) return false;
      if (discountedOnly && !product.discountPercent) return false;
      if ((product.discountPercent || 0) < minDiscount) return false;
      if ((product.price || 0) > maxPrice) return false;
      if ((product.rating ?? 0) < minRating) return false;
      return true;
    });

    return [...next].sort((a, b) => {
      if (sortMode === "price-low") return (a.price || 0) - (b.price || 0);
      if (sortMode === "price-high") return (b.price || 0) - (a.price || 0);
      if (sortMode === "rating-high") return (b.rating ?? 0) - (a.rating ?? 0);
      return 0;
    });
  }, [
    activeBrand,
    activeColor,
    activeSubCategory,
    discountedOnly,
    maxPrice,
    minDiscount,
    minRating,
    products,
    sortMode,
    subCategoryProductIds,
  ]);

  const resetFilters = () => {
    setMaxPrice(maxProductPrice);
    setMinRating(0);
    setSortMode("relevance");
    setActiveSubCategory("all");
    setActiveBrand("all");
    setActiveColor("all");
    setDiscountedOnly(false);
    setMinDiscount(0);
  };

  return (
    <section id="products" className="mx-auto w-[98%] max-w-[1400px] px-4 py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-gray-900">Available Items</h2>
          <p className="mt-1 text-[14px] text-gray-600">
            {searchTerm
              ? `${filteredProducts.length} result${filteredProducts.length === 1 ? "" : "s"} for "${searchTerm}"`
              : `${filteredProducts.length} of ${products.length} item${products.length === 1 ? "" : "s"} in this collection`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white p-2">
          <span className="inline-flex items-center gap-2 px-2 text-[13px] font-semibold text-gray-700">
            <ArrowDownUp size={15} />
            Sort
          </span>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-[13px] text-gray-800 outline-none focus:border-[#114f8f]"
          >
            <option value="relevance">Relevance</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating-high">Top Rated</option>
          </select>
          <select
            value={minRating}
            onChange={(event) => setMinRating(Number(event.target.value))}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-[13px] text-gray-800 outline-none focus:border-[#114f8f]"
          >
            <option value={0}>All ratings</option>
            <option value={4}>4 stars & up</option>
            <option value={3}>3 stars & up</option>
            <option value={2}>2 stars & up</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-md border border-gray-200 bg-white p-4 lg:sticky lg:top-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-[16px] font-bold text-gray-900">
              <SlidersHorizontal size={17} />
              Filters
            </h3>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[12px] font-semibold text-[#114f8f] hover:bg-blue-50"
            >
              <X size={14} />
              Reset
            </button>
          </div>

          {subCategories.length > 0 ? (
            <div className="border-t border-gray-100 py-4">
              <div className="mb-3 text-[13px] font-bold uppercase text-gray-500">
                Category
              </div>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-[14px] text-gray-700">
                  <input
                    type="radio"
                    name="subcategory"
                    checked={activeSubCategory === "all"}
                    onChange={() => setActiveSubCategory("all")}
                    className="h-4 w-4 accent-[#114f8f]"
                  />
                  All {categoryTitle}
                </label>
                {subCategories.map((sub) => (
                  <label
                    key={sub.id}
                    className="flex cursor-pointer items-center justify-between gap-2 text-[14px] text-gray-700"
                  >
                    <span className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="subcategory"
                        checked={activeSubCategory === sub.id}
                        onChange={() => setActiveSubCategory(sub.id)}
                        className="h-4 w-4 accent-[#114f8f]"
                      />
                      {sub.name}
                    </span>
                    <span className="text-[12px] text-gray-400">{sub.products.length}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {brands.length > 0 ? (
            <div className="border-t border-gray-100 py-4">
              <div className="mb-3 text-[13px] font-bold uppercase text-gray-500">
                Brand
              </div>
              <select
                value={activeBrand}
                onChange={(event) => setActiveBrand(event.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-[14px] text-gray-800 outline-none focus:border-[#114f8f]"
              >
                <option value="all">All brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {colors.length > 0 ? (
            <div className="border-t border-gray-100 py-4">
              <div className="mb-3 text-[13px] font-bold uppercase text-gray-500">
                Color
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveColor("all")}
                  className={`rounded-md border px-3 py-2 text-[13px] ${
                    activeColor === "all"
                      ? "border-[#114f8f] bg-blue-50 font-semibold text-[#114f8f]"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  All
                </button>
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setActiveColor(color)}
                    className={`rounded-md border px-3 py-2 text-[13px] ${
                      activeColor === color
                        ? "border-[#114f8f] bg-blue-50 font-semibold text-[#114f8f]"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-gray-100 py-4">
            <div className="mb-3 text-[13px] font-bold uppercase text-gray-500">
              Discounts
            </div>
            <label className="mb-4 flex cursor-pointer items-center gap-2 text-[14px] text-gray-700">
              <input
                type="checkbox"
                checked={discountedOnly}
                onChange={(event) => setDiscountedOnly(event.target.checked)}
                className="h-4 w-4 accent-[#114f8f]"
              />
              Discounted products only
            </label>
            <label className="text-[13px] font-semibold text-gray-600">
              Minimum discount
            </label>
            <input
              type="range"
              min={0}
              max={maxDiscount}
              value={minDiscount}
              onChange={(event) => setMinDiscount(Number(event.target.value))}
              disabled={maxDiscount === 0}
              className="mt-2 w-full accent-[#114f8f] disabled:opacity-40"
            />
            <div className="mt-2 flex justify-between text-[13px] text-gray-600">
              <span>0%</span>
              <span>{minDiscount}%+</span>
            </div>
          </div>

          <div className="border-t border-gray-100 py-4">
            <div className="mb-3 text-[13px] font-bold uppercase text-gray-500">
              Price
            </div>
            <input
              type="range"
              min={0}
              max={maxProductPrice}
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              className="w-full accent-[#114f8f]"
            />
            <div className="mt-2 flex justify-between text-[13px] text-gray-600">
              <span>UGX 0</span>
              <span>{formatUGX(maxPrice)}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 py-4">
            <div className="mb-3 text-[13px] font-bold uppercase text-gray-500">
              Rating
            </div>
            <div className="space-y-2">
              {[4, 3, 2].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setMinRating(rating)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[14px] ${
                    minRating === rating
                      ? "bg-blue-50 font-semibold text-[#114f8f]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Star size={15} className="fill-[#f59e0b] text-[#f59e0b]" />
                  {rating} stars & up
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          {filteredProducts.length === 0 ? (
            <div className="rounded-md border border-gray-200 bg-white px-5 py-10 text-center">
              <h3 className="text-[20px] font-bold text-gray-900">No matching products</h3>
              <p className="mt-2 text-[14px] text-gray-600">
                Try changing the filters or browse the full collection.
              </p>
              <Link
                href={`/category/${categorySlug}`}
                className="mt-5 inline-flex rounded-full bg-[#114f8f] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#0d3c6d]"
              >
                Show all items
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
