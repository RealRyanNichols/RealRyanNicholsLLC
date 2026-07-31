// {{callout: kind | text}} — the read-that-again block. Three kinds:
//   pull  big pull quote, gold rule above, display serif
//   key   key point, navy card with gold left rule
//   ask   what I need from you, navy card with one flat CTA button
// Emphasis, not an alert. No red, no warning triangles, no em dashes.

const URL_RE = /https?:\/\/\S+|\/[a-z0-9-/]+/i;

export function Callout({ args }: { args: string[] }) {
  const kind = (args[0] ?? "").toLowerCase();
  const text = args.slice(1).join(" | ").trim();
  if (!text) return null;

  if (kind === "pull") {
    return (
      <aside className="not-prose my-9">
        <div className="mb-3 h-1 w-14 rounded bg-[#e1bd5b]" aria-hidden />
        <p className="font-display text-2xl font-black leading-snug tracking-tight text-[var(--color-ink)] sm:text-3xl">
          {text}
        </p>
      </aside>
    );
  }

  if (kind === "ask") {
    const linkMatch = text.match(URL_RE);
    const link = linkMatch?.[0] ?? null;
    const display = link ? text.replace(link, "").replace(/\s{2,}/g, " ").trim() : text;
    return (
      <aside className="not-prose my-8 rounded-lg border-l-4 border-[#e1bd5b] bg-[#0b1b34] p-5 text-[#f4efe4] sm:p-6">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#e1bd5b]">
          What I need from you
        </p>
        <p className="mt-2 text-base font-bold leading-snug sm:text-lg">{display}</p>
        {link ? (
          <a
            href={link}
            className="mt-4 inline-flex min-h-11 items-center rounded-md bg-[#e1bd5b] px-5 text-sm font-black text-[#061020] no-underline transition hover:bg-[#f0d48a]"
          >
            Do it now
          </a>
        ) : null}
      </aside>
    );
  }

  // Default: key point.
  return (
    <aside className="not-prose my-8 rounded-lg border-l-4 border-[#e1bd5b] bg-[#0b1b34] p-5 text-[#f4efe4] sm:p-6">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#e1bd5b]">
        Key point
      </p>
      <p className="mt-2 text-base font-bold leading-snug sm:text-lg">{text}</p>
    </aside>
  );
}
