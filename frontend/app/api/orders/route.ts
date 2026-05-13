import { NextRequest } from "next/server";
import { proxyToLaravel } from "@/lib/proxy";

// Always dynamic — reads Authorization header from the browser request.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const response = await proxyToLaravel("GET", "/orders", request);

  // Reading order history should not break the account page while the
  // Laravel orders endpoint is being deployed/migrated on cPanel.
  if (response.status === 404 || response.status >= 500) {
    return Response.json({ ok: true, orders: [] }, { status: 200 });
  }

  return response;
}

export async function POST(request: NextRequest) {
  const response = await proxyToLaravel("POST", "/orders", request);

  if (response.status === 404) {
    return Response.json(
      { ok: false, error: "Orders service is not available yet. Run the Laravel orders migration and clear routes." },
      { status: 503 }
    );
  }

  return response;
}
