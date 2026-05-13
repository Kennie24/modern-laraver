"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Heart,
  Home,
  Info,
  Mail,
  Menu,
  MessageSquare,
  Search,
  ShoppingBag,
  User,
  ChevronRight,
  X,
} from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { getCurrentUser, isLoggedIn, logout } from "@/lib/auth";
import { cartCount, cartSubtotal } from "@/lib/cart";
import { useFrontendData } from "@/lib/use-frontend-data";

function normalizeNavHref(href: string) {
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

type SearchSuggestion = {
  id: string;
  title: string;
  image: string;
  href: string;
};

import type { FrontendData } from "@/lib/frontend-data";

type NavBarProps = {
  searchSuggestions?: SearchSuggestion[];
  searchContextLabel?: string;
  initialData?: FrontendData;
};

export default function NavBar({
  searchSuggestions = [],
  searchContextLabel,
  initialData,
}: NavBarProps) {
  const { data } = useFrontendData(initialData);
  const nav = data.navbar;
  const [count, setCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [dismissedTerms, setDismissedTerms] = useState<string[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isAllDeptsOpen, setIsAllDeptsOpen] = useState(false);
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const promoLink = nav.quickLinks[2]
    ? {
        ...nav.quickLinks[2],
        label:
          nav.quickLinks[2].label.trim().toLowerCase() === "wholesale"
            ? "Hot Deals!"
            : nav.quickLinks[2].label || "Hot Deals!",
      }
    : null;

  const groupedCategories = useMemo(() => {
    if (!data.categories) return [];
    
    // Filter out specific categories to hide from mega menu
    const excludedTitles = ["ACs & Air Coolers", "Electronics Lab Tools"];
    
    const all = data.categories.filter((c) => c.isActive && !excludedTitles.includes(c.title));
    const roots = all.filter((c) => !c.rootCategory || c.rootCategory === "");
    const subCats = all.filter((c) => c.rootCategory && c.rootCategory !== "");

    return roots
      .map((root) => ({
        ...root,
        subcategories: subCats.filter((child) => child.rootCategory === root.title),
      }))
      .sort((a, b) => a.order - b.order);
  }, [data.categories]);

  const searchTerms = useMemo(() => {
    const baseTerms = searchSuggestions.slice(0, 6).map((item) => item.title);
    if (searchContextLabel) {
      baseTerms.push(`${searchContextLabel} in category`);
    }

    return Array.from(new Set(baseTerms))
      .filter(Boolean)
      .filter((term) => !dismissedTerms.includes(term))
      .filter((term) =>
        query.trim()
          ? term.toLowerCase().includes(query.trim().toLowerCase())
          : true
      );
  }, [dismissedTerms, query, searchContextLabel, searchSuggestions]);

  const visibleSuggestions = useMemo(() => {
    if (!query.trim()) {
      return searchSuggestions;
    }

    const normalizedQuery = query.trim().toLowerCase();
    return searchSuggestions.filter((item) =>
      item.title.toLowerCase().includes(normalizedQuery)
    );
  }, [query, searchSuggestions]);

  useEffect(() => {
    const sync = () => {
      setCount(cartCount());
      setSubtotal(cartSubtotal());
    };
    sync();
    window.addEventListener("cart:updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart:updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const syncAuth = () => {
      const user = getCurrentUser();
      setLoggedIn(isLoggedIn());
      setUserName(user?.fullName?.split(" ")[0] || "Account");
    };

    syncAuth();
    window.addEventListener("auth:updated", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("auth:updated", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  useEffect(() => {
    const handlePanelChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isOpen?: boolean }>;
      setIsMiniCartOpen(Boolean(customEvent.detail?.isOpen));
    };

    window.addEventListener("cart:panel-change", handlePanelChange as EventListener);
    return () => {
      window.removeEventListener("cart:panel-change", handlePanelChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!searchPanelRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isAllDeptsOpen) {
      return;
    }

    if (!hoveredDept && groupedCategories.length > 0) {
      setHoveredDept(groupedCategories[0].id);
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const allDeptsBtn = document.querySelector('[data-all-depts-button]');
      const allDeptsDropdown = document.querySelector('[data-all-depts-dropdown]');
      
      if (allDeptsDropdown && !allDeptsDropdown.contains(target) && 
          allDeptsBtn && !allDeptsBtn.contains(target)) {
        setIsAllDeptsOpen(false);
        setHoveredDept(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [groupedCategories, hoveredDept, isAllDeptsOpen]);

  const scrollSuggestions = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -480 : 480,
      behavior: "smooth",
    });
  };

  const openAuthModal = (mode: "login" | "register" = "login") => {
    window.dispatchEvent(
      new CustomEvent("auth:modal-open", {
        detail: { mode, redirect: "/user" },
      })
    );
  };

  const marqueeText = nav.marqueeText?.trim();
  const showMarquee = nav.showMarquee !== false && Boolean(marqueeText);

  return (
    <header className="w-full">
      {showMarquee ? (
        <div className="w-full overflow-hidden bg-[#d62828] text-white">
          <div className="relative flex whitespace-nowrap py-2">
            <div className="animate-[marquee_28s_linear_infinite] pr-8 text-[12px] font-semibold uppercase tracking-[0.08em] sm:text-[13px]">
              {marqueeText}
            </div>
            <div
              aria-hidden="true"
              className="animate-[marquee_28s_linear_infinite] pr-8 text-[12px] font-semibold uppercase tracking-[0.08em] sm:text-[13px]"
            >
              {marqueeText}
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>

      <div className="w-full bg-white">
        <div className="mx-auto flex w-[98%] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-[13px] text-gray-600">
          {nav.topLinks.map((link) => (
            <Link key={link.href} href={normalizeNavHref(link.href)} className="flex items-center gap-2 hover:text-gray-900">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                {link.icon === "home" ? <Home size={14} /> : null}
                {link.icon === "info" ? <Info size={14} /> : null}
                {link.icon === "mail" ? <Mail size={14} /> : null}
              </span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="w-full bg-white">
        <div className="mx-auto grid w-[98%] grid-cols-12 items-center gap-4 px-4 py-3">
          <div className="col-span-12 flex items-center justify-center gap-3 sm:col-span-2 sm:justify-start">
            <Link href="/" aria-label="Store Home">
              {nav.logoUrl ? (
                <SafeImage
                  src={nav.logoUrl}
                  alt={nav.logoAlt || "Store logo"}
                  width={160}
                  height={64}
                  priority
                  className="h-14 w-auto object-contain sm:h-16"
                />
              ) : (
                <span className="text-xl font-black tracking-tighter text-[#111827] uppercase leading-none">
                  {(nav.siteTitle || "Modern Electronics").split(" | ")[0]}
                </span>
              )}
            </Link>
          </div>

          <div className="col-span-12 sm:col-span-7">
            <div className="flex items-center gap-3">
              <div ref={searchPanelRef} className="relative flex-1">
                <div className="flex h-11 w-full overflow-hidden rounded-[2px] border border-[#cfcfcf] bg-white">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onFocus={() => {
                      if (searchSuggestions.length > 0) {
                        setIsSearchOpen(true);
                      }
                    }}
                    className="h-full w-full px-4 text-[14px] outline-none placeholder:text-gray-400"
                    placeholder={nav.searchPlaceholder}
                  />
                  <button
                    className="flex h-full w-12 items-center justify-center bg-[#2f2f2f] text-white hover:bg-black"
                    aria-label="Search"
                  >
                    <Search size={18} />
                  </button>
                </div>

                {isSearchOpen && searchSuggestions.length > 0 ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[120] overflow-hidden rounded-md border border-[#e5e5e5] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
                    <div className="border-b border-[#e5e5e5] bg-[#f7f7f7]">
                      <div className="px-[12px] pt-[10px]">
                        <h2 className="text-[16px] font-[700] uppercase leading-[22px] text-[#111111]">
                          Searches Related To This Product
                        </h2>
                      </div>

                      <div className="relative mt-[10px] px-[10px] pb-[12px]">
                        {visibleSuggestions.length > 0 ? (
                          <>
                            <div
                              ref={scrollRef}
                              className="flex gap-[13px] overflow-x-auto pr-[110px] scrollbar-hide"
                            >
                              {visibleSuggestions.map((item) => (
                                <Link
                                  key={item.id}
                                  href={item.href}
                                  onClick={() => setIsSearchOpen(false)}
                                  className="w-[140px] min-w-[140px] overflow-hidden rounded-[4px] border border-[#dddddd] bg-white"
                                >
                                  <div className="flex h-[77px] items-center justify-center bg-[#f8f8f8] px-2">
                                    <SafeImage
                                      src={item.image}
                                      alt={item.title}
                                      width={95}
                                      height={64}
                                      className="max-h-[64px] max-w-[95px] object-contain"
                                    />
                                  </div>
                                  <div className="flex h-[33px] items-center justify-center border-t border-[#ededed] px-2 text-center">
                                    <span className="line-clamp-1 text-[13px] font-[400] leading-[16px] text-[#222222]">
                                      {item.title}
                                    </span>
                                  </div>
                                </Link>
                              ))}
                            </div>

                            {visibleSuggestions.length > 3 ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => scrollSuggestions("left")}
                                  className="absolute right-[66px] top-[12px] flex h-[59px] w-[54px] items-center justify-center rounded-[6px] border border-[#e1e1e1] bg-white text-[#5f6368] shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                                >
                                  <ChevronLeft className="h-[28px] w-[28px] stroke-[2.2]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => scrollSuggestions("right")}
                                  className="absolute right-[6px] top-[12px] flex h-[59px] w-[54px] items-center justify-center rounded-[6px] border border-[#e1e1e1] bg-white text-[#5f6368] shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                                >
                                  <ChevronRight className="h-[28px] w-[28px] stroke-[2.2]" />
                                </button>
                              </>
                            ) : null}
                          </>
                        ) : (
                          <div className="px-[4px] py-[18px] text-[14px] text-[#666666]">
                            No matching products in this category.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white">
                      {searchTerms.length > 0 ? (
                        searchTerms.map((term) => (
                          <div
                            key={term}
                            className="flex min-h-[35px] items-center justify-between border-t border-[#f0f0f0] px-[8px]"
                          >
                            <div className="pr-4">
                              <span className="text-[15px] font-[700] leading-[20px] text-[#8f2aa6]">
                                {term}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setDismissedTerms((current) =>
                                  current.includes(term) ? current : [...current, term]
                                )
                              }
                              className="flex h-[24px] w-[24px] items-center justify-center text-[#111111]"
                            >
                              <X className="h-[20px] w-[20px] stroke-[2.3]" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="border-t border-[#f0f0f0] px-[12px] py-[10px] text-[14px] text-[#666666]">
                          Keep typing to narrow products in this category.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {loggedIn ? (
                <button
                  type="button"
                  onClick={() => logout()}
                  className="hidden"
                >
                  <User size={20} className="text-gray-500 group-hover:text-black" />
                  <span className="text-[11px] sm:text-[12px]">{userName}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="hidden"
                >
                  <User size={20} className="text-gray-500 group-hover:text-black" />
                  <span className="text-[11px] sm:text-[12px]">Login</span>
                </button>
              )}
            </div>
          </div>

          <div className="col-span-12 sm:col-span-3">
            <div
              className={`grid grid-cols-4 gap-3 sm:flex sm:items-center sm:justify-end sm:gap-3 sm:-ml-8 transition-transform duration-300 ${
                isMiniCartOpen ? "sm:-translate-x-28" : ""
              }`}
            >
              {loggedIn ? (
                <button
                  type="button"
                  onClick={() => logout()}
                  className="group flex flex-col items-center gap-1 text-gray-700 hover:text-black"
                >
                  <User size={20} className="text-gray-500 group-hover:text-black" />
                  <span className="text-[11px] sm:text-[12px]">{userName}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="group flex flex-col items-center gap-1 text-gray-700 hover:text-black"
                >
                  <User size={20} className="text-gray-500 group-hover:text-black" />
                  <span className="text-[11px] sm:text-[12px]">Login</span>
                </button>
              )}


              <Link
                href="/wishlist"
                className="group flex flex-col items-center gap-1 text-gray-700 hover:text-black"
              >
                <Heart size={20} className="text-gray-500 group-hover:text-black" />
                <span className="text-[11px] sm:text-[12px]">Wishlist</span>
              </Link>

              <div className="flex items-center justify-center md:justify-end">
                <Link
                  href="/cart"
                  className="relative flex h-10 w-10 items-center justify-center rounded-[2px] border border-gray-300 bg-white hover:border-gray-400 md:ml-2"
                  aria-label="Cart"
                >
                  <ShoppingBag size={18} className="text-gray-700" />
                  <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff6a00] px-1 text-[11px] font-bold text-white">
                    {count}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="mx-auto w-[98%] px-0">
          <div className="grid grid-cols-12 items-stretch relative">
            <div
              className="group relative col-span-12 flex sm:col-span-3"
              onMouseEnter={() => {
                setIsAllDeptsOpen(true);
                if (!hoveredDept && groupedCategories[0]) {
                  setHoveredDept(groupedCategories[0].id);
                }
              }}
              onMouseLeave={() => {
                setIsAllDeptsOpen(false);
                setHoveredDept(null);
              }}
            >
              <button
                data-all-depts-button
                onClick={() => {
                  setIsAllDeptsOpen((current) => {
                    const nextOpen = !current;
                    setHoveredDept(nextOpen && groupedCategories[0] ? groupedCategories[0].id : null);
                    return nextOpen;
                  });
                }}
                className="flex h-full min-h-[48px] w-full items-center gap-3 bg-[#114f8f] px-4 py-3 text-[13px] font-medium uppercase text-white shadow-sm transition-colors hover:bg-[#0d3f74]"
              >
                <Menu size={18} />
                All Departments
              </button>

              {/* Mega Menu Dropdown with Hover */}
              {isAllDeptsOpen && (
                <div 
                  data-all-depts-dropdown 
                  className="absolute left-0 top-full z-[100] flex w-[700px] border-b-2 border-[#114f8f] bg-white shadow-lg"
                >
                  {/* Left side - Departments */}
                  <div className="w-[280px] border-r border-gray-100 py-2">
                    {groupedCategories.length > 0 ? (
                      groupedCategories.map((cat) => (
                        <div 
                          key={cat.id} 
                          className="border-b border-gray-100 last:border-0"
                          onMouseEnter={() => setHoveredDept(cat.id)}
                        >
                          <Link
                            href={`/category/${cat.slug}`}
                            onClick={() => setIsAllDeptsOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 hover:bg-[#114f8f] hover:text-white"
                          >
                            {cat.thumbnail ? (
                              <div className="flex h-6 w-6 items-center justify-center">
                                <SafeImage src={cat.thumbnail} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
                              </div>
                            ) : (
                              <Menu size={14} className="text-gray-400" />
                            )}
                            {cat.title}
                          </Link>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-400">
                        No categories registered
                      </div>
                    )}
                  </div>
                  
                  {/* Right side - Subcategories (shows on hover) */}
                  <div className="flex-1 bg-gray-50 py-2">
                    {hoveredDept ? (
                      (() => {
                        const cat = groupedCategories.find(c => c.id === hoveredDept);
                        if (!cat || !cat.subcategories || cat.subcategories.length === 0) {
                          return (
                            <div className="flex h-full items-center justify-center text-gray-400">
                              <span className="text-[13px]">No subcategories for this department</span>
                            </div>
                          );
                        }
                        return (
                          <div className="px-4">
                            <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
                              {cat.thumbnail && (
                                <SafeImage src={cat.thumbnail} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
                              )}
                              <Link 
                                href={`/category/${cat.slug}`} 
                                className="text-[14px] font-bold text-[#114f8f] hover:underline"
                                onClick={() => setIsAllDeptsOpen(false)}
                              >
                                {cat.title}
                              </Link>
                              <ChevronRight size={14} className="text-gray-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              {cat.subcategories.sort((a,b) => a.order - b.order).map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/category/${sub.slug}`}
                                  onClick={() => setIsAllDeptsOpen(false)}
                                  className="py-2 text-[13px] text-gray-600 hover:text-[#114f8f] hover:underline"
                                >
                                  {sub.title}
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <span className="text-[13px]">Hover over a department to see categories</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <nav className="col-span-12 flex flex-wrap items-stretch gap-x-6 gap-y-0 bg-[#3f3f3f] px-4 py-0 text-[12px] font-bold uppercase text-white sm:col-span-7 sm:px-6 sm:text-[13px]">
              {nav.quickLinks.slice(0, 2).map((link) => (
                <Link key={link.href} href={normalizeNavHref(link.href)} className="inline-flex items-center py-3 hover:text-[#f6c400]">
                  {link.label}
                </Link>
              ))}

              {promoLink ? (
                <div className="relative flex items-stretch">
                  <Link
                    href={normalizeNavHref(promoLink.href)}
                    className="relative inline-flex h-full items-center justify-center bg-[#d62828] px-5 py-3 text-white hover:bg-[#b91c1c]"
                  >
                    {promoLink.label}
                  </Link>
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-[2px] bg-[#f6c400] px-2 py-[2px] text-[10px] font-black text-black">
                    New
                  </span>
                </div>
              ) : null}
            </nav>

            {nav.quickLinks[3] ? (
              <Link
                href={normalizeNavHref(nav.quickLinks[3].href)}
                className="col-span-12 flex items-center justify-between gap-3 bg-[#114f8f] px-4 py-3 text-[13px] font-bold uppercase text-white sm:col-span-2"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare size={18} />
                  {nav.quickLinks[3].label}
                </span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-[2px] bg-white/15 text-white">
                  <Menu size={16} />
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
