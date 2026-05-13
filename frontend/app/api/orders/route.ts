import { NextRequest } from "next/server";
import { proxyToLaravel } from "@/lib/proxy";

// Always dynamic — reads Authorization header from the browser request
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return proxyToLaravel("GET", "/orders", request);
}

export async function POST(request: NextRequest) {
  return proxyToLaravel("POST", "/orders", request);
}
