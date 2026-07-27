import { ImageResponse } from "next/og";
import { getPersonBySlug } from "@/lib/case";
import { hasDisplayableJ6Portrait } from "@/lib/j6-portrait";
import { ogEmbeddableImage } from "@/lib/og-embed";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const p = await getPersonBySlug(slug);
  if (!p) {
    return new Response("Not found", { status: 404 });
  }
  const isJ6 = p.is_j6_defendant === true;
  const unclaimed =
    isJ6 && (p.claim_status === "unclaimed" || p.claim_status === "pending");
  const verified = isJ6 && p.claim_status === "verified";

  const eyebrow = unclaimed
    ? "Anti-Weaponization Case Builder · Unclaimed"
    : verified
      ? "Anti-Weaponization Case Builder · Verified"
      : "The J6 Case · Person of Record";
  const eyebrowBg = unclaimed ? "#b32419" : verified ? "#2d6a4f" : "#1d3a6b";
  const lead = unclaimed
    ? "Your profile is ready to be claimed. Free. Forever."
    : verified
      ? p.role ?? "Pardoned January 6 defendant"
      : p.role ?? "Person of record";

  // When a photo is set, the share card *is* the photo with a caption bar.
  // Embed it via ogEmbeddableImage — a relative photo_url (like Ryan's
  // /uploads/… path) makes ImageResponse throw a 500 otherwise.
  const photo = await ogEmbeddableImage(
    !isJ6 || hasDisplayableJ6Portrait(p) ? p.photo_url : null,
  );
  if (photo) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            position: "relative",
            background: "#1a1410",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={p.name}
            src={photo}
            width={1200}
            height={630}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: 1200,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "44px 56px",
              background: "rgba(0,0,0,0.62)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#f6efdf",
              }}
            >
              {eyebrow}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 68,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.0,
              }}
            >
              {p.name}
            </div>
            <div style={{ display: "flex", fontSize: 26, color: "#e8dcc0" }}>
              {lead}
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  const siteMark = await ogEmbeddableImage("/avatar.jpg");

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
            background: eyebrowBg,
            color: "#fdf8ea",
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            alignSelf: "flex-start",
          }}
        >
          {eyebrow}
        </div>

        <div
          style={{
            marginTop: 40,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            flex: 1,
          }}
        >
          {unclaimed ? (
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.2,
                color: "#7a6a52",
                display: "flex",
                fontWeight: 600,
              }}
            >
              Hey {p.name.split(/\s+/)[0]} —
            </div>
          ) : null}
          <div
            style={{
              fontSize: unclaimed ? 84 : 96,
              lineHeight: 1.0,
              color: "#1a1410",
              fontWeight: 700,
              display: "flex",
              letterSpacing: "-0.02em",
            }}
          >
            {p.name}
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.3,
              color: "#4a3e30",
              display: "flex",
              fontWeight: 600,
            }}
          >
            {lead}
          </div>
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
              alignItems: "center",
              gap: 14,
            }}
          >
            {/* Ryan's real face as the site mark — no monogram (his call). */}
            {siteMark ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                src={siteMark}
                width={48}
                height={48}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 48,
                  objectFit: "cover",
                }}
              />
            ) : null}
            <div
              style={{
                fontSize: 20,
                color: "#1a1410",
                fontWeight: 700,
                display: "flex",
              }}
            >
              The J6 Case · realryannichols.com
            </div>
          </div>
          {unclaimed ? (
            <div
              style={{
                display: "flex",
                background: "#b32419",
                color: "#fdf8ea",
                padding: "12px 20px",
                borderRadius: 8,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Claim it →
            </div>
          ) : null}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
