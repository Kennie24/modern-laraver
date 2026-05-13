import { NextRequest } from "next/server";
import { proxyToLaravel } from "@/lib/proxy";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return proxyToLaravel("GET", `/admin/products/${id}`, request);
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return proxyToLaravel("PATCH", `/admin/products/${id}`, request);
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return proxyToLaravel("DELETE", `/admin/products/${id}`, request);
}
