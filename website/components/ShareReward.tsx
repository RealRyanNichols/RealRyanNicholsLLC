"use client";

// The little burst that fires the instant a share completes. Absolutely
// positioned, so the nearest positioned ancestor anchors it — render it inside
// a `relative` container. It's purely decorative (aria-hidden) and respects
// prefers-reduced-motion via the CSS in globals.css.

const SPARKS = [
  { x: "-22px", y: "-26px" },
  { x: "0px", y: "-34px" },
  { x: "22px", y: "-26px" },
  { x: "-14px", y: "-14px" },
  { x: "14px", y: "-14px" },
];

export function ShareReward({
  show,
  label = "Thank you for spreading the word",
}: {
  show: boolean;
  label?: string;
}) {
  if (!show) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-0 z-40 -translate-x-1/2 -translate-y-full"
    >
      <div className="relative flex flex-col items-center">
        <span className="animate-share-pop whitespace-nowrap rounded-full border border-[var(--color-accent)] bg-[var(--color-paper)] px-3 py-1 text-[11px] font-bold text-[var(--color-accent)] shadow-lg">
          {label} 🇺🇸
        </span>
        <span className="absolute left-1/2 top-full h-0 w-0">
          {SPARKS.map((s, i) => (
            <span
              key={i}
              className="share-spark absolute h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
              style={
                {
                  ["--spark-x" as string]: s.x,
                  ["--spark-y" as string]: s.y,
                  animationDelay: `${i * 30}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      </div>
    </div>
  );
}
