import { getToken } from "@/lib/auth";
import type { CartItem } from "@/lib/cart";

export type StorefrontOrder = {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  fulfillmentMethod: "delivery" | "pickup";
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
  currencyCode: string;
  placedAt: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  customerNote?: string | null;
  timeline?: {
    status: string;
    label: string;
    message: string;
    changedAt?: string | null;
  }[];
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    image?: string;
    href?: string;
  }[];
};

type PlaceOrderInput = {
  customer: {
    fullName: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  fulfillmentMethod: "delivery" | "pickup";
  paymentMethod: string;
  pickupLocation?: unknown;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
};

async function authedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection.");
  }

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Orders service is not available yet. The server may need a database migration.");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("Please sign in to view your orders.");
    }
    if (response.status === 503 && (payload.error || payload.message)) {
      throw new Error(payload.error ?? payload.message);
    }
    if (response.status >= 500) {
      throw new Error("Server error — orders could not be loaded. Try again later.");
    }
    throw new Error(payload.error ?? payload.message ?? response.statusText);
  }

  return payload as T;
}

export async function placeOrder(input: PlaceOrderInput) {
  const payload = await authedFetch<{ ok: boolean; order: StorefrontOrder }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });

  window.dispatchEvent(new Event("orders:updated"));
  return payload.order;
}

export async function fetchOrders() {
  const payload = await authedFetch<{ ok: boolean; orders: StorefrontOrder[] }>("/api/orders");
  return payload.orders ?? [];
}
