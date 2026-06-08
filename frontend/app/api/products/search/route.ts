import { NextRequest } from "next/server";
import { proxyToLaravel } from "@/lib/proxy";

export async function GET(request: NextRequest) {
  const search = new URL(request.url).search;
  return proxyToLaravel("GET", `/products/search${search}`, request);
}
