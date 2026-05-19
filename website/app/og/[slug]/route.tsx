import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/posts";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const post = await getPostBySlug(slug);
  const title =
    post?.title ??
    (post?.body
      ? post.body.slice(0, 100).replace(/\s+/g, " ").trim()
      : SITE.name);
  const tagline = post ? SITE.author : SITE.tagline;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#fafaf7",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 60,
              background: "#c2410c",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 600,
            }}
          >
            RN
          </div>
          <div style={{ fontSize: 28, color: "#3f3f46", display: "flex" }}>
            {SITE.name}
          </div>
        </div>
        <div
          style={{
            fontSize: 72,
            lineHeight: 1.1,
            color: "#1a1a1a",
            fontWeight: 600,
            display: "flex",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 24,
            color: "#71717a",
          }}
        >
          <div style={{ display: "flex" }}>{tagline}</div>
          <div style={{ display: "flex" }}>realryannichols.com</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
