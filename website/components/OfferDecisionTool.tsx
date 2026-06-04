"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BuyButton } from "@/components/BuyButton";

const GOALS = [
  "Get clarity",
  "Collect leads",
  "Take payments",
  "Build software",
  "Fix attention",
] as const;

const TIMELINES = ["This week", "This month", "Still exploring"] as const;

export function OfferDecisionTool({
  slug,
  name,
  price,
  briefHref,
}: {
  slug: string;
  name: string;
  price: string;
  briefHref: string;
}) {
  const [goal, setGoal] = useState<(typeof GOALS)[number]>("Get clarity");
  const [timeline, setTimeline] = useState<(typeof TIMELINES)[number]>("This week");
  const [hasProof, setHasProof] = useState(true);
  const [needsBuild, setNeedsBuild] = useState(true);

  const score = useMemo(() => {
    let next = 44;
    if (timeline === "This week") next += 18;
    if (timeline === "This month") next += 10;
    if (hasProof) next += 14;
    if (needsBuild) next += 18;
    if (goal === "Take payments" || goal === "Build software") next += 6;
    return Math.min(next, 100);
  }, [goal, timeline, hasProof, needsBuild]);

  const recommendation =
    score >= 76
      ? "You probably need the paid lane now. Buy the offer or send the brief so Ryan can see the context."
      : score >= 58
        ? "You have enough to start. Send the brief if there are private details, or buy if the offer already matches."
        : "Start by giving Ryan the facts. The right offer may become obvious after the first pass.";

  return (
    <div className="rounded-lg border-2 border-[var(--color-blue)] bg-[#f7fbff] p-4 shadow-[0_14px_36px_rgba(29,58,107,0.12)] sm:p-5">
      <p className="text-xs font-black uppercase tracking-normal text-[var(--color-blue)]">
        Quick fit check
      </p>
      <h2 className="mt-2 font-display text-2xl font-black tracking-normal">
        Is {name} the right next move?
      </h2>

      <div className="mt-4 grid gap-4">
        <div>
          <p className="text-sm font-black text-[var(--color-ink)]">What do you need most?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {GOALS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setGoal(item)}
                className={[
                  "rrn-tap rounded-full border px-3 py-2 text-xs font-black transition",
                  goal === item
                    ? "border-[var(--color-blue)] bg-[var(--color-blue)] text-white"
                    : "border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:border-[var(--color-blue)]",
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-black text-[var(--color-ink)]">How urgent is it?</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {TIMELINES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTimeline(item)}
                className={[
                  "rrn-tap min-h-11 rounded-lg border px-2 text-xs font-black transition",
                  timeline === item
                    ? "border-[var(--color-support)] bg-[var(--color-support-soft)] text-[var(--color-ink)]"
                    : "border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:border-[var(--color-support)]",
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={hasProof}
              onChange={(e) => setHasProof(e.target.checked)}
              className="h-4 w-4"
            />
            I have links, facts, screenshots, files, or examples.
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={needsBuild}
              onChange={(e) => setNeedsBuild(e.target.checked)}
              className="h-4 w-4"
            />
            I need a page, system, checkout, dashboard, or tool.
          </label>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-[#b8c9e6] bg-white p-4">
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm font-black uppercase tracking-normal text-[var(--color-muted)]">
            Action score
          </p>
          <p className="font-mono text-4xl font-black text-[var(--color-blue)]">
            {score}
          </p>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#d9e2f2]">
          <div
            className="h-full rounded-full bg-[var(--color-blue)] transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          {recommendation}
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <BuyButton
          slug={slug}
          label={`Pay ${price}`}
          className="w-full rounded-lg bg-[var(--color-support)] px-5 py-3 text-sm font-black text-[#1a1410] shadow-[0_10px_24px_rgba(200,155,47,0.24)] transition hover:bg-[#e1b94e] disabled:opacity-60"
        />
        <Link
          href={briefHref}
          className="rrn-tap inline-flex items-center justify-center rounded-lg border-2 border-[var(--color-blue)] bg-white px-5 py-3 text-sm font-black text-[var(--color-blue)] transition hover:bg-[var(--color-blue-soft)]"
        >
          Send the brief first
        </Link>
      </div>
    </div>
  );
}
