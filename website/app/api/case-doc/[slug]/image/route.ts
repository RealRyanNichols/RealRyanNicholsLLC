import { NextResponse } from "next/server";
import sharp from "sharp";
import { getDocumentBySlug } from "@/lib/case";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK_WIDTH = 1600;

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
          return Buffer.from(await res.arrayBuffer());
        }
      }
    }
  }
  if (doc.file_url) {
    const res = await fetch(doc.file_url, { redirect: "follow" });
    if (res.ok) {
      const ct = res.headers.get("content-type") ?? "";
      if (ct.startsWith("image/")) {
        return Buffer.from(await res.arrayBuffer());
      }
    }
  }
  return null;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

function buildWatermarkSvg(width: number, height: number, label: string): Buffer {
  const fontSize = Math.max(20, Math.round(Math.min(width, height) / 36));
  const tileWidth = Math.max(380, fontSize * 18);
  const tileHeight = Math.max(180, fontSize * 6);
  const text = escapeXml(label);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <pattern id="wm" x="0" y="0" width="${tileWidth}" height="${tileHeight}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
      <text x="0" y="${Math.round(tileHeight / 2)}" fill="#ffffff" fill-opacity="0.10" stroke="#000000" stroke-opacity="0.05" stroke-width="1" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="2">${text}</text>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#wm)"/>
</svg>`;
  return Buffer.from(svg);
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

  try {
    const base = sharp(source).rotate();
    const meta = await base.metadata();
    const width = meta.width ?? FALLBACK_WIDTH;
    const height = meta.height ?? Math.round(FALLBACK_WIDTH * 1.3);

    const watermark = buildWatermarkSvg(
      width,
      height,
      "© REALRYANNICHOLS.COM   ·   RYAN NICHOLS",
    );

    const out = await base
      .composite([{ input: watermark, top: 0, left: 0 }])
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();

    return new NextResponse(new Uint8Array(out), {
      status: 200,
      headers: {
        "content-type": "image/jpeg",
        "cache-control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
        "content-disposition": `inline; filename="${slug}.jpg"`,
        "x-robots-tag": "noindex, noimageindex",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image processing failed." }, { status: 500 });
  }
}
