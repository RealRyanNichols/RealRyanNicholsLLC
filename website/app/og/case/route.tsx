import { ImageResponse } from "next/og";
import { getCaseTotals } from "@/lib/case";
import { ogEmbeddableImage } from "@/lib/og-embed";

export const runtime = "nodejs";
export const revalidate = 3600;

// Self-hosted, self-created share cards for the J6 Case archive and its views.
// No manual Photoshop, no Drive uploads — the card is rendered in code from
// live case stats and served on our own domain at /og/case?view=…
// Any /case view without a pinned override gets a branded card for free.

const VIEWS: Record<string, { kicker: string; headline: string; sub: string }> = {
  documents: {
    kicker: "The J6 Case Archive · Documents",
    headline: "Every document. On the record.",
    sub: "Dockets, filings, exhibits, orders — the salvaged federal record, preserved and public.",
  },
  people: {
    kicker: "The J6 Case Archive · People",
    headline: "Every defendant. A profile, free forever.",
    sub: "1,571 January 6 defendants indexed. Find a name, claim a profile, build the record.",
  },
  timeline: {
    kicker: "The J6 Case Archive · Timeline",
    headline: "Arrest to pardon. Day by day.",
    sub: "The full chronology of United States v. Nichols — every date tied to its paper.",
  },
  grievances: {
    kicker: "The J6 Case Archive · Grievances",
    headline: "Every grievance. With the paperwork.",
    sub: "Documented patterns of abuse and denial, filed from inside and preserved.",
  },
};

const DEFAULT_VIEW = {
  kicker: "The J6 Case Archive",
  headline: "Every case. Every clue. One record.",
  sub: "United States v. Nichols and every defendant who joins — open, sourced, and free.",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const view = url.searchParams.get("view") ?? "";
  const copy = VIEWS[view] ?? DEFAULT_VIEW;

  let documents = 0;
  let grievances = 0;
  let days = 0;
  try {
    const totals = await getCaseTotals();
    documents = totals.documents ?? 0;
    grievances = totals.ryanFiledGrievances ?? 0;
    days = totals.daysDetained ?? 0;
  } catch {
    // Never let the card 500 — fall back to a clean, stat-less version.
  }

  const mark = await ogEmbeddableImage("/avatar.jpg");
  const stats: [string, string][] = [];
  if (documents > 0) stats.push([documents.toLocaleString("en-US"), "Documents on file"]);
  if (grievances > 0) stats.push([grievances.toLocaleString("en-US"), "Grievances filed"]);
  if (days > 0) stats.push([days.toLocaleString("en-US"), "Days detained"]);

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
          background: "#071126",
          color: "#f6efdf",
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
            background: "#e1bd5b",
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
            color: "#e1bd5b",
          }}
        >
          <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, background: "#e1bd5b" }} />
          {copy.kicker}
        </div>

        {/* headline + sub */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.02, color: "#ffffff" }}>
            {copy.headline}
          </div>
          <div style={{ display: "flex", maxWidth: 960, fontSize: 30, lineHeight: 1.3, color: "#a9b7d0" }}>
            {copy.sub}
          </div>
        </div>

        {/* stats + footer */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 48 }}>
            {stats.map(([n, label]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", fontSize: 52, fontWeight: 800, color: "#e1bd5b" }}>{n}</div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#7c8aa6",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {mark ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                src={mark}
                width={64}
                height={64}
                style={{ width: 64, height: 64, borderRadius: 32, border: "2px solid #e1bd5b" }}
              />
            ) : null}
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#f6efdf" }}>
              realryannichols.com/case
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
