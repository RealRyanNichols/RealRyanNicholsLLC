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
  if (doc.file_url && /^https?:\/\//i.test(doc.file_url)) {
    const res = await fetch(doc.file_url, { redirect: "follow" });
    if (res.ok) {
      const ct = res.headers.get("content-type") ?? "image/jpeg";
      if (ct.startsWith("image/")) {
        return {
          bytes: Buffer.from(await res.arrayBuffer()),
          contentType: ct,
        };
      }
    }
  }
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
  return null;
}

// Tasteful portrait placeholder served (HTTP 200) when a source scan can't be
// fetched — so the evidence grid shows an intentional card instead of a broken
// image icon. Inline SVG (no asset dependency); neutral slate to sit cleanly on
// the grid's black backing.
function placeholderSvg(): string {
  const font = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1300" viewBox="0 0 1000 1300" role="img" aria-label="Document scan temporarily unavailable">
  <rect width="1000" height="1300" fill="#0f1318"/>
  <rect x="360" y="430" width="280" height="360" rx="14" fill="#161b22" stroke="#37414e" stroke-width="10"/>
  <path d="M560 430 v70 h70" fill="none" stroke="#37414e" stroke-width="10" stroke-linejoin="round"/>
  <g fill="#2b333d">
    <rect x="400" y="560" width="200" height="14" rx="7"/>
    <rect x="400" y="600" width="200" height="14" rx="7"/>
    <rect x="400" y="640" width="150" height="14" rx="7"/>
  </g>
  <text x="500" y="900" text-anchor="middle" fill="#5b6675" font-family="${font}" font-size="30" font-weight="700">Scan temporarily unavailable</text>
  <text x="500" y="944" text-anchor="middle" fill="#454e5b" font-family="${font}" font-size="24">Restoring the mirrored copy</text>
</svg>`;
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

  // Fast path: if we already have a hosted file_url, just redirect to it.
  if (doc.file_url && /^https?:\/\//i.test(doc.file_url) && doc.file_url.includes("/storage/v1/object/public/")) {
    return NextResponse.redirect(doc.file_url, 302);
  }

  const source = await fetchSourceImage(doc);
  if (!source) {
    // The source (often a Google Drive scan that now blocks hotlinking) could
    // not be fetched. Serve a placeholder instead of a 502 so the evidence grid
    // never shows a broken-image icon. Short cache so it self-heals the moment
    // the scan is re-mirrored to Supabase storage via /admin/case/scans.
    return new NextResponse(placeholderSvg(), {
      status: 200,
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        "x-image-fallback": "1",
      },
    });
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
