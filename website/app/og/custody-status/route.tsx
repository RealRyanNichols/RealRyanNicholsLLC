import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(request: Request) {
  const backgroundUrl = new URL(
    "/og/custody-status-v2.jpg",
    request.url,
  ).toString();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "58px 68px",
        backgroundImage: `linear-gradient(90deg, rgba(9,8,7,0.97) 0%, rgba(9,8,7,0.85) 43%, rgba(9,8,7,0.18) 78%, rgba(71,10,7,0.32) 100%), url(${backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "#fff8e8",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 62,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#b32419",
              border: "2px solid #e5bd58",
              fontSize: 25,
              fontWeight: 900,
            }}
          >
            RN
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 25, fontWeight: 800 }}>
              Real Ryan Nichols
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 5,
                color: "#d8c89e",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Source-labeled public record
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            border: "2px solid #e5bd58",
            borderRadius: 8,
            padding: "11px 17px",
            color: "#ffe08a",
            fontSize: 17,
            fontWeight: 900,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Harrison County accountability
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", maxWidth: 1020 }}>
        <div
          style={{
            display: "flex",
            color: "#e5bd58",
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Verified hourly custody updates
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 69,
            lineHeight: 1.02,
            fontWeight: 900,
            letterSpacing: "-0.035em",
          }}
        >
          Ryan Nichols custody status
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 22,
            color: "#eadfc7",
            fontSize: 24,
            lineHeight: 1.35,
          }}
        >
          Public records, due process, exculpatory evidence, and what officials did next.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "2px solid rgba(229,189,88,0.45)",
          paddingTop: 22,
          color: "#d8c89e",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        <div style={{ display: "flex" }}>Emergency editorial record</div>
        <div style={{ display: "flex", color: "#fff8e8" }}>realryannichols.com</div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
