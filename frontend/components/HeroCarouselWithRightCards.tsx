"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { useFrontendData } from "@/lib/use-frontend-data";
import type { FrontendData } from "@/lib/frontend-data";

export default function HeroCarouselWithRightCards({ initialData }: { initialData?: FrontendData }) {
  const { data } = useFrontendData(initialData);
  const slides = data.hero.slides;
  const rightCards = data.hero.sideCards;
  const featuredOffers = data.offers.filter((offer) => offer.isActive && offer.isFeatured);
  const activeOffers = data.offers.filter((offer) => offer.isActive && !offer.isFeatured);
  const heroOffers = [...featuredOffers, ...activeOffers].slice(0, 2);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = slides.length;
  const activeIndex = total > 0 ? active % total : 0;

  const go = (idx: number) => {
    if (!total) return;
    const next = (idx + total) % total;
    setActive(next);
  };

  useEffect(() => {
    if (!total) return;
    if (paused) return;
    const t = setInterval(() => {
      setActive((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(t);
  }, [paused, total]);

  if (!slides.length && !rightCards.length && !heroOffers.length) {
    return null;
  }

  return (
    <section className="w-full bg-white">
      <div className="mx-auto w-[98%] px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div
            className="col-span-12 h-full overflow-hidden rounded-none border border-gray-200 shadow-sm lg:col-span-8"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative h-full">
              <div
                className="flex h-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {slides.map((s) => (
                  <div key={s.id} className="relative h-full min-w-full">
                    {(() => {
                      const slideHref = getSafeHref(s.ctaHref);

                      return (
                    <div className="relative h-full min-h-[360px]">
                      <SafeImage
                        src={s.image}
                        alt="Carousel background"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/25" />

                      <div className="relative z-[1] flex h-full min-h-[360px] flex-col justify-end p-7 md:p-8">
                        <div className="max-w-[640px]">
                          <h2 className="font-display text-[30px] font-bold leading-tight text-white md:text-[42px]">
                            {s.title}
                          </h2>
                          <p className="mt-3 max-w-[560px] text-[15px] leading-6 text-white/85 md:text-[17px]">
                            {s.description}
                          </p>
                        </div>

                        <div className="mt-9 flex items-center gap-3">
                          {slideHref ? (
                            <Link
                              href={slideHref}
                              className="font-display inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white px-5 py-3 text-[14px] font-bold text-gray-900 shadow-sm hover:border-white hover:bg-gray-100"
                              aria-label="Go to slide action"
                            >
                              {s.ctaLabel || "Shop now"}
                              <ArrowRight size={18} />
                            </Link>
                          ) : null}
                        </div>

                        <div className="mt-8 flex items-center gap-3">
                          {slides.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => go(i)}
                              className={[
                                "h-2.5 rounded-full transition-all",
                                i === activeIndex
                                  ? "w-7 bg-[#ff6a00]"
                                  : "w-5 bg-white/70 hover:bg-white",
                              ].join(" ")}
                              aria-label={`Go to slide ${i + 1}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="absolute bottom-6 right-6 z-[2] hidden rounded-xl bg-white/90 p-3 shadow-sm backdrop-blur md:block">
                        <BadgeCheck size={16} className="text-[#f59e0b]" />
                      </div>
                    </div>
                      );
                    })()}
                  </div>
                ))}
              </div>

              <div className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm md:flex">
                <button
                  onClick={() => go(active + 1)}
                  className="flex h-12 w-12 items-center justify-center hover:bg-gray-50"
                  aria-label="Next slide"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="h-px w-full bg-gray-200" />
                <button
                  onClick={() => go(active - 1)}
                  className="flex h-12 w-12 items-center justify-center hover:bg-gray-50"
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>

              <div className="absolute bottom-6 right-6 z-10 flex gap-2 md:hidden">
                <button
                  onClick={() => go(active - 1)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm active:scale-[0.98]"
                  aria-label="Previous slide"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  onClick={() => go(active + 1)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm active:scale-[0.98]"
                  aria-label="Next slide"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
            {heroOffers.length > 0
              ? heroOffers.map((offer, index) => {
                  const hasTargetImage = (offer.targetType === "product" || offer.targetType === "category") && offer.targetImage;

                  if (hasTargetImage) {
                    return (
                      <Link
                        key={offer.id}
                        href={getOfferHref(offer)}
                        className="group relative overflow-hidden rounded-none border border-[#d7dde5] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                      >
                        <div className="grid min-h-[190px] grid-cols-12 gap-0 sm:min-h-[210px]">
                          <div className="col-span-12 flex items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#eef3f8_100%)] p-4 sm:col-span-5">
                            <SafeImage
                              src={offer.targetImage}
                              alt={offer.targetTitle || offer.title}
                              className="h-[130px] w-full max-w-[200px] object-contain transition-transform duration-300 group-hover:scale-[1.04] sm:h-[155px]"
                            />
                          </div>

                          <div className="col-span-12 flex flex-col justify-between p-4 sm:col-span-7 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="rounded-full bg-[#cc0c39] px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white">
                                {offer.badgeText || `Offer ${index + 1}`}
                              </div>
                              <div className="rounded-full bg-[#fff7ed] px-3 py-1 text-[12px] font-bold text-[#c2410c]">
                                {formatOfferValue(offer)}
                              </div>
                            </div>

                            <div className="mt-4">
                              <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#6b7280]">
                                {formatOfferTarget(offer)}
                              </div>
                              <div className="font-display mt-2 line-clamp-2 text-[18px] font-bold leading-tight text-[#111827] sm:text-[21px]">
                                {offer.headline || offer.targetTitle || offer.title}
                              </div>
                              <p className="mt-3 line-clamp-3 text-[13px] leading-5 text-[#4b5563]">
                                {offer.description || "Shop the latest deal now before it expires."}
                              </p>
                            </div>

                            <div className="mt-5 flex items-center justify-end gap-3">
                              <div className="font-display inline-flex w-fit items-center gap-1.5 rounded-full bg-[#ffd814] px-3 py-1.5 text-[12px] font-bold text-[#111827] shadow-sm transition group-hover:bg-[#f7ca00]">
                                {offer.targetType === "product" ? "View product" : "Shop now"}
                                <ArrowRight size={14} className="text-[#111827]" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[#f6c400]" />
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={offer.id}
                      href={getOfferHref(offer)}
                      className="group relative overflow-hidden rounded-none border border-[#d7dde5] bg-[linear-gradient(135deg,#f8fafc_0%,#f1f5f9_100%)] shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                    >
                      {offer.bannerImage ? (
                        <>
                          <SafeImage
                            src={offer.bannerImage}
                            alt={offer.title}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-white/10" />
                        </>
                      ) : null}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,23,42,0.02),transparent_36%)]" />
                      <div className="relative flex min-h-[190px] flex-col justify-between gap-3 p-4 sm:min-h-[210px] sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-gray-500 backdrop-blur-sm">
                            {offer.badgeText || `Offer ${index + 1}`}
                          </div>
                          <div className="rounded-full border border-gray-200 bg-white/10 px-3 py-1 text-[12px] font-bold text-gray-700 backdrop-blur-sm">
                            {formatOfferValue(offer)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#114f8f]">
                            {formatOfferTarget(offer)}
                          </div>
                          <div className="font-display mt-3 line-clamp-2 text-[20px] font-bold leading-tight text-gray-900 sm:text-[23px]">
                            {offer.headline || offer.title}
                          </div>
                          <p className="mt-3 line-clamp-3 max-w-[420px] text-[13px] leading-5 text-gray-600">
                            {offer.description || "Shop the latest deal now before it expires."}
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                          <div className="font-display inline-flex w-fit items-center gap-1.5 rounded-full bg-[#ffd814] px-3 py-1.5 text-[12px] font-bold text-[#111827] shadow-sm transition group-hover:bg-[#f7ca00]">
                            Shop offer
                            <ArrowRight size={14} className="text-[#111827]" />
                          </div>
                        </div>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[#f6c400]" />
                    </Link>
                  );
                })
              : rightCards.map((c) => (
                  <Link
                    key={c.id}
                    href={getSafeHref(c.href) ?? "/category/all"}
                    className="group relative overflow-hidden rounded-none border border-[#d7dde5] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                  >
                    <div className="grid min-h-[190px] grid-cols-12 gap-3 p-3.5 sm:min-h-[210px] sm:p-5">
                      <div className="col-span-12 flex items-center justify-center rounded-none bg-[linear-gradient(180deg,#f8fafc_0%,#eef3f8_100%)] sm:col-span-5">
                        <SafeImage
                          src={c.image}
                          alt={c.title}
                          className="h-[120px] w-full max-w-[200px] rounded-[14px] object-cover shadow-sm transition-transform duration-300 group-hover:scale-[1.03] sm:h-[110px] sm:w-[150px]"
                        />
                      </div>

                      <div className="col-span-12 flex flex-col justify-center sm:col-span-7">
                        <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                          {c.eyebrow}
                        </div>
                        <div className="font-display mt-2 line-clamp-2 text-[18px] font-bold leading-tight tracking-[-0.02em] text-gray-900 sm:text-[21px]">
                          {c.title}
                        </div>

                        <div className="font-display mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#ffd814] px-3 py-1.5 text-[12px] font-bold text-[#111827] shadow-sm transition group-hover:bg-[#f7ca00]">
                          Shop deals
                          <ArrowRight size={14} className="text-[#111827]" />
                        </div>
                      </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 h-[3px] bg-transparent transition-colors duration-300 group-hover:bg-[#f6c400]" />
                  </Link>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function getSafeHref(value: unknown) {
  if (typeof value !== "string") return null;

  const href = value.trim();
  if (!href) return null;

  return normalizeLegacyHref(href);
}

function normalizeLegacyHref(href: string) {
  const [path, query = ""] = href.split("?");
  const suffix = query ? `?${query}` : "";

  const aliases: Record<string, string> = {
    "/products": "/category/all",
    "/tv-parts": "/category/spare-parts",
    "/tools": "/category/spare-parts",
    "/featured": "/category/home-appliances",
    "/wholesale": "/category/accessories",
    "/accessories": "/category/accessories",
    "/blog": "/contact",
  };

  return `${aliases[path] ?? path}${suffix}`;
}

function getOfferHref(offer: {
  code: string;
  targetType: string;
  targetValue: string;
}) {
  if (offer.targetType === "category" && offer.targetValue) {
    return `/category/${offer.targetValue}`;
  }

  if (offer.targetType === "product" && offer.targetValue) {
    return `/product/${offer.targetValue}`;
  }

  if (offer.targetType === "pickup") {
    return "/checkout";
  }

  return offer.code ? `/category/all?offer=${encodeURIComponent(offer.code)}` : "/category/all";
}

function formatOfferValue(offer: {
  discountType: string;
  discountValue: number;
}) {
  if (offer.discountType === "free_shipping") return "Free shipping";
  if (offer.discountType === "fixed") return `UGX ${offer.discountValue} off`;
  return `${offer.discountValue}% off`;
}

function formatOfferTarget(offer: { targetType: string }) {
  if (offer.targetType === "storewide") return "Storewide offer";
  if (offer.targetType === "category") return "Category deal";
  if (offer.targetType === "product") return "Product deal";
  return "Pickup special";
}
