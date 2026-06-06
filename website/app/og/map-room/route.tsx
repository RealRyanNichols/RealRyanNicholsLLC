import { ImageResponse } from "next/og";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

// Dynamic OG share card for /the-map-room. Pulls the same site_totals
// snapshot the page uses so the share preview shows the LIVE counters
// at the moment the link gets unfurled — "247 reading from 38
// countries" reads as a war-room dashboard in a Twitter card.
export const runtime = "nodejs";
export const revalidate = 60;

type Totals = {
  defendants: number;
  documents: number;
  grievances: number;
  events: number;
  days_since_pardon: number;
  live_now: number;
  countries_now: number;
};

export async function GET() {
  const supabase = getSupabaseStaticClient();
  const { data } = await supabase.rpc("site_totals");
  const t = (data ?? {}) as Partial<Totals>;
  const live = t.live_now ?? 0;
  const countries = t.countries_now ?? 0;
  const defs = t.defendants ?? 0;
  const docs = t.documents ?? 0;
  const griev = t.grievances ?? 0;
  const days = t.days_since_pardon ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0e1a36",
          color: "#fdf8ea",
          fontFamily: "serif",
          padding: "48px 64px",
        }}
      >
        {/* Top eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#e1bd5b",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 14,
              background: "#e1bd5b",
              boxShadow: "0 0 12px #e1bd5b",
            }}
          />
          THE MAP ROOM · LIVE
        </div>

        {/* Big live count */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            alignItems: "baseline",
            gap: 20,
          }}
        >
          <span
            style={{
              fontSize: 180,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: "#fdf8ea",
            }}
          >
            {live.toLocaleString()}
          </span>
          <span
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: "#cfd9ea",
              display: "flex",
            }}
          >
            reading the case · {countries} {countries === 1 ? "country" : "countries"}
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 16,
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#fdf8ea",
            display: "flex",
            maxWidth: 980,
          }}
        >
          United States v. Nichols. Pardoned. Dismissed with prejudice.
          The record stays open.
        </div>

        {/* Counter strip */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            gap: 28,
            paddingTop: 28,
            borderTop: "2px solid #3a557c",
          }}
        >
          <CounterBlock label="J6 defendants archived" value={defs} />
          <CounterBlock label="Documents on file" value={docs} />
          <CounterBlock label="Grievances filed" value={griev} />
          <CounterBlock label="Days since the pardon" value={days} />
        </div>

        {/* Footer brand */}
        <div
          style={{
            marginTop: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 48,
                background: "#b32419",
                color: "#fdf8ea",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              RN
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#fdf8ea",
                display: "flex",
              }}
            >
              realryannichols.com / the-map-room
            </div>
          </div>
          <div
            style={{
              fontSize: 16,
              color: "#a9b7d0",
              display: "flex",
            }}
          >
            the live record · in public · free
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function CounterBlock({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontSize: 52,
          fontWeight: 700,
          lineHeight: 1,
          color: "#fdf8ea",
        }}
      >
        {value.toLocaleString()}
      </span>
      <span
        style={{
          fontSize: 14,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "#a9b7d0",
          marginTop: 6,
        }}
      >
        {label}
      </span>
    </div>
  );
}
