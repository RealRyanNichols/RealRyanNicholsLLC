import { ImageResponse } from "next/og";
import { PALETTE } from "@/lib/palette";
import { getFuelBill, getFuelRaised } from "@/lib/fuel-server";
import { usdWhole } from "@/lib/fuel";

// Share card for /fuel. The number is the live AI bill from the ledger and
// the meter is this month's fuel, so a shared link unfurls with the same
// receipts the page shows.
export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  const [bill, raised] = await Promise.all([getFuelBill(), getFuelRaised()]);
  const hasBill = bill.billCents > 0;
  const pct = raised && hasBill ? Math.min(100, Math.round((raised.monthCents / bill.billCents) * 100)) : null;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#071126",
          color: "#fdf8ea",
          fontFamily: "serif",
          padding: "48px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: PALETTE.goldBright,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 14,
              background: PALETTE.goldBright,
              boxShadow: `0 0 12px ${PALETTE.goldBright}`,
            }}
          />
          THE TOKEN FUND · FUEL THE MACHINE
        </div>

        {hasBill ? (
          <div style={{ marginTop: 28, display: "flex", alignItems: "baseline", gap: 20 }}>
            <span
              style={{
                fontSize: 170,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-0.04em",
                color: PALETTE.goldBright,
              }}
            >
              {usdWhole(bill.billCents)}
            </span>
            <span style={{ fontSize: 30, fontWeight: 700, color: "#cfd9ea", display: "flex" }}>
              a month in AI tokens
            </span>
          </div>
        ) : null}

        <div
          style={{
            marginTop: 20,
            fontSize: 40,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#fdf8ea",
            display: "flex",
            maxWidth: 1000,
          }}
        >
          This machine runs on tokens. You can fuel it.
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 26,
            lineHeight: 1.3,
            color: "#cfd9ea",
            display: "flex",
            maxWidth: 1000,
          }}
        >
          Every article, filing, map, and profile on this site is built with them. You buy the fuel. I do the work.
        </div>

        {pct !== null && raised ? (
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 700 }}>
              <span style={{ display: "flex", color: "#fdf8ea" }}>
                {usdWhole(raised.monthCents)} fueled this month · {raised.monthCount}{" "}
                {raised.monthCount === 1 ? "person" : "people"}
              </span>
              <span style={{ display: "flex", color: PALETTE.goldBright }}>{pct}%</span>
            </div>
            <div style={{ display: "flex", height: 18, borderRadius: 18, background: "#1c2a4a", overflow: "hidden" }}>
              <div style={{ display: "flex", width: `${pct}%`, background: PALETTE.goldBright, borderRadius: 18 }} />
            </div>
          </div>
        ) : null}

        <div
          style={{
            marginTop: 26,
            paddingTop: 22,
            borderTop: "2px solid #3a557c",
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
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fdf8ea", display: "flex" }}>
              realryannichols.com/fuel
            </div>
          </div>
          <div style={{ fontSize: 16, color: "#a9b7d0", display: "flex" }}>
            not a handout · work, fueled in public
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
