import { NextRequest } from "next/server";
import { proxyToLaravel } from "@/lib/proxy";

export const dynamic = "force-dynamic";

const READ_PATH = "/frontend-data";
const WRITE_PATH = "/admin/frontend-data";

export async function GET() {
  return proxyToLaravel("GET", READ_PATH);
}

export async function PUT(request: NextRequest) {
  return proxyToLaravel("PUT", WRITE_PATH, request);
}
