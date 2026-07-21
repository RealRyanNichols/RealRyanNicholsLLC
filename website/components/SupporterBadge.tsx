export function SupporterBadge({ size = "sm" }: { size?: "xs" | "sm" | "md" }) {
  const cls =
    size === "xs"
      ? "text-[9px] px-1.5 py-px"
      : size === "md"
        ? "text-xs px-2.5 py-1"
        : "text-[10px] px-2 py-0.5";
  return (
    <span
      title="Supporter"
      className={`inline-flex items-center gap-1 rounded-full bg-amber-950/40 border border-amber-600 text-amber-300 font-bold uppercase tracking-wider ${cls}`}
    >
      <span aria-hidden>★</span>
      Supporter
    </span>
  );
}
