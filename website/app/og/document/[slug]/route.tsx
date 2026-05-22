import { ImageResponse } from "next/og";
import { format } from "date-fns";
import { getDocumentBySlug } from "@/lib/case";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const d = await getDocumentBySlug(slug);
  if (!d) {
    return new Response("Not found", { status: 404 });
  }
  const when = d.document_date
    ? format(new Date(d.document_date), "MMM d, yyyy")
    : null;

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
          <div
            style={{
              display: "flex",
              background: "#2d6a4f",
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
            Evidence on file · {d.doc_type ?? "document"}
          </div>
          {when ? (
            <div
              style={{
                fontSize: 18,
                color: "#7a6a52",
                fontWeight: 700,
                display: "flex",
              }}
            >
              {when}
            </div>
          ) : null}
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
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.05,
              color: "#1a1410",
              fontWeight: 700,
              display: "flex",
              letterSpacing: "-0.015em",
            }}
          >
            {d.title}
          </div>
          {d.description ? (
            <div
              style={{
                fontSize: 22,
                lineHeight: 1.4,
                color: "#4a3e30",
                display: "flex",
              }}
            >
              {d.description.slice(0, 200)}
              {d.description.length > 200 ? "…" : ""}
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
              alignItems: "center",
              gap: 14,
            }}
          >
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
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              RN
            </div>
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
          {d.source ? (
            <div
              style={{
                fontSize: 16,
                color: "#7a6a52",
                display: "flex",
              }}
            >
              Source: {d.source}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
