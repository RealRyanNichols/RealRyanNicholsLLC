import { NextResponse } from "next/server";
import { getDocumentBySlug } from "@/lib/case";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractDriveId(url: string | null): string | null {
  if (!url) return null;
  const m =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

async function fetchSourceImage(doc: { file_url: string | null; external_url: string | null }) {
  const driveId = extractDriveId(doc.external_url) ?? extractDriveId(doc.file_url);
  if (driveId) {
    const candidates = [
      `https://lh3.googleusercontent.com/d/${driveId}=s2000`,
      `https://drive.usercontent.google.com/download?id=${driveId}&export=view&authuser=0`,
    ];
    for (const url of candidates) {
      const res = await fetch(url, {
        headers: { "user-agent": "RealRyanNicholsLLC/1.0 (+https://realryannichols.com)" },
        redirect: "follow",
      });
      if (res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        if (ct.startsWith("image/")) {
          return {
            bytes: Buffer.from(await res.arrayBuffer()),
            contentType: ct,
          };
        }
      }
    }
  }
  if (doc.file_url) {
    const res = await fetch(doc.file_url, { redirect: "follow" });
    if (res.ok) {
      const ct = res.headers.get("content-type") ?? "";
      if (ct.startsWith("image/")) {
        return {
          bytes: Buffer.from(await res.arrayBuffer()),
          contentType: ct,
        };
      }
    }
  }
  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const doc = await getDocumentBySlug(slug);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const source = await fetchSourceImage(doc);
  if (!source) {
    return NextResponse.json(
      { error: "Source image unavailable. The underlying file must be shared publicly." },
      { status: 502 },
    );
  }

  return new NextResponse(new Uint8Array(source.bytes), {
    status: 200,
    headers: {
      "content-type": source.contentType,
      "cache-control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
      "content-disposition": `inline; filename="${slug}.jpg"`,
    },
  });
}
