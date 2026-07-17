import { ImageResponse } from "next/og";
import { ogEmbeddableImage } from "@/lib/og-embed";

export const runtime = "nodejs";
export const revalidate = 3600;

// The Share Card Generator's render engine. Same self-hosted ImageResponse
// pattern as /og/case, but user-driven: /og/make?title=…&sub=…&style=dark
// renders a branded 1200×630 card anyone can download from /tools/share-card.
// Every card carries the site mark + domain — shares travel with attribution.

const LIMITS = { title: 110, sub: 200, stat: 16, statLabel: 44 } as const;

function clean(value: string | null, max: number): string {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

const STYLES = {
  dark: {
    bg: "#071126",
    headline: "#ffffff",
    sub: "#a9b7d0",
    gold: "#e1bd5b",
    footer: "#f6efdf",
    statLabel: "#7c8aa6",
  },
  cream: {
    bg: "#f6efdf",
    headline: "#1a1410",
    sub: "#4a3e30",
    gold: "#8f6b16",
    footer: "#1a1410",
    statLabel: "#7a6a52",
  },
} as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const title =
    clean(url.searchParams.get("title"), LIMITS.title) ||
    "The record doesn't lie.";
  const sub = clean(url.searchParams.get("sub"), LIMITS.sub);
  const stat = clean(url.searchParams.get("stat"), LIMITS.stat);
  const statLabel = clean(url.searchParams.get("statLabel"), LIMITS.statLabel);
  const style =
    url.searchParams.get("style") === "cream" ? STYLES.cream : STYLES.dark;

  // Long headlines step down so they always fit the frame.
  const titleSize = title.length > 80 ? 52 : title.length > 48 ? 62 : 76;

  const mark = await ogEmbeddableImage("/avatar.jpg");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: style.bg,
          color: style.footer,
        }}
      >
        {/* gold rule */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 8,
            background: style.gold,
            display: "flex",
          }}
        />

        {/* kicker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: style.gold,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: 7,
              background: style.gold,
            }}
          />
          Real Ryan Nichols · On the record
        </div>

        {/* headline + sub */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: titleSize,
              fontWeight: 800,
              lineHeight: 1.04,
              color: style.headline,
            }}
          >
            {title}
          </div>
          {sub ? (
            <div
              style={{
                display: "flex",
                maxWidth: 960,
                fontSize: 30,
                lineHeight: 1.3,
                color: style.sub,
              }}
            >
              {sub}
            </div>
          ) : null}
        </div>

        {/* stat + footer */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          {stat ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 56,
                  fontWeight: 800,
                  color: style.gold,
                }}
              >
                {stat}
              </div>
              {statLabel ? (
                <div
                  style={{
                    display: "flex",
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: style.statLabel,
                  }}
                >
                  {statLabel}
                </div>
              ) : null}
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {mark ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                src={mark}
                width={64}
                height={64}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  border: `2px solid ${style.gold}`,
                }}
              />
            ) : null}
            <div
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 700,
                color: style.footer,
              }}
            >
              realryannichols.com
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
