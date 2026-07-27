import type { Metadata } from "next";
import Link from "next/link";
import { DAYS, TOTAL_DAYS } from "@/lib/biglie/days";
import { renderDayEmail } from "@/lib/biglie/email-shell";

export const metadata: Metadata = {
  title: "The BIG Lie — funnel walkthrough",
  robots: { index: false, follow: false },
};

const DARK = "bg-[#071126] text-[#fdf8ea]";
const CARD = "rounded-xl border border-[#203a64] bg-[#0b1830] p-5";
const KICK = "text-[10px] font-black uppercase tracking-[0.16em] text-[#e1bd5b]";

const STEPS = [
  {
    n: "01",
    t: "They land on /thebiglie",
    d: "The teaser page. The inventory of what you had, the C2B verification, the four came-true reveals side by side, the charts, and the gate.",
    href: "/thebiglie",
    live: true,
  },
  {
    n: "02",
    t: "They give name + email (phone optional)",
    d: "Posts to your existing /api/book-signup. Phone only goes to /api/subscribe when they tick SMS consent, with the TCPA language attached.",
    live: true,
  },
  {
    n: "03",
    t: "The report opens instantly",
    d: "No waiting on an email to arrive. The gate reveals the read button on success, and the report is reachable directly either way. Free, always free.",
    href: "/thebiglie/report/index.html",
    live: true,
  },
  {
    n: "04",
    t: "Day 1 hits their inbox in seconds",
    d: "/api/biglie/enroll fires the moment the gate succeeds. Verified live with a real send.",
    live: true,
  },
  {
    n: "05",
    t: "Days 2 to 30, one per day",
    d: "A cron checks every 15 minutes and advances anyone whose 20-hour floor has passed. Caps 40 sends a tick so nothing stampedes.",
    live: true,
  },
  {
    n: "06",
    t: "They tap a poll answer",
    d: "One tap, straight from the email, no login. Ten polls across the 30 days. Recorded in Supabase.",
    live: true,
  },
  {
    n: "07",
    t: "A profile builds in Notion",
    d: "Each answer writes a segment and a recommended next action to your Subscriber Profiles database.",
    live: false,
    note: "Needs NOTION_API_KEY + NOTION_BIGLIE_DB in Vercel",
  },
  {
    n: "08",
    t: "They buy Fighting Shadows",
    d: "Day 26 makes the ask and routes into the funnel you already had. $17.76 digital, $79 signed, $250 founding supporter.",
    href: "/book",
    live: true,
  },
  {
    n: "09",
    t: "They send you receipts",
    d: "Day 25 turns a reader into a source. Anonymous accepted, everything labeled Needs Authentication until verified.",
    href: "/tell-your-story",
    live: true,
  },
];

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const sp = await searchParams;
  const dayNum = Math.min(Math.max(Number(sp.day ?? 1) || 1, 1), TOTAL_DAYS);
  const day = DAYS.find((d) => d.day === dayNum) ?? DAYS[0];
  const html = renderDayEmail(day, "preview@realryannichols.com");
  const polls = day.blocks.filter((b) => b.type === "poll").length;

  return (
    <article className={`rrn-page ${DARK}`}>
      {/* header */}
      <section className="border-b border-[#203a64]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className={KICK}>Internal walkthrough · not indexed</p>
          <h1 className="mt-3 font-display text-4xl font-black text-[#fdf8ea] sm:text-5xl">
            The BIG Lie, end to end.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#cfd9ea]">
            Everything that happens from the moment somebody lands on the page to
            the moment they send you evidence back. Every email below is rendered
            by the exact same code that sends it, so what you see here is what
            lands in their inbox.
          </p>
        </div>
      </section>

      {/* funnel map */}
      <section className="border-b border-[#203a64]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-2xl font-black text-[#fdf8ea] sm:text-3xl">
            The funnel
          </h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className={`${CARD} ${s.live ? "" : "border-[#e0913f]"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-display text-2xl font-black tabular-nums text-[#e1bd5b]">
                    {s.n}
                  </span>
                  <span
                    className="rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em]"
                    style={{
                      color: s.live ? "#4cc38a" : "#e0913f",
                      borderColor: s.live ? "#4cc38a" : "#e0913f",
                    }}
                  >
                    {s.live ? "Live" : "Waiting on you"}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-lg font-black leading-snug text-[#fdf8ea]">
                  {s.t}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[#9fb2d0]">
                  {s.d}
                </p>
                {s.note && (
                  <p className="mt-2 text-xs font-bold text-[#e0913f]">{s.note}</p>
                )}
                {s.href && (
                  <a
                    href={s.href}
                    className="mt-3 inline-block text-xs font-black uppercase tracking-[0.08em] text-[#e1bd5b] underline"
                  >
                    Open it
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* email browser */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-2xl font-black text-[#fdf8ea] sm:text-3xl">
            All 30 emails
          </h2>
          <p className="mt-2 text-sm font-semibold text-[#9fb2d0]">
            Click any day. This is the real render, not a mockup.
          </p>

          {/* day picker */}
          <div className="mt-6 flex flex-wrap gap-2">
            {DAYS.map((d) => {
              const on = d.day === dayNum;
              return (
                <Link
                  key={d.day}
                  href={`/thebiglie/preview?day=${d.day}`}
                  className={`rounded-lg border px-3 py-2 text-sm font-black tabular-nums transition ${
                    on
                      ? "border-[#e1bd5b] bg-[#e1bd5b] text-[#071126]"
                      : "border-[#203a64] bg-[#0b1830] text-[#cfd9ea] hover:border-[#e1bd5b]"
                  }`}
                >
                  {d.day}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            {/* meta */}
            <div className="space-y-3">
              <div className={CARD}>
                <p className={KICK}>Day {day.day} of 30</p>
                <h3 className="mt-2 font-display text-xl font-black text-[#fdf8ea]">
                  {day.title}
                </h3>
              </div>
              <div className={CARD}>
                <p className={KICK}>Subject line</p>
                <p className="mt-2 text-base font-bold text-[#fdf8ea]">
                  {day.subject}
                </p>
              </div>
              <div className={CARD}>
                <p className={KICK}>Preview text</p>
                <p className="mt-2 text-sm font-semibold text-[#cfd9ea]">
                  {day.preview}
                </p>
              </div>
              <div className={CARD}>
                <p className={KICK}>In this email</p>
                <p className="mt-2 text-sm font-semibold text-[#cfd9ea]">
                  {day.blocks.length} blocks
                  {polls > 0 ? ` · ${polls} poll` : " · no poll"}
                </p>
              </div>
              <div className="flex gap-2">
                {dayNum > 1 && (
                  <Link
                    href={`/thebiglie/preview?day=${dayNum - 1}`}
                    className="flex-1 rounded-lg border-2 border-[#203a64] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.08em] text-[#cfd9ea]"
                  >
                    ← Day {dayNum - 1}
                  </Link>
                )}
                {dayNum < TOTAL_DAYS && (
                  <Link
                    href={`/thebiglie/preview?day=${dayNum + 1}`}
                    className="flex-1 rounded-lg bg-[#e1bd5b] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.08em] text-[#071126]"
                  >
                    Day {dayNum + 1} →
                  </Link>
                )}
              </div>
            </div>

            {/* the email itself */}
            <div className="overflow-hidden rounded-2xl border border-[#203a64] bg-[#05060f]">
              <div className="border-b border-[#203a64] px-4 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7b8db0]">
                  Rendered by the live send code
                </p>
              </div>
              <iframe
                title={`Day ${day.day} email`}
                srcDoc={html}
                className="h-[900px] w-full border-0 bg-[#05060f]"
              />
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
