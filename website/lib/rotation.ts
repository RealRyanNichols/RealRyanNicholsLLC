// Daily rotation.
//
// One rule for the whole site: the same day shows the same thing to
// everybody, and tomorrow it changes. No randomness, no per-visitor
// shuffling — a deterministic index off the calendar day, so the server
// render and the client render always agree and share links stay honest.
//
// Ryan's line on this: the record stays put, the front porch moves.
// Articles, headers, and the case archive never rotate. The asking
// surfaces do.

// Days since epoch in America/Chicago — Ryan's day, not UTC's.
export function siteDayIndex(now: Date = new Date()): number {
  const chicago = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Chicago" }),
  );
  const utcMidnight = Date.UTC(
    chicago.getFullYear(),
    chicago.getMonth(),
    chicago.getDate(),
  );
  return Math.floor(utcMidnight / 86400000);
}

// Pick today's item from any bank. `offset` lets different surfaces move
// on different cycles so the whole page doesn't flip in lockstep.
export function pickForToday<T>(bank: readonly T[], offset = 0, now?: Date): T {
  if (bank.length === 0) throw new Error("pickForToday: empty bank");
  const i = (((siteDayIndex(now) + offset) % bank.length) + bank.length) % bank.length;
  return bank[i];
}

// Accent families the asking modules cycle through. Every value is an
// existing site token — no new colors, no rainbow. Same brand, different
// weight from one day to the next.
export const ACCENT_CYCLE = [
  { ring: "var(--color-support)", glow: "var(--color-support-glow)", label: "var(--color-accent)" },
  { ring: "var(--color-navy)", glow: "var(--color-blue-soft)", label: "var(--color-navy)" },
  { ring: "var(--color-accent)", glow: "var(--color-support-glow)", label: "var(--color-accent)" },
] as const;

export function accentForToday(offset = 0, now?: Date) {
  return pickForToday(ACCENT_CYCLE, offset, now);
}
