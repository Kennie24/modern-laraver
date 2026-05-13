import { NextRequest } from "next/server";
import { proxyToLaravel } from "@/lib/proxy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return proxyToLaravel("GET", "/admin/products", request);
}

export async function POST(request: NextRequest) {
  return proxyToLaravel("POST", "/admin/products", request);
}
