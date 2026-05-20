import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const revalidate = 3600;

// Single 1200×630 social card used as the default Open Graph image
// across the site. Facebook, Twitter, LinkedIn, iMessage, Slack, etc.
// all expect ~1.91:1 — sticking to those exact dimensions guarantees
// nothing gets cropped.
export async function GET() {
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
          background:
            "linear-gradient(135deg, #14213d 0%, #0f1a30 50%, #1a0a0a 100%)",
          fontFamily: "serif",
          color: "#f5f0e1",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 72,
              background: "#dc2626",
              color: "#0a0a0c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 700,
              boxShadow: "0 0 32px rgba(220,38,38,0.5)",
            }}
          >
            RN
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, color: "#f5f0e1", fontWeight: 600, display: "flex" }}>
              {SITE.name}
            </div>
            <div style={{ fontSize: 16, color: "#9aa3b8", display: "flex", marginTop: 2 }}>
              realryannichols.com
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 72,
              lineHeight: 1.0,
              color: "#ffffff",
              fontWeight: 700,
              display: "flex",
              letterSpacing: "-0.02em",
            }}
          >
            Ryan Nichols
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 22,
              color: "#e8dfc9",
            }}
          >
            <div style={{ display: "flex" }}>· United States Marine Corps Veteran</div>
            <div style={{ display: "flex" }}>· Search and Rescue Specialist</div>
            <div style={{ display: "flex" }}>· Jan 6th Pardoned Defendant</div>
            <div style={{ display: "flex" }}>· Weaponized and tortured by Biden DOJ</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            background: "#dc2626",
            padding: "14px 20px",
            borderRadius: 8,
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.01em",
            boxShadow: "0 0 24px rgba(220,38,38,0.4)",
          }}
        >
          ONLY JAN 6TH DEFENDANT WHOSE JUDGE ADMITTED MULTIPLE DUE PROCESS VIOLATIONS
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
