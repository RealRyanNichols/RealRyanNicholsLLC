import Link from "next/link";
import type { Media, Picture, Provenance } from "@/app/the-story/chapters";

// Server-rendered picture frames for /the-story. No client JS here; the
// reveal, develop, parallax and counter effects are driven by class names
// that components/story/StoryCinema.tsx toggles after mount.

function srcSetOf(p: Picture): string {
  return p.widths.map((w) => `${p.base}-${w}.jpg ${w}w`).join(", ");
}

function srcOf(p: Picture): string {
  const mid = p.widths[Math.min(1, p.widths.length - 1)];
  return `${p.base}-${mid}.jpg`;
}

export function Img({
  p,
  sizes,
  className,
  eager = false,
}: {
  p: Picture;
  sizes: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={srcOf(p)}
      srcSet={srcSetOf(p)}
      sizes={sizes}
      alt={p.alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}

const PROV_LABEL: Record<Provenance, string> = {
  real: "Real photo",
  scene: "Scene art · no people",
  paper: "Court scan",
};

export function ProvenanceTag({ kind, credit }: { kind: Provenance; credit: string }) {
  return (
    <span className={`st-prov st-prov--${kind}`}>
      {PROV_LABEL[kind]} · {credit}
    </span>
  );
}

const FRAME_SIZES = "(min-width: 900px) 52vw, 100vw";

export function ChapterMedia({ media }: { media: Media }) {
  switch (media.kind) {
    case "frame":
      return (
        <figure
          className={`st-frame ${media.ratio === "tall" ? "st-frame--tall" : ""}`}
          data-parallax
        >
          <Img p={media.picture} sizes={FRAME_SIZES} />
          {media.effect === "rain" ? (
            <>
              <span className="st-rain" aria-hidden />
              <span className="st-rain st-rain--2" aria-hidden />
            </>
          ) : null}
          {media.effect === "rings" ? (
            <span className="st-rings" aria-hidden>
              <i />
              <i />
              <i />
            </span>
          ) : null}
          <ProvenanceTag kind={media.provenance} credit={media.credit} />
        </figure>
      );

    case "grid":
      return (
        <div className="st-grid">
          {media.items.map((it, i) => (
            <figure
              key={it.picture.base}
              className="st-frame st-frame--square"
              data-reveal
              style={{ "--d": i } as React.CSSProperties}
            >
              <Img p={it.picture} sizes="(min-width: 900px) 26vw, 50vw" />
              <ProvenanceTag kind="real" credit={it.credit} />
            </figure>
          ))}
        </div>
      );

    case "monitor":
      return (
        <figure className="st-monitor" data-parallax>
          <Img p={media.picture} sizes={FRAME_SIZES} />
          <span className="st-monitor-tag" aria-hidden>
            <i />
            REC · VIDEO VISIT
          </span>
          <ProvenanceTag kind="real" credit={media.credit} />
        </figure>
      );

    case "papers":
      return (
        <div className="st-papers">
          {media.items.map((it, i) => (
            <Link
              key={it.picture.base}
              href={it.href}
              className="st-paper"
              style={{ "--d": i } as React.CSSProperties}
            >
              <Img p={it.picture} sizes="(min-width: 900px) 30vw, 60vw" />
              <span className="st-paper-label">{it.label}</span>
            </Link>
          ))}
        </div>
      );

    case "seal":
      return (
        <div className="st-seal" aria-hidden>
          <svg viewBox="0 0 400 400">
            <defs>
              <path
                id="st-seal-path"
                d="M200,200 m-152,0 a152,152 0 1,1 304,0 a152,152 0 1,1 -304,0"
              />
            </defs>
            <circle className="st-seal-ring" cx="200" cy="200" r="184" />
            <circle className="st-seal-ring2" cx="200" cy="200" r="120" />
            <g className="st-seal-text">
              <text>
                <textPath href="#st-seal-path" startOffset="0">
                  {media.ring}
                </textPath>
              </text>
            </g>
          </svg>
          <div className="st-seal-copy">
            <span className="st-seal-big">{media.center[0]}</span>
            <span className="st-seal-small">{media.center[1]}</span>
          </div>
        </div>
      );

    case "empty":
      return (
        <div className="st-empty" role="img" aria-label={media.note}>
          <span>{media.note}</span>
        </div>
      );

    case "portrait":
      return (
        <figure className="st-frame st-frame--portrait" data-parallax>
          <Img p={media.picture} sizes="(min-width: 900px) 40vw, 80vw" />
          <ProvenanceTag kind="real" credit={media.credit} />
        </figure>
      );

    case "archive":
      return null;
  }
}
