import { NextRequest } from "next/server";
import { proxyToLaravel } from "@/lib/proxy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return proxyToLaravel("POST", "/auth/logout", request);
}
