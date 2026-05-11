"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import SafeImage from "@/components/SafeImage";
import FeaturedItemsSidebar from "@/components/FeaturedItemsSidebar";
import {
  CartItem,
  cartSubtotal,
  clearCart,
  readCart,
  removeFromCart,
  updateQty,
} from "@/lib/cart";
import { isLoggedIn } from "@/lib/auth";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(() => readCart());
  const router = useRouter();

  const refresh = () => setItems(readCart());

  useEffect(() => {
    window.addEventListener("cart:updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("cart:updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);

  return (
    <>
      <NavBar />
      <section className="w-full bg-white">
        <div className="mx-auto w-[98%] max-w-[1400px] px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shopping Cart</h1>
            {items.length > 0 ? (
              <button
                onClick={() => clearCart()}
                className="min-h-[44px] px-3 text-sm font-semibold text-[#0b63ce] hover:underline"
              >
                Clear cart
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-700">Your cart is empty.</p>
              <Link href="/" className="mt-3 inline-block text-[#0b63ce] hover:underline">
                Continue shopping
              </Link>
            </div>
          ) : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-[110px_minmax(0,1fr)]"
                  >
                    <Link href={item.href} className="block">
                      <SafeImage
                        src={item.image}
                        alt={item.name}
                        width={100}
                        height={100}
                        sizes="100px"
                        className="h-[100px] w-[100px] rounded-md object-cover"
                      />
                    </Link>
                    <div>
                      <Link href={item.href} className="font-semibold text-gray-900 hover:text-[#ff6a00]">
                        {item.name}
                      </Link>
                      <div className="mt-2 text-sm text-gray-700">
                        UGX {item.price.toLocaleString("en-US")}
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <select
                          value={item.qty}
                          onChange={(e) => updateQty(item.id, Number(e.target.value))}
                          className="rounded-md border border-gray-300 px-2 py-2 text-[16px] sm:text-sm min-h-[44px]"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <option key={n} value={n}>
                              Qty: {n}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="min-h-[44px] px-2 text-sm text-[#0b63ce] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <aside className="h-fit rounded-lg border border-gray-300 p-4">
                  <div className="text-sm text-gray-700">Subtotal</div>
                  <div className="text-3xl font-bold text-gray-900">
                    UGX {subtotal.toLocaleString("en-US")}
                  </div>
                  <button
                    onClick={() => {
                      if (isLoggedIn()) {
                        router.push("/checkout");
                        return;
                      }

                      window.dispatchEvent(
                        new CustomEvent("auth:modal-open", {
                          detail: { redirect: "/checkout", mode: "login" },
                        })
                      );
                    }}
                    className="mt-4 w-full rounded-full bg-[#ffd814] px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-[#f7ca00]"
                  >
                    Proceed to checkout
                  </button>
                </aside>
                <FeaturedItemsSidebar />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
