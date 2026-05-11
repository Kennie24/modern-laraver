/**
 * Recently-viewed product tracking — stored in localStorage.
 * Called from ProductDetailsClient when a product page is opened.
 * Read by CategoryTilesSection to populate the "Frequently Viewed" card.
 */

const KEY = "me:recently-viewed";
const MAX = 16;

export type RecentlyViewedItem = {
  id: string;
  name: string;
  image: string;
  href: string;
};

export function recordRecentlyViewed(item: RecentlyViewedItem): void {
  if (typeof window === "undefined") return;
  try {
    const current = readRecentlyViewed();
    // Move to front, remove any duplicate
    const next = [item, ...current.filter((p) => p.id !== item.id)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("recently-viewed:updated"));
  } catch {
    // Silently ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

export function readRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("recently-viewed:updated"));
  } catch {}
}
