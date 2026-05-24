import { ImageResponse } from "next/og";
import { getGrievanceBySlug } from "@/lib/case";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const g = await getGrievanceBySlug(slug);
  if (!g) {
    return new Response("Not found", { status: 404 });
  }
  const severity = Math.min(5, Math.max(1, g.severity ?? 3));
  const stars = "★".repeat(severity) + "☆".repeat(5 - severity);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "56px 72px",
          background: "#f6efdf",
          fontFamily: "serif",
          color: "#1a1410",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 56,
                background: "#b32419",
                color: "#fdf8ea",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              RN
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  display: "flex",
                  color: "#1a1410",
                }}
              >
                The J6 Case
              </div>
              <div
                style={{
                  fontSize: 14,
                  display: "flex",
                  color: "#7a6a52",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                United States v. Nichols
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              background: "#b32419",
              color: "#fdf8ea",
              padding: "10px 18px",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Grievance · #{g.display_order ?? 1}
          </div>
        </div>

        <div
          style={{
            marginTop: 56,
            display: "flex",
            flexDirection: "column",
            gap: 24,
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.05,
              color: "#1a1410",
              fontWeight: 700,
              display: "flex",
              letterSpacing: "-0.02em",
            }}
          >
            {g.title}
          </div>
          {g.summary ? (
            <div
              style={{
                fontSize: 24,
                lineHeight: 1.4,
                color: "#4a3e30",
                display: "flex",
              }}
            >
              {g.summary.slice(0, 200)}
              {g.summary.length > 200 ? "…" : ""}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: "2px solid #d8c89e",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              fontSize: 18,
              color: "#7a6a52",
            }}
          >
            <span
              style={{
                display: "flex",
                color: "#b32419",
                fontSize: 28,
                letterSpacing: "0.15em",
              }}
            >
              {stars}
            </span>
            <span
              style={{
                display: "flex",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#b32419",
              }}
            >
              Severity {severity}/5
            </span>
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#7a6a52",
              display: "flex",
              fontWeight: 700,
            }}
          >
            realryannichols.com
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
