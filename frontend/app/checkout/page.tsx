"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import {
  cartSubtotal,
  clearCart,
  readCart,
  type CartItem,
} from "@/lib/cart";
import { getCurrentUser, isLoggedIn, updateCurrentUser } from "@/lib/auth";
import { placeOrder, type StorefrontOrder } from "@/lib/orders";
import { useFrontendData } from "@/lib/use-frontend-data";

export default function CheckoutPage() {
  const { data } = useFrontendData();
  const [items, setItems] = useState<CartItem[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Uganda");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"delivery" | "pickup">("delivery");
  const [selectedPickupId, setSelectedPickupId] = useState("");
  const [placed, setPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<StorefrontOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");

  const pickupLocations = useMemo(
    () => (data.pickupLocations || []).filter((location) => location.isActive),
    [data.pickupLocations]
  );

  const selectedPickupLocation = useMemo(
    () => pickupLocations.find((location) => location.id === selectedPickupId) || pickupLocations[0] || null,
    [pickupLocations, selectedPickupId]
  );

  useEffect(() => {
    if (!isLoggedIn()) {
      window.dispatchEvent(
        new CustomEvent("auth:modal-open", {
          detail: { redirect: "/checkout", mode: "login" },
        })
      );
      return;
    }

    const user = getCurrentUser();
    const cartItems = readCart();
    setItems(cartItems);
    setFullName(user?.fullName || "");
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
    setAddress(user?.address || "");
    setCity(user?.city || "");
    setCountry(user?.country || "Uganda");
  }, []);

  useEffect(() => {
    if (!selectedPickupId && pickupLocations[0]) {
      setSelectedPickupId(pickupLocations[0].id);
    }
  }, [pickupLocations, selectedPickupId]);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const shipping = items.length > 0 ? (fulfillmentMethod === "pickup" ? 0 : 15000) : 0;
  const total = subtotal + shipping;

  if (!isLoggedIn()) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <NavBar />
      <section className="mx-auto w-[98%] max-w-[1400px] px-4 py-8">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.18em] text-[#0b63ce]">Checkout</p>
          <h1 className="mt-2 text-xl sm:text-3xl font-semibold text-[#111827]">Complete your order</h1>
        </div>

        {items.length === 0 && !placed ? (
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-8 text-center shadow-sm">
            <p className="text-[#6b7280]">Your cart is empty.</p>
            <Link href="/cart" className="mt-4 inline-flex rounded-xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white">
              Return to cart
            </Link>
          </div>
        ) : placed ? (
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-[#111827]">Order placed</h2>
            <p className="mt-3 text-sm text-[#6b7280]">
              {fulfillmentMethod === "pickup" && selectedPickupLocation
                ? `Your order has been placed successfully. Pickup is set for ${selectedPickupLocation.title}, ${selectedPickupLocation.city}.`
                : "Your checkout has been completed successfully. We will contact you using your saved details."}
            </p>
            {placedOrder ? (
              <p className="mt-3 text-sm font-semibold text-[#111827]">
                Order number: {placedOrder.number}
              </p>
            ) : null}
            <div className="mt-6 flex gap-3">
              <Link href="/" className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white">
                Continue shopping
              </Link>
              <Link href="/user" className="rounded-xl border border-[#d1d5db] bg-white px-5 py-3 text-sm font-semibold text-[#111827]">
                Go to account
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-6 lg:grid lg:grid-cols-[1fr_360px]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[#111827]">How would you like to receive this order?</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <label className="flex items-start gap-3 rounded-2xl border border-[#e5e7eb] px-4 py-4">
                    <input
                      type="radio"
                      name="fulfillment_method"
                      checked={fulfillmentMethod === "delivery"}
                      onChange={() => setFulfillmentMethod("delivery")}
                    />
                    <div>
                      <div className="text-sm font-medium text-[#111827]">Delivery</div>
                      <div className="mt-1 text-sm text-[#6b7280]">
                        Ship directly to your saved delivery address.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-2xl border border-[#e5e7eb] px-4 py-4">
                    <input
                      type="radio"
                      name="fulfillment_method"
                      checked={fulfillmentMethod === "pickup"}
                      onChange={() => setFulfillmentMethod("pickup")}
                    />
                    <div>
                      <div className="text-sm font-medium text-[#111827]">Pickup location</div>
                      <div className="mt-1 text-sm text-[#6b7280]">
                        Collect from one of your registered pickup points.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[#111827]">
                  {fulfillmentMethod === "pickup" ? "Pickup details" : "Delivery details"}
                </h2>
                {fulfillmentMethod === "pickup" ? (
                  <div className="mt-5 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Full Name" value={fullName} onChange={setFullName} />
                      <Field label="Email" value={email} onChange={setEmail} type="email" />
                      <Field label="Phone" value={phone} onChange={setPhone} />
                    </div>

                    {pickupLocations.length > 0 ? (
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-[#374151]">
                          Select pickup location
                        </span>
                        <select
                          value={selectedPickupId}
                          onChange={(event) => setSelectedPickupId(event.target.value)}
                          className="h-11 w-full rounded-xl border border-[#d1d5db] px-4 text-[16px] text-[#111827] outline-none focus:border-[#0b63ce]"
                        >
                          {pickupLocations.map((location) => (
                            <option key={location.id} value={location.id}>
                              {location.title} - {location.city}, {location.state}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#d1d5db] bg-[#f9fafb] px-4 py-4 text-sm text-[#6b7280]">
                        No pickup locations are available yet.
                      </div>
                    )}

                    {selectedPickupLocation ? (
                      <div className="rounded-2xl bg-[#f8fafc] p-4 text-sm text-[#374151]">
                        <div className="font-semibold text-[#111827]">{selectedPickupLocation.title}</div>
                        <div className="mt-1">{selectedPickupLocation.addressLine1}</div>
                        {selectedPickupLocation.addressLine2 ? (
                          <div>{selectedPickupLocation.addressLine2}</div>
                        ) : null}
                        <div>
                          {selectedPickupLocation.city}, {selectedPickupLocation.state}
                        </div>
                        <div>{selectedPickupLocation.country}</div>
                        <div className="mt-2">{selectedPickupLocation.phone}</div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <Field label="Full Name" value={fullName} onChange={setFullName} />
                    <Field label="Email" value={email} onChange={setEmail} type="email" />
                    <Field label="Phone" value={phone} onChange={setPhone} />
                    <Field label="City" value={city} onChange={setCity} />
                    <div className="md:col-span-2">
                      <Field label="Address" value={address} onChange={setAddress} />
                    </div>
                    <Field label="Country" value={country} onChange={setCountry} />
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[#111827]">Payment method</h2>
                <div className="mt-5 grid gap-3">
                  {["Cash on Delivery", "MTN MoMo", "Airtel Money", "Card Payment"].map((method) => (
                    <label key={method} className="flex items-center gap-3 rounded-2xl border border-[#e5e7eb] px-4 py-4">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                      />
                      <span className="text-sm font-medium text-[#111827]">{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <aside className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-sm lg:h-fit lg:sticky lg:top-4">
              <h2 className="text-xl font-semibold text-[#111827]">Order summary</h2>
              <div className="mt-5 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                    <div>
                      <div className="font-medium text-[#111827]">{item.name}</div>
                      <div className="text-[#6b7280]">Qty {item.qty}</div>
                    </div>
                    <div className="font-semibold text-[#111827]">
                      UGX {(item.price * item.qty).toLocaleString("en-US")}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2 border-t border-[#e5e7eb] pt-4 text-sm">
                <SummaryRow label="Subtotal" value={`UGX ${subtotal.toLocaleString("en-US")}`} />
                <SummaryRow
                  label={fulfillmentMethod === "pickup" ? "Pickup" : "Shipping"}
                  value={
                    fulfillmentMethod === "pickup"
                      ? "Free"
                      : `UGX ${shipping.toLocaleString("en-US")}`
                  }
                />
                <SummaryRow label="Total" value={`UGX ${total.toLocaleString("en-US")}`} strong />
              </div>

              <button
                type="button"
                onClick={async () => {
                  setSubmitting(true);
                  setOrderError("");
                  try {
                    const order = await placeOrder({
                      customer: {
                        fullName,
                        email,
                        phone,
                        address: fulfillmentMethod === "pickup" ? selectedPickupLocation?.addressLine1 || address : address,
                        city: fulfillmentMethod === "pickup" ? selectedPickupLocation?.city || city : city,
                        country: fulfillmentMethod === "pickup" ? selectedPickupLocation?.country || country : country,
                      },
                      fulfillmentMethod,
                      paymentMethod,
                      pickupLocation: selectedPickupLocation ?? undefined,
                      items,
                      subtotal,
                      shipping,
                      total,
                    });

                    setPlacedOrder(order);
                    clearCart();
                    setItems([]);
                    setPlaced(true);
                  } catch (error) {
                    setOrderError(error instanceof Error ? error.message : "Failed to place order.");
                  } finally {
                    setSubmitting(false);
                  }

                  updateCurrentUser({
                    fullName,
                    email,
                    phone,
                    address: fulfillmentMethod === "pickup" ? selectedPickupLocation?.addressLine1 || address : address,
                    city: fulfillmentMethod === "pickup" ? selectedPickupLocation?.city || city : city,
                    country: fulfillmentMethod === "pickup" ? selectedPickupLocation?.country || country : country,
                  });
                }}
                disabled={submitting || (fulfillmentMethod === "pickup" && !selectedPickupLocation)}
                className="mt-6 w-full rounded-full bg-[#111827] px-4 py-3 text-sm font-semibold text-white hover:bg-black"
              >
                {submitting ? "Placing order..." : "Place order"}
              </button>

              {orderError ? (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {orderError}
                </p>
              ) : null}

              <Link href="/cart" className="mt-3 block text-center text-sm font-medium text-[#0b63ce] hover:underline">
                Back to cart
              </Link>
            </aside>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#374151]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-[#d1d5db] px-4 text-[16px] text-[#111827] outline-none focus:border-[#0b63ce]"
      />
    </label>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "font-semibold text-[#111827]" : "text-[#6b7280]"}>{label}</span>
      <span className={strong ? "font-semibold text-[#111827]" : "text-[#111827]"}>{value}</span>
    </div>
  );
}
