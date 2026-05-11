"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Check,
  Copy,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  PlayCircle,
  Share2,
  Star,
  Music2,
} from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { addToCart } from "@/lib/cart";
import { normalizeMediaUrl } from "@/lib/media";
import type { PublicProductPageData } from "@/lib/products-public";
import WishlistButton from "@/components/WishlistButton";
import { isLoggedIn } from "@/lib/auth";
import { recordRecentlyViewed } from "@/lib/recently-viewed";

type ProductDetailsClientProps = {
  product: PublicProductPageData;
  relatedPreview?: {
    title: string;
    image: string;
    href: string;
    price: string;
  };
};

function splitPriceLabel(priceLabel: string, currencyCode: string) {
  const numericPortion = priceLabel.replace(currencyCode, "").trim();
  const [major, minor] = numericPortion.split(".");

  return {
    major: major || "0",
    minor: minor ? `.${minor}` : "",
  };
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function ProductDetailsClient({
  product,
  relatedPreview,
}: ProductDetailsClientProps) {
  const router = useRouter();
  const initialVariant = product.variants.find((variant) => variant.isDefault) || product.variants[0];
  const initialImage = product.gallery[0];

  const [selectedImageId, setSelectedImageId] = useState(initialImage?.id || "");
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariant?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [zoomPosition, setZoomPosition] = useState<{ x: number; y: number } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState("");
  const shareRef = useRef<HTMLDivElement | null>(null);

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.id === selectedVariantId) || initialVariant,
    [initialVariant, product.variants, selectedVariantId]
  );
  const selectedImage =
    product.gallery.find((item) => item.id === selectedImageId) || initialImage;
  const priceParts = splitPriceLabel(
    selectedVariant?.priceLabel || `${product.currencyCode} 0`,
    product.currencyCode
  );
  const selectedImageUrl = selectedImage?.image || "";
  const productUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/product/${product.slug}`
      : `/product/${product.slug}`;
  const shareText = encodeURIComponent(`Check out ${product.name}`);
  const encodedProductUrl = encodeURIComponent(productUrl);
  const selectedCartItem = selectedVariant
    ? {
        id: selectedVariant.id,
        name: `${product.name} (${selectedVariant.label})`,
        price: selectedVariant.price,
        image: normalizeMediaUrl(selectedImage?.image || ""),
        href: `/product/${product.slug}`,
      }
    : null;

  // Record this product in recently-viewed list (localStorage).
  useEffect(() => {
    const image = normalizeMediaUrl(product.gallery[0]?.image || "");
    recordRecentlyViewed({
      id: product.id,
      name: product.name,
      image,
      href: `/product/${product.slug}`,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  useEffect(() => {
    if (!shareOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | globalThis.MouseEvent) => {
      if (!shareRef.current?.contains(event.target as Node)) {
        setShareOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown as EventListener);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown as EventListener);
    };
  }, [shareOpen]);

  useEffect(() => {
    if (!copiedMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setCopiedMessage(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [copiedMessage]);

  const handleZoomMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  };

  const copyShareLink = async (message = "Link copied") => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopiedMessage(message);
    } catch {
      setCopiedMessage("Unable to copy link");
    }
  };

  const handleBuyNow = () => {
    if (!selectedCartItem) {
      return;
    }

    addToCart(selectedCartItem, quantity);

    if (isLoggedIn()) {
      router.push("/checkout");
      return;
    }

    window.dispatchEvent(
      new CustomEvent("auth:modal-open", {
        detail: { redirect: "/checkout", mode: "login" },
      })
    );
  };

  const openNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name}`,
          url: productUrl,
        });
        setShareOpen(false);
        return;
      } catch {
        return;
      }
    }

    await copyShareLink();
    setShareOpen(false);
  };

  const shareActions = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedProductUrl}`,
      icon: <Facebook size={16} />,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedProductUrl}`,
      icon: <XLogoIcon className="h-4 w-4" />,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${shareText}%20${encodedProductUrl}`,
      icon: <WhatsAppLogoIcon className="h-4 w-4" />,
    },
    {
      label: "Email",
      href: `mailto:?subject=${shareText}&body=${shareText}%20${encodedProductUrl}`,
      icon: <Mail size={16} />,
    },
  ];

  return (
    <section className="w-full bg-white">
      <div className="mx-auto w-[98%] max-w-[1400px] px-4 py-6 lg:px-6">
        <div className="mb-4 text-[13px] text-gray-500">
          <Link href="/" className="hover:text-[#0b63ce] hover:underline">
            Home
          </Link>
          {product.category?.parent ? (
            <>
              <span className="mx-1">{">"}</span>
              <Link
                href={`/category/${product.category.parent.slug}`}
                className="hover:text-[#0b63ce] hover:underline"
              >
                {product.category.parent.name}
              </Link>
            </>
          ) : null}
          {product.category ? (
            <>
              <span className="mx-1">{">"}</span>
              <Link
                href={`/category/${product.category.slug}`}
                className="hover:text-[#0b63ce] hover:underline"
              >
                {product.category.name}
              </Link>
            </>
          ) : null}
          <span className="mx-1">{">"}</span>
          <span className="text-gray-700">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[520px_minmax(0,1fr)_290px]">
          <div className="xl:sticky xl:top-4 xl:self-start">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[76px_minmax(0,1fr)]">
              <div className="order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col md:overflow-visible">
                {product.gallery.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedImageId(item.id)}
                    className={`relative flex h-[72px] min-w-[72px] items-center justify-center overflow-hidden rounded-md border bg-white ${
                      selectedImage?.id === item.id
                        ? "border-[#007185] ring-2 ring-[#c8f3fa]"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <SafeImage
                      src={item.image}
                      alt={item.alt}
                      width={72}
                      height={72}
                      className="h-full w-full object-cover"
                    />
                    {item.isVideo ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <PlayCircle size={22} className="text-white" />
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="order-1 md:order-2">
                <div className="relative overflow-hidden rounded-xl bg-white">
                  <div ref={shareRef} className="absolute right-3 top-3 z-10">
                    <button
                      type="button"
                      onClick={() => setShareOpen((current) => !current)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      <Share2 size={18} />
                    </button>

                    {shareOpen ? (
                      <div className="absolute right-0 top-[calc(100%+8px)] w-[240px] rounded-[12px] border border-[#d5d9d9] bg-white p-3 shadow-[0_10px_30px_rgba(15,17,17,0.18)]">
                        <div className="text-[13px] font-bold text-[#0f1111]">Share this product</div>
                        <div className="mt-1 text-[12px] text-[#565959]">
                          Send this item to social media or copy the product link.
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {shareActions.map((action) => (
                            <a
                              key={action.label}
                              href={action.href}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-[8px] border border-[#e7e7e7] px-3 py-2 text-[13px] text-[#0f1111] transition hover:bg-[#f7fafa]"
                            >
                              {action.icon}
                              {action.label}
                            </a>
                          ))}

                          <button
                            type="button"
                            onClick={() => void copyShareLink("Instagram-ready link copied")}
                            className="inline-flex items-center gap-2 rounded-[8px] border border-[#e7e7e7] px-3 py-2 text-[13px] text-[#0f1111] transition hover:bg-[#f7fafa]"
                          >
                            <Instagram size={16} />
                            Instagram
                          </button>
                          <button
                            type="button"
                            onClick={() => void copyShareLink("TikTok-ready link copied")}
                            className="inline-flex items-center gap-2 rounded-[8px] border border-[#e7e7e7] px-3 py-2 text-[13px] text-[#0f1111] transition hover:bg-[#f7fafa]"
                          >
                            <Music2 size={16} />
                            TikTok
                          </button>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void copyShareLink()}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#d5d9d9] bg-white px-4 py-2 text-[13px] font-medium text-[#0f1111] hover:bg-[#f7fafa]"
                          >
                            <Copy size={15} />
                            Copy link
                          </button>
                          <button
                            type="button"
                            onClick={() => void openNativeShare()}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#fcd200] bg-[#ffd814] px-4 py-2 text-[13px] font-medium text-[#0f1111] hover:bg-[#f7ca00]"
                          >
                            <Share2 size={15} />
                            Share
                          </button>
                        </div>

                        {copiedMessage ? (
                          <div className="mt-2 text-[12px] font-medium text-[#007600]">
                            {copiedMessage}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div
                    onMouseMove={handleZoomMove}
                    onMouseLeave={() => setZoomPosition(null)}
                    className="group relative flex min-h-[280px] sm:min-h-[420px] xl:min-h-[520px] items-center justify-center overflow-hidden rounded-xl bg-[#fafafa] p-6"
                  >
                    <SafeImage
                      src={selectedImageUrl}
                      alt={selectedImage?.alt || product.name}
                      width={600}
                      height={600}
                      priority
                      sizes="(max-width:768px) 100vw, 50vw"
                      className={`max-h-[260px] sm:max-h-[400px] xl:max-h-[500px] w-auto max-w-full object-contain transition duration-200 ${
                        zoomPosition ? "opacity-0" : "opacity-100"
                      }`}
                    />

                    {selectedImageUrl ? (
                      <div
                        className={`absolute inset-0 hidden cursor-zoom-in bg-no-repeat lg:block ${
                          zoomPosition ? "opacity-100" : "opacity-0"
                        }`}
                        style={{
                          backgroundImage: `url("${selectedImageUrl}")`,
                          backgroundPosition: `${zoomPosition?.x ?? 50}% ${zoomPosition?.y ?? 50}%`,
                          backgroundSize: "220%",
                          transition: "opacity 160ms ease-out",
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-[28px] font-normal leading-snug text-gray-900">
              {product.name}
            </h1>

            <div className="mt-2">
              <Link href="#" className="text-[14px] text-[#0b63ce] hover:underline">
                {product.storeLabel}
              </Link>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px]">
              <div className="flex items-center gap-1 text-[#f59e0b]">
                <span>{product.rating.toFixed(1)}</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      className={
                        i < Math.round(product.rating)
                          ? "fill-[#f59e0b] text-[#f59e0b]"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
              </div>
              <span className="text-[#0b63ce]">{product.ratingsLabel}</span>
            </div>

            {product.bestsellerLabel || product.bestsellerCategory ? (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px]">
                {product.bestsellerLabel ? (
                  <span className="rounded bg-[#cc6600] px-2 py-1 font-bold text-white">
                    {product.bestsellerLabel}
                  </span>
                ) : null}
                {product.bestsellerCategory ? (
                  <span className="text-[#0b63ce]">{product.bestsellerCategory}</span>
                ) : null}
              </div>
            ) : null}

            {product.boughtLabel ? (
              <div className="mt-3 border-b border-gray-200 pb-3 text-[14px] text-gray-700">
                {product.boughtLabel}
              </div>
            ) : null}

            <div className="mt-4">
              <div className="flex items-start gap-1">
                <span className="mt-2 text-[14px] text-gray-700">{product.currencyCode}</span>
                <span className="text-[42px] leading-none text-gray-900">{priceParts.major}</span>
                <span className="mt-1 text-[22px] text-gray-900">{priceParts.minor}</span>
              </div>

              {selectedVariant?.oldPrice ? (
                <div className="mt-2 text-[14px] text-gray-500">
                  List: <span className="line-through">{selectedVariant.oldPrice}</span>
                </div>
              ) : null}

              <div className="mt-2 text-[14px] text-gray-700">
                <span className="font-medium">{product.shippingLabel}</span>{" "}
                <Link href="#" className="text-[#0b63ce] hover:underline">
                  Details
                </Link>
              </div>
            </div>

            {product.variants.length > 0 ? (
              <div className="mt-5">
                <div className="text-[14px] text-gray-700">
                  Option: <span className="font-semibold">{selectedVariant?.label}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  {product.variants.map((variant) => {
                    const active = selectedVariant?.id === variant.id;

                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={`min-w-[120px] rounded-md border px-3 py-2 text-left ${
                          active
                            ? "border-[#007185] bg-[#f0fdff] ring-2 ring-[#c8f3fa]"
                            : "border-gray-300 bg-white hover:border-gray-500"
                        }`}
                      >
                        <div className="text-[14px] font-semibold text-gray-900">
                          {variant.label}
                        </div>
                        <div className="mt-1 text-[13px] text-gray-900">
                          {variant.priceLabel}
                        </div>
                        <div className="text-[12px] text-gray-400 line-through">
                          {variant.oldPrice}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {product.specs.length > 0 ? (
              <div className="mt-6 grid max-w-[640px] grid-cols-[140px_minmax(0,1fr)] gap-y-2 text-[14px]">
                {product.specs.map((spec) => (
                  <div key={`${spec.label}-${spec.value}`} className="contents">
                    <div className="font-semibold text-gray-900">{spec.label}</div>
                    <div className="text-gray-700">{spec.value}</div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-6 border-t border-gray-200 pt-4">
              <h2 className="text-[24px] font-bold text-gray-900">About this item</h2>
              {product.aboutItems.length > 0 ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-6 text-gray-800">
                  {product.aboutItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <div
                  className="mt-3 text-[15px] leading-6 text-gray-800"
                  dangerouslySetInnerHTML={{
                    __html: product.shortDescription || product.description || "No product description available.",
                  }}
                />
              )}
            </div>

            {product.description ? (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h2 className="text-[24px] font-bold text-gray-900">Product Description</h2>
                <div
                  className="tinymce-content mt-3 text-[15px] leading-7 text-gray-800"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            ) : null}
          </div>

          <aside className="xl:sticky xl:top-4 xl:self-start">
            <div className="rounded-xl border border-gray-300 p-4">
              <div className="flex items-start gap-1">
                <span className="mt-2 text-[13px] text-gray-700">{product.currencyCode}</span>
                <span className="text-[38px] leading-none text-gray-900">{priceParts.major}</span>
                <span className="mt-1 text-[20px] text-gray-900">{priceParts.minor}</span>
              </div>

              <div className="mt-2 text-[14px] text-gray-700">
                <span className="font-medium">{product.shippingLabel}</span>{" "}
                <Link href="#" className="text-[#0b63ce] hover:underline">
                  Details
                </Link>
              </div>

              <div className="mt-1 text-[14px] text-gray-700">
                Delivery <span className="font-semibold">{product.deliveryLabel}</span>
              </div>

              <div className="mt-2 flex items-center gap-1 text-[13px] text-[#0b63ce]">
                <MapPin size={14} />
                <span>Deliver to your location</span>
              </div>

              <div className="mt-4 text-[24px] text-[#007600]">
                {selectedVariant && selectedVariant.stockQty > 0 ? product.inStockLabel : "Out of Stock"}
              </div>

              <div className="mt-3">
                <div className="relative">
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full appearance-none rounded-lg border border-gray-400 bg-[#f0f2f2] px-4 py-2 pr-10 text-[14px] text-gray-900 outline-none"
                  >
                    {Array.from({ length: 10 }).map((_, index) => (
                      <option key={index + 1} value={index + 1}>
                        Quantity: {index + 1}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                  />
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <button
                  onClick={() =>
                    selectedCartItem
                      ? addToCart(selectedCartItem, quantity)
                      : undefined
                  }
                  disabled={!selectedVariant || selectedVariant.stockQty < 1}
                  className="w-full rounded-full bg-[#ffd814] px-4 py-2.5 text-[14px] font-medium text-gray-900 hover:bg-[#f7ca00] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Add to cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!selectedVariant || selectedVariant.stockQty < 1}
                  className="w-full rounded-full bg-[#ffa41c] px-4 py-2.5 text-[14px] font-medium text-gray-900 hover:bg-[#fa8900] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Buy Now
                </button>
              </div>

              <div className="mt-4 grid grid-cols-[70px_minmax(0,1fr)] gap-y-2 text-[13px]">
                <div className="text-gray-600">Ships from</div>
                <div className="text-gray-900">{product.storeName}</div>

                <div className="text-gray-600">Sold by</div>
                <div className="text-gray-900">{product.storeName}</div>

                <div className="text-gray-600">Returns</div>
                <div className="text-gray-900">{product.returnsLabel}</div>

                <div className="text-gray-600">Payment</div>
                <div className="text-gray-900">{product.paymentLabel}</div>
              </div>

              <div className="mt-4 border-t border-gray-200 pt-4">
                <WishlistButton
                  item={{
                    id: selectedVariant?.id || product.id,
                    name: selectedVariant
                      ? `${product.name} (${selectedVariant.label})`
                      : product.name,
                    price: selectedVariant?.price || 0,
                    image: normalizeMediaUrl(selectedImage?.image || ""),
                    href: `/product/${product.slug}`,
                  }}
                  label="Add to List"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-400 bg-white px-4 py-2 text-[14px] text-gray-900 hover:bg-gray-50"
                />
              </div>
            </div>

            {relatedPreview ? (
              <div className="mt-4 rounded-xl border border-gray-300 p-3">
                <div className="flex items-center gap-3">
                  <SafeImage
                    src={relatedPreview.image}
                    alt={relatedPreview.title}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <div>
                    <Link href={relatedPreview.href} className="line-clamp-2 text-[14px] text-gray-900 hover:text-[#0b63ce]">
                      {relatedPreview.title}
                    </Link>
                    <div className="mt-2 text-[18px] font-medium text-gray-900">
                      {relatedPreview.price}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[13px] text-[#007185]">
                      <Check size={14} />
                      Explore related item
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}

function XLogoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 1227"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M714.2 519.3 1160.9 0H1055L667.1 450.9 357.5 0H0l468.5 681.8L0 1226.4h105.9l409.6-476.3 327 476.3H1200L714.2 519.3ZM569.2 687.8l-47.5-67.9L144 79.7h162.7l304.8 435.7 47.5 67.9 396.2 566.7H892.5L569.2 687.8Z" />
    </svg>
  );
}

function WhatsAppLogoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M19.11 17.21c-.28-.14-1.64-.81-1.89-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.19-.31.21-.59.07-.28-.14-1.16-.43-2.21-1.37-.81-.72-1.36-1.61-1.52-1.88-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.19-.29.28-.48.09-.19.05-.36-.02-.51-.07-.14-.61-1.48-.84-2.03-.22-.53-.44-.45-.61-.46l-.52-.01c-.18 0-.48.07-.73.34-.25.28-.96.94-.96 2.28 0 1.34.98 2.63 1.11 2.82.14.19 1.92 2.93 4.66 4.11.65.28 1.16.45 1.55.57.65.21 1.24.18 1.71.11.52-.08 1.64-.67 1.87-1.31.23-.64.23-1.19.16-1.31-.07-.12-.25-.19-.52-.33Z" />
      <path d="M16 3C8.82 3 3 8.73 3 15.79c0 2.26.6 4.47 1.74 6.42L3 29l7.03-1.82a13.1 13.1 0 0 0 5.97 1.43h.01c7.18 0 13-5.73 13-12.79C29 8.73 23.18 3 16 3Zm0 23.48h-.01c-1.92 0-3.81-.51-5.46-1.47l-.39-.23-4.17 1.08 1.11-4.03-.25-.41a10.56 10.56 0 0 1-1.61-5.63c0-5.89 4.85-10.68 10.8-10.68 2.88 0 5.58 1.11 7.62 3.13a10.54 10.54 0 0 1 3.16 7.55c0 5.89-4.85 10.68-10.8 10.68Z" />
    </svg>
  );
}
