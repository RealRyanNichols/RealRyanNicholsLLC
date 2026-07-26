import { NextResponse } from "next/server";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

export const runtime = "nodejs";
export const revalidate = 86400;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function nameLines(name: string): [string, string?] {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length < 3 || name.length <= 28) return [name];
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}

function identityCardSvg(name: string): string {
  const safeName = escapeXml(name);
  const safeInitials = escapeXml(initialsFor(name));
  const [rawLineOne, rawLineTwo] = nameLines(name);
  const lineOne = escapeXml(rawLineOne);
  const lineTwo = rawLineTwo ? escapeXml(rawLineTwo) : undefined;
  const longestLine = Math.max(rawLineOne.length, rawLineTwo?.length ?? 0);
  const nameFontSize = longestLine > 30 ? 32 : longestLine > 22 ? 38 : 44;
  const font = "system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000" role="img" aria-label="Archive identity card for ${safeName}; verified portrait not yet available">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#071123"/>
      <stop offset="1" stop-color="#162a4f"/>
    </linearGradient>
    <pattern id="grid" width="52" height="52" patternUnits="userSpaceOnUse">
      <path d="M52 0H0V52" fill="none" stroke="#8da8d2" stroke-opacity=".08" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  <rect width="800" height="1000" fill="url(#grid)"/>
  <rect x="44" y="44" width="712" height="912" rx="34" fill="none" stroke="#e1bd5b" stroke-width="4"/>
  <text x="400" y="112" text-anchor="middle" fill="#e1bd5b" font-family="${font}" font-size="25" font-weight="800" letter-spacing="5">JANUARY 6 ARCHIVE</text>
  <circle cx="400" cy="398" r="174" fill="#0c1931" stroke="#8da8d2" stroke-width="5"/>
  <circle cx="400" cy="398" r="145" fill="#152a4d" stroke="#e1bd5b" stroke-opacity=".45" stroke-width="3"/>
  <text x="400" y="425" text-anchor="middle" fill="#fdf8ea" font-family="${font}" font-size="116" font-weight="900" letter-spacing="5">${safeInitials}</text>
  <text x="400" y="650" text-anchor="middle" fill="#fdf8ea" font-family="${font}" font-size="${nameFontSize}" font-weight="850">${lineOne}</text>
  ${lineTwo ? `<text x="400" y="705" text-anchor="middle" fill="#fdf8ea" font-family="${font}" font-size="${nameFontSize}" font-weight="850">${lineTwo}</text>` : ""}
  <line x1="164" y1="754" x2="636" y2="754" stroke="#e1bd5b" stroke-width="3"/>
  <text x="400" y="818" text-anchor="middle" fill="#e1bd5b" font-family="${font}" font-size="29" font-weight="850" letter-spacing="3">PORTRAIT NEEDED</text>
  <text x="400" y="862" text-anchor="middle" fill="#b8c8df" font-family="${font}" font-size="22">Face-free identity card · not a photograph</text>
  <text x="400" y="915" text-anchor="middle" fill="#879ab5" font-family="${font}" font-size="19">Help complete the record at RealRyanNichols.com</text>
</svg>`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase
    .from("case_people")
    .select("name")
    .eq("slug", slug)
    .eq("visibility", "public")
    .eq("is_j6_defendant", true)
    .maybeSingle();

  if (!data?.name) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return new NextResponse(identityCardSvg(data.name), {
    status: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control":
        "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      "content-disposition": `inline; filename="${slug}-archive-card.svg"`,
      "x-profile-image-kind": "archive-card",
    },
  });
}
