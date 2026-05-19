import { SITE } from "@/lib/site";

export function ShareRow({
  url,
  title,
  compact = false,
}: {
  url: string;
  title: string;
  compact?: boolean;
}) {
  const text = encodeURIComponent(title);
  const u = encodeURIComponent(url);
  const xHandle = SITE.socials.twitter.replace(/^@/, "");
  const via = xHandle ? `&via=${xHandle}` : "";
  const items = [
    { name: "X", href: `https://twitter.com/intent/tweet?text=${text}&url=${u}${via}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "Truth", href: `https://truthsocial.com/share?url=${u}` },
  ];
  if (compact) {
    return (
      <ul className="flex gap-2 text-xs">
        {items.map((i) => (
          <li key={i.name}>
            <a
              className="rounded-full border border-[var(--color-line)] px-2.5 py-1 hover:bg-white text-[var(--color-ink-soft)] hover:text-[var(--color-accent)]"
              href={i.href}
              target="_blank"
              rel="noopener"
            >
              {i.name}
            </a>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div>
      <p className="text-sm text-[var(--color-muted)] mb-2">Share this post</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((i) => (
          <li key={i.name}>
            <a
              className="inline-flex items-center rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm hover:bg-white text-[var(--color-ink-soft)] hover:text-[var(--color-accent)]"
              href={i.href}
              target="_blank"
              rel="noopener"
            >
              Share on {i.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
