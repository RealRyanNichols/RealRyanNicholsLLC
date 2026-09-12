import { ImageResponse } from "next/og";
import { getCaseTotals } from "@/lib/case";
import { PALETTE } from "@/lib/palette";
import { FONT_BASE64, HERO_JPEG_BASE64 } from "./assets";

export const runtime = "nodejs";
export const revalidate = 3600;

// The share card for /the-story, in Ryan's photo-hero treatment: his real
// photo, a navy gradient falling off toward him so type never crosses his
// face, a gold kicker, the condensed headline in cream, a gold rule, one
// support line. The photo and the display face ship inside the route as
// base64 (./assets.ts), so the card never reads a file, a URL, or the public
// site at render time, and it prerenders cleanly at build.
const NAVY = "#0b1b34";
const CREAM = "#f4efe4";
const MUTED = "#b9c4d8";

export async function GET() {
  let days = 0;
  try {
    days = (await getCaseTotals()).daysArrestToPardon ?? 0;
  } catch {
    // Never let the card 500 over a count.
  }
  const fontBuf = Buffer.from(FONT_BASE64, "base64");
  const font = fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength);
  const photoSrc = `data:image/jpeg;base64,${HERO_JPEG_BASE64}`;
  const support = `Rescuer. Marine. Builder. Defendant. Father.${
    days > 0 ? ` ${days.toLocaleString("en-US")} days from arrest to pardon.` : ""
  }`;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          background: NAVY,
          fontFamily: "Big Shoulders",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoSrc}
          alt=""
          width={760}
          height={630}
          style={{ position: "absolute", left: 0, top: 0, width: 760, height: 630 }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: `linear-gradient(270deg, ${NAVY} 0%, ${NAVY} 32%, rgba(11,27,52,0.9) 48%, rgba(11,27,52,0.5) 64%, rgba(11,27,52,0) 100%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: "linear-gradient(0deg, rgba(11,27,52,0.92) 0%, rgba(11,27,52,0) 42%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 560,
            top: 54,
            width: 590,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 7, color: PALETTE.goldBright }}>
            THE STORY · ALL OF IT
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 16,
              fontSize: 96,
              lineHeight: 0.86,
              color: CREAM,
            }}
          >
            <span style={{ whiteSpace: "nowrap" }}>ONE LIFE.</span>
            <span style={{ whiteSpace: "nowrap" }}>TOLD WHOLE.</span>
            <span style={{ whiteSpace: "nowrap", color: PALETTE.goldBright }}>BACKED BY</span>
            <span style={{ whiteSpace: "nowrap", color: PALETTE.goldBright }}>PAPER.</span>
          </div>
          <div style={{ display: "flex", marginTop: 20, width: 110, height: 5, background: PALETTE.goldBright }} />
          <div
            style={{
              display: "flex",
              marginTop: 16,
              fontFamily: "sans-serif",
              fontSize: 22,
              lineHeight: 1.35,
              color: MUTED,
            }}
          >
            {support}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 560,
            bottom: 34,
            display: "flex",
            fontSize: 20,
            letterSpacing: 4,
            color: MUTED,
          }}
        >
          REALRYANNICHOLS.COM/THE-STORY
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Big Shoulders", data: font, weight: 900, style: "normal" }],
    },
  );
}
