"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Package, Heart, MapPin, ShieldCheck, CreditCard, UserRound, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { getCurrentUser, isLoggedIn } from "@/lib/auth";
import { cartCount } from "@/lib/cart";
import { fetchOrders, type StorefrontOrder } from "@/lib/orders";
import { readWishlist } from "@/lib/wishlist";

type AccountTile = {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: React.ReactNode;
};

export default function UserPage() {
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [bagCount, setBagCount] = useState(0);
  const [userName, setUserName] = useState("Customer");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orders, setOrders] = useState<StorefrontOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const user = getCurrentUser();
      setMounted(true);
      setLoggedIn(isLoggedIn());
      setWishlistCount(readWishlist().length);
      setBagCount(cartCount());
      setUserName(user?.fullName || "Customer");
      setPhone(user?.phone || "");
      setAddress([user?.address, user?.city, user?.country].filter(Boolean).join(", "));
    };

    sync();
    window.addEventListener("auth:updated", sync);
    window.addEventListener("cart:updated", sync);
    window.addEventListener("wishlist:updated", sync);
    window.addEventListener("orders:updated", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("auth:updated", sync);
      window.removeEventListener("cart:updated", sync);
      window.removeEventListener("wishlist:updated", sync);
      window.removeEventListener("orders:updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      setOrders([]);
      return;
    }

    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError("");

    fetchOrders()
      .then((nextOrders) => {
        if (!cancelled) setOrders(nextOrders);
      })
      .catch((error) => {
        if (!cancelled) {
          setOrdersError(error instanceof Error ? error.message : "Failed to load orders.");
        }
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  const firstName = useMemo(() => userName.split(" ")[0] || "Customer", [userName]);
  const initials = useMemo(
    () =>
      userName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "CU",
    [userName]
  );

  const accountTiles: AccountTile[] = [
    {
      title: "Your Orders",
      description: `${orders.length} order${orders.length === 1 ? "" : "s"} saved to your account.`,
      href: "/user",
      cta: "View orders",
      icon: <Package className="h-6 w-6 text-[#111827]" />,
    },
    {
      title: "Login & Security",
      description: "Manage your phone number, profile details, and account preferences.",
      href: "/profile",
      cta: "Edit profile",
      icon: <ShieldCheck className="h-6 w-6 text-[#111827]" />,
    },
    {
      title: "Your Addresses",
      description: address || "Add a delivery address for faster checkout and easier reorders.",
      href: "/profile",
      cta: "Manage addresses",
      icon: <MapPin className="h-6 w-6 text-[#111827]" />,
    },
    {
      title: "Payment Options",
      description: "Review supported payment methods and prepare for checkout.",
      href: "/checkout",
      cta: "Checkout settings",
      icon: <CreditCard className="h-6 w-6 text-[#111827]" />,
    },
    {
      title: "Wishlist",
      description: `${wishlistCount} saved item${wishlistCount === 1 ? "" : "s"} ready for later.`,
      href: "/wishlist",
      cta: "Open wishlist",
      icon: <Heart className="h-6 w-6 text-[#111827]" />,
    },
    {
      title: "Your Cart",
      description: `${bagCount} item${bagCount === 1 ? "" : "s"} currently in your basket.`,
      href: "/cart",
      cta: "Go to cart",
      icon: <UserRound className="h-6 w-6 text-[#111827]" />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#eaeded]">
      <NavBar />

      <section className="border-b border-[#d5d9d9] bg-white">
        <div className="mx-auto flex w-[98%] max-w-[1400px] items-center justify-between gap-4 px-4 py-6">
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#565959]">
              Your Account
            </div>
            <h1 className="mt-2 text-[22px] sm:text-[30px] font-normal leading-none text-[#0f1111]">
              {mounted && loggedIn ? `Hello, ${firstName}` : "Your Account"}
            </h1>
            <p className="mt-3 max-w-[760px] text-[14px] leading-6 text-[#565959]">
              Orders, recommendations, profile details, saved items, and checkout shortcuts in one place.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <Link
              href="/profile"
              className="inline-flex h-[38px] items-center justify-center rounded-full border border-[#d5d9d9] bg-white px-5 text-[14px] text-[#0f1111] shadow-[0_1px_2px_rgba(15,17,17,0.08)] hover:bg-[#f7fafa]"
            >
              Edit profile
            </Link>
            <Link
              href="/"
              className="inline-flex h-[38px] items-center justify-center rounded-full border border-[#fcd200] bg-[#ffd814] px-5 text-[14px] font-medium text-[#0f1111] shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)] hover:bg-[#f7ca00]"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-[98%] max-w-[1400px] px-4 py-6">
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[8px] border border-[#d5d9d9] bg-white p-5 shadow-[0_1px_2px_rgba(15,17,17,0.08)]">
            <div className="flex items-center gap-4">
              <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#232f3e] text-[20px] font-bold text-white">
                {initials}
              </div>
              <div>
                <div className="text-[20px] font-bold leading-6 text-[#0f1111]">{userName}</div>
                <div className="mt-1 text-[13px] text-[#565959]">{phone || "Add your phone number"}</div>
              </div>
            </div>

            <div className="mt-6 rounded-[8px] border border-[#e7e7e7] bg-[#f7fafa] p-4">
              <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#565959]">
                Account snapshot
              </div>
              <div className="mt-4 space-y-3 text-[14px]">
                <SnapshotRow label="Cart items" value={`${bagCount}`} />
                <SnapshotRow label="Wishlist" value={`${wishlistCount}`} />
                <SnapshotRow label="Primary address" value={address || "Not set"} />
              </div>
            </div>

            <nav className="mt-6 space-y-2">
              <AccountNavLink href="/user" label="Your account" active />
              <AccountNavLink href="/profile" label="Login & security" />
              <AccountNavLink href="/wishlist" label="Your wishlist" />
              <AccountNavLink href="/cart" label="Your cart" />
              <AccountNavLink href="/checkout" label="Checkout" />
            </nav>
          </aside>

          <div className="space-y-6">
            <section className="rounded-[8px] border border-[#d5d9d9] bg-white p-5 shadow-[0_1px_2px_rgba(15,17,17,0.08)]">
              <h2 className="text-[28px] font-normal leading-none text-[#0f1111]">Your Account</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {accountTiles.map((tile) => (
                  <Link
                    key={tile.title}
                    href={tile.href}
                    className="group rounded-[8px] border border-[#d5d9d9] bg-white p-5 transition hover:border-[#c7c7c7] hover:bg-[#fcfcfc]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f7fafa]">
                        {tile.icon}
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#565959]" />
                    </div>
                    <div className="mt-4 text-[18px] font-bold leading-6 text-[#0f1111]">{tile.title}</div>
                    <p className="mt-2 min-h-[60px] text-[14px] leading-5 text-[#565959]">
                      {tile.description}
                    </p>
                    <div className="mt-4 inline-flex h-[31px] items-center justify-center rounded-full bg-[#ffd814] px-4 text-[13px] font-medium text-[#0f1111] shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)] group-hover:bg-[#f7ca00]">
                      {tile.cta}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
              <div className="rounded-[8px] border border-[#d5d9d9] bg-white p-5 shadow-[0_1px_2px_rgba(15,17,17,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[24px] font-normal leading-none text-[#0f1111]">Your Orders</h2>
                    <p className="mt-2 text-[14px] text-[#565959]">
                      Keep track of recent purchases and reorder common items faster.
                    </p>
                  </div>
                  <Link href="/" className="text-[14px] font-medium text-[#007185] hover:underline">
                    Buy again
                  </Link>
                </div>

                <div className="mt-5 space-y-3">
                  {ordersLoading ? (
                    <div className="rounded-[8px] border border-[#e7e7e7] px-4 py-8 text-center text-[14px] text-[#565959]">Loading your orders…</div>
                  ) : ordersError ? (
                    <div className="rounded-[8px] border border-[#fcd0d0] bg-[#fff5f5] px-4 py-6 text-center">
                      <p className="text-[14px] font-semibold text-[#b12704]">Could not load orders</p>
                      <p className="mt-1 text-[13px] text-[#565959]">{ordersError}</p>
                      <button
                        onClick={() => setOrdersError("") || setOrdersLoading(true)}
                        className="mt-3 inline-flex rounded-full bg-[#ffd814] px-4 py-2 text-[13px] font-medium text-[#0f1111]"
                      >Retry</button>
                    </div>
                  ) : orders.length > 0 ? (
                    orders.map((order) => (
                      <div key={order.id} className="overflow-hidden rounded-[8px] border border-[#d5d9d9] bg-white shadow-[0_1px_2px_rgba(15,17,17,0.06)]">
                        {/* Order header row */}
                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-[#f7fafa]"
                        >
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="text-[13px] font-bold text-[#0f1111]">{order.number}</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                              order.status === "delivered" ? "bg-[#e6f4ea] text-[#1e7e34]"
                              : order.status === "cancelled" ? "bg-[#fce8e6] text-[#b12704]"
                              : order.status === "shipped" || order.status === "processing" ? "bg-[#e8f0fe] text-[#1a56db]"
                              : "bg-[#fef9e7] text-[#856404]"
                            }`}>{formatStatus(order.status)}</span>
                            <span className="text-[13px] text-[#565959]">{formatDate(order.placedAt)}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-[14px] font-bold text-[#0f1111]">UGX {order.total.toLocaleString("en-US")}</span>
                            {expandedOrderId === order.id
                              ? <ChevronUp className="h-4 w-4 text-[#565959]" />
                              : <ChevronDown className="h-4 w-4 text-[#565959]" />}
                          </div>
                        </button>

                        {/* Expanded order details */}
                        {expandedOrderId === order.id && (
                          <div className="border-t border-[#e7e7e7] px-4 py-4">
                            <div className="space-y-3">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-start gap-3">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="h-14 w-14 shrink-0 rounded-[6px] border border-[#e7e7e7] object-cover" />
                                  ) : (
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[6px] border border-[#e7e7e7] bg-[#f7fafa]">
                                      <Package className="h-5 w-5 text-[#c7c7c7]" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    {item.href ? (
                                      <Link href={item.href} className="line-clamp-2 text-[14px] font-medium text-[#0f1111] hover:text-[#007185] hover:underline">{item.name}</Link>
                                    ) : (
                                      <p className="line-clamp-2 text-[14px] font-medium text-[#0f1111]">{item.name}</p>
                                    )}
                                    <p className="mt-0.5 text-[13px] text-[#565959]">Qty: {item.quantity} &nbsp;·&nbsp; UGX {item.unitPrice.toLocaleString("en-US")}</p>
                                  </div>
                                  <div className="shrink-0 text-[14px] font-bold text-[#0f1111]">
                                    UGX {item.lineTotal.toLocaleString("en-US")}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e7e7e7] pt-4 text-[13px] text-[#565959]">
                              <div className="space-y-0.5">
                                <div>Payment: <span className="font-medium text-[#0f1111]">{order.paymentMethod}</span></div>
                                <div>Shipping: <span className="font-medium text-[#0f1111]">UGX {order.shipping.toLocaleString("en-US")}</span></div>
                              </div>
                              <Link href="/" className="inline-flex rounded-full bg-[#ffd814] px-4 py-2 text-[13px] font-medium text-[#0f1111] hover:bg-[#f7ca00]">
                                Buy again
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[8px] border border-[#e7e7e7] px-4 py-10 text-center">
                      <div className="text-[15px] font-bold text-[#0f1111]">No orders yet</div>
                      <p className="mt-2 text-[14px] text-[#565959]">Orders you place at checkout will show here.</p>
                      <Link href="/" className="mt-4 inline-flex rounded-full bg-[#ffd814] px-4 py-2 text-[13px] font-medium text-[#0f1111]">
                        Start shopping
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <section className="rounded-[8px] border border-[#d5d9d9] bg-white p-5 shadow-[0_1px_2px_rgba(15,17,17,0.08)]">
                  <h2 className="text-[24px] font-normal leading-none text-[#0f1111]">Account details</h2>
                  <div className="mt-4 space-y-3 text-[14px]">
                    <InfoLine label="Name" value={userName} />
                    <InfoLine label="Phone" value={phone || "Not set"} />
                    <InfoLine label="Address" value={address || "Add an address in profile"} />
                  </div>
                  <Link
                    href="/profile"
                    className="mt-5 inline-flex h-[31px] items-center justify-center rounded-full bg-[#ffd814] px-4 text-[13px] font-medium text-[#0f1111] shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)] hover:bg-[#f7ca00]"
                  >
                    Update profile
                  </Link>
                </section>

                <section className="rounded-[8px] border border-[#d5d9d9] bg-white p-5 shadow-[0_1px_2px_rgba(15,17,17,0.08)]">
                  <h2 className="text-[24px] font-normal leading-none text-[#0f1111]">Buying shortcuts</h2>
                  <div className="mt-4 space-y-3">
                    <ShortcutLink href="/wishlist" label="Open your wishlist" />
                    <ShortcutLink href="/cart" label="Review cart before checkout" />
                    <ShortcutLink href="/checkout" label="Go to checkout" />
                    <ShortcutLink href="/" label="Shop latest products" />
                  </div>
                </section>
              </div>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function formatDate(value: string) {
  if (!value) return "recently";
  return new Intl.DateTimeFormat("en-UG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[#565959]">{label}</span>
      <span className="max-w-[1500px] text-right font-medium text-[#0f1111]">{value}</span>
    </div>
  );
}

function AccountNavLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-[8px] px-4 py-3 text-[14px] transition ${
        active
          ? "border border-[#d5d9d9] bg-[#f7fafa] font-medium text-[#0f1111]"
          : "text-[#0f1111] hover:bg-[#f7fafa]"
      }`}
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 text-[#565959]" />
    </Link>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#e7e7e7] bg-[#f7fafa] px-4 py-3">
      <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#565959]">{label}</div>
      <div className="mt-1 text-[14px] text-[#0f1111]">{value}</div>
    </div>
  );
}

function ShortcutLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-[8px] border border-[#e7e7e7] px-4 py-3 text-[14px] text-[#0f1111] transition hover:bg-[#f7fafa]"
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 text-[#565959]" />
    </Link>
  );
}
