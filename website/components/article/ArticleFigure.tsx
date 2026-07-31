import { jsonString } from "@/lib/shortcodes";

// {{figure: {...}}} — in-body image. alt is REQUIRED: a figure without alt
// fails closed (renders nothing in production, a loud box in dev) because an
// unlabeled image is invisible to a screen reader and to search. Storage
// paths resolve against the public post-media bucket. Lazy loaded with
// explicit dimensions to prevent layout shift.

const WIDTHS: Record<string, string> = {
  full: "w-full",
  wide: "w-full sm:-mx-6 sm:w-[calc(100%+3rem)]",
  inline: "mx-auto w-full max-w-md",
};

function resolveSrc(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
    return src;
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/post-media/${src.replace(/^\/+/, "")}`;
}

export function ArticleFigure({ value }: { value: Record<string, unknown> }) {
  const src = jsonString(value, "src");
  const alt = jsonString(value, "alt");
  const caption = jsonString(value, "caption");
  const credit = jsonString(value, "credit");
  const width = jsonString(value, "width") ?? "full";

  if (!src) return null;
  if (!alt) {
    if (process.env.NODE_ENV !== "production") {
      return (
        <div className="not-prose my-7 rounded-md border-2 border-dashed border-[#8a6d1f] bg-[#f4efe4] p-4 text-sm font-bold text-[#8a6d1f]">
          Figure blocked: alt text is required. Describe what the image shows.
        </div>
      );
    }
    return null;
  }

  return (
    <figure className={`not-prose my-8 ${WIDTHS[width] ?? WIDTHS.full}`}>
      <div className="overflow-hidden rounded-lg border border-[#0b1b34]/20 bg-[#061020]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveSrc(src)}
          alt={alt}
          loading="lazy"
          width={1200}
          height={800}
          className="block h-auto w-full object-contain"
          style={{ maxHeight: 720 }}
        />
      </div>
      {caption || credit ? (
        <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          {caption ? (
            <span className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {caption}
            </span>
          ) : null}
          {credit ? (
            <span className="text-xs font-bold uppercase tracking-wider text-[#8a6d1f]">
              {credit}
            </span>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
