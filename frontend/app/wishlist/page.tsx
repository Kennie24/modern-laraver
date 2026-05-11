"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import SafeImage from "@/components/SafeImage";
import { addToCart } from "@/lib/cart";
import {
  clearWishlist,
  readWishlist,
  removeFromWishlist,
  type WishlistItem,
} from "@/lib/wishlist";

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>(() => readWishlist());

  useEffect(() => {
    const sync = () => setItems(readWishlist());
    window.addEventListener("wishlist:updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("wishlist:updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  );

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <NavBar />
      <section className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-3xl font-semibold text-[#111827]">Wishlist</h1>
            <p className="mt-2 text-sm text-[#6b7280]">
              Save products here and move them into your cart when you are ready.
            </p>
          </div>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => clearWishlist()}
              className="min-h-[44px] px-2 text-sm font-semibold text-[#0b63ce] hover:underline"
            >
              Clear wishlist
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-[#6b7280]">
              Your saved products will appear here once you start adding them.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/" className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white">
                Browse products
              </Link>
              <Link href="/user" className="rounded-xl border border-[#d1d5db] bg-white px-5 py-3 text-sm font-semibold text-[#111827]">
                Back to account
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm sm:grid-cols-[110px_minmax(0,1fr)]"
                >
                  <Link href={item.href}>
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      width={100}
                      height={100}
                      sizes="100px"
                      className="h-[100px] w-[100px] rounded-xl object-cover"
                    />
                  </Link>
                  <div className="flex flex-col gap-3">
                    <div>
                      <Link href={item.href} className="text-lg font-semibold text-[#111827] hover:text-[#0b63ce]">
                        {item.name}
                      </Link>
                      <div className="mt-1 text-sm text-[#4b5563]">
                        UGX {item.price.toLocaleString("en-US")}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        className="min-h-[44px] rounded-full bg-[#ffd814] px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#f7ca00]"
                      >
                        Add to cart
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item.id)}
                        className="min-h-[44px] rounded-full border border-[#d1d5db] bg-white px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <div className="text-sm text-[#6b7280]">Saved items</div>
              <div className="mt-1 text-3xl font-bold text-[#111827]">{items.length}</div>
              <div className="mt-5 text-sm text-[#6b7280]">Estimated value</div>
              <div className="mt-1 text-2xl font-bold text-[#111827]">
                UGX {totalValue.toLocaleString("en-US")}
              </div>
              <button
                type="button"
                onClick={() => items.forEach((item) => addToCart(item))}
                className="mt-5 w-full rounded-full bg-[#111827] px-4 py-3 text-sm font-semibold text-white hover:bg-black"
              >
                Add all to cart
              </button>
            </aside>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
