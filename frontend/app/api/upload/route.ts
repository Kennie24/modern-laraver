import { NextRequest, NextResponse } from "next/server";
import { proxyToLaravel } from "@/lib/proxy";
import { buildMediaProxyUrl, normalizeMediaUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const res = await proxyToLaravel("POST", "/admin/upload", request);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed." }));
      return NextResponse.json(err, { status: res.status });
    }

    const payload = (await res.json().catch(() => null)) as
      | { url?: string; path?: string; error?: string }
      | null;

    if (!payload) {
      return NextResponse.json({ error: "Upload failed." }, { status: 502 });
    }

    const url = payload.path
      ? buildMediaProxyUrl(payload.path)
      : payload.url
        ? normalizeMediaUrl(payload.url)
        : "";

    return NextResponse.json({ ...payload, url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
