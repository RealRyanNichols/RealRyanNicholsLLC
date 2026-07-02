"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

// Modules a build can include — sparks "I could have X" in the buyer.
const INCLUDES = [
  "📖 Bible verses & devotionals",
  "🏈 Live sports scores",
  "🎲 Betting lines & odds",
  "🎮 Games",
  "👨‍👩‍👧‍👦 Family hub — photos & calendar",
  "💬 Private messaging",
  "🎥 Video & livestreams",
  "📰 News & updates",
  "💵 Finances & budgets",
  "✅ Habit & goal trackers",
  "📈 Business & sales metrics",
  "🙏 Prayer lists",
  "✨ Anything you can dream up",
];

const FOR_WHO = [
  "Pastors & ministries",
  "Small businesses & trades",
  "Creators & writers",
  "Candidates & causes",
  "Families who want a private hub",
  "Anyone tired of renting their presence on someone else's platform",
];

type Pulse = { reading_now: number; today: number; week: number };

function LiveViewers() {
  const [p, setP] = useState<Pulse | null>(null);
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.rpc("site_live_pulse");
        if (alive && data) setP(data as Pulse);
      } catch {
        /* never break the page */
      }
    };
    poll();
    const t = setInterval(poll, 12000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  if (!p) return null;
  const headline =
    p.reading_now >= 3
      ? `${p.reading_now} people on this site right now`
      : `${p.today.toLocaleString()} people here today`;
  return (
    <div className="mt-5 flex justify-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-white/[0.05] px-4 py-1.5 text-sm font-semibold text-slate-200">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        {headline} · {p.week.toLocaleString()} this week
      </span>
    </div>
  );
}

function ReserveButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "build-page" }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Couldn't start checkout.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }
  return (
    <div>
      <div className="mx-auto flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={checkout}
          disabled={loading}
          className="w-full rounded-2xl bg-yellow-400 px-8 py-4 text-lg font-black text-black transition hover:bg-yellow-300 disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Opening secure checkout…" : "Reserve your build — pay securely ($250) →"}
        </button>
        <Link
          href="/contact"
          className="w-full rounded-2xl border border-slate-600 bg-white/[0.05] px-8 py-4 text-center text-lg font-bold text-white transition hover:border-yellow-400 sm:w-auto"
        >
          Talk it through first
        </Link>
      </div>
      {error ? <p className="mt-2 text-center text-sm text-rose-300">{error}</p> : null}
      <p className="mt-3 text-center text-xs text-slate-400">
        Secure card checkout by Stripe. Prefer an invoice or a payment plan?{" "}
        <Link href="/contact" className="text-yellow-400 underline">
          Ask and I&apos;ll set it up.
        </Link>
      </p>
    </div>
  );
}

export function BuildSpecial() {
  return (
    <div className="bg-[#070b16] text-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <p className="text-center text-[11px] font-black uppercase tracking-[0.28em] text-yellow-400">
          Real Ryan Nichols LLC · Custom websites
        </p>

        <h1 className="mt-4 text-center text-4xl font-black leading-[1.05] text-white sm:text-6xl">
          I&apos;ll build you a website
          <br />
          just like <span className="text-yellow-400">this one.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-center text-base text-slate-300 sm:text-lg">
          The site you&apos;re on right now? I built it — on a fast, modern,
          fully-owned stack. Yours can do{" "}
          <strong className="text-white">anything you want</strong>, and it&apos;s
          yours: your domain, your audience, no algorithm in the middle.
        </p>

        <div className="mt-6 flex items-end justify-center gap-3">
          <span className="text-2xl text-slate-500 line-through sm:text-3xl">$997</span>
          <span className="text-6xl font-black leading-none text-yellow-400 sm:text-8xl">$250</span>
          <span className="pb-2 text-sm font-bold text-slate-300">founder rate</span>
        </div>
        <p className="mt-2 text-center text-sm text-slate-400">
          I take a limited number of builds at a time — the founder rate goes up
          as my calendar fills.
        </p>

        <LiveViewers />

        <div className="mt-10">
          <ReserveButton />
        </div>

        {/* Who it's for */}
        <h2 className="mt-16 text-center text-2xl font-black text-white sm:text-3xl">
          Who it&apos;s for
        </h2>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {FOR_WHO.map((w) => (
            <span
              key={w}
              className="rounded-full border border-slate-600 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100"
            >
              {w}
            </span>
          ))}
        </div>

        {/* Includes */}
        <h2 className="mt-16 text-center text-2xl font-black text-white sm:text-3xl">
          Load it with anything you want
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-300">
          Your site is a dashboard for <em>your</em> life or business. Mix and
          match — or bring me something not on this list. If you can picture it, I
          can build it.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {INCLUDES.map((item) => (
            <span
              key={item}
              className="rounded-full border border-slate-600 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100"
            >
              {item}
            </span>
          ))}
        </div>

        {/* What you get */}
        <h2 className="mt-16 text-center text-2xl font-black text-white sm:text-3xl">
          What you get
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Feature title="Your own platform" body="Your site, your domain, your audience — no algorithm in the middle, no platform that can ban you." />
          <Feature title="Built like mine" body="The same modern, fast, fully-mobile stack as this site. It will look professional." />
          <Feature title="Built to last" body="Clean code and a real database — not a template you'll outgrow in a month." />
        </div>

        {/* Timeline + what's not included */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-700 bg-white/[0.04] p-5">
            <h3 className="text-lg font-black text-yellow-400">Timeline</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              <li>✅ Access within <strong>3–7 days</strong> of kickoff.</li>
              <li>✅ I build it out and keep improving it over <strong>30 days</strong>.</li>
              <li>✅ After 30 days it&apos;s <strong>yours</strong> — or we set up a simple plan to keep building.</li>
              <li>✅ <strong>Warranty:</strong> if something I built breaks in normal use, I fix it.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-white/[0.04] p-5">
            <h3 className="text-lg font-black text-yellow-400">What&apos;s not included</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              <li>• Paid ad spend or ad management.</li>
              <li>• Third-party software subscriptions (domain, email, etc. — I&apos;ll point you to cheap options).</li>
              <li>• Ongoing content writing beyond first-set-up copy.</li>
              <li>• Anything illegal, deceptive, or that I wouldn&apos;t put my name on.</li>
              <li>• Big custom integrations beyond the base build — quoted separately, no surprises.</li>
            </ul>
          </div>
        </div>

        {/* Portfolio */}
        <h2 className="mt-16 text-center text-2xl font-black text-white sm:text-3xl">
          The portfolio? You&apos;re looking at it.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-300">
          This entire site — the feed, the case archive, the live visitor
          dashboard, the store, the checkout, the search — I built on the
          same stack I&apos;ll use for yours. Click around. If this site can do
          it, yours can too.
        </p>

        {/* Why it's worth it */}
        <h2 className="mt-16 text-center text-2xl font-black text-white sm:text-3xl">
          Why the founder rate is a steal
        </h2>
        <ul className="mx-auto mt-5 max-w-2xl space-y-3 text-slate-200">
          <li>
            🏷️ <strong>Agencies charge thousands for a custom build.</strong>{" "}
            You&apos;re getting one at the founder rate of{" "}
            <strong className="text-yellow-400">$250</strong>.
          </li>
          <li>
            🛠️ <strong>I actually build this stuff.</strong> You&apos;re looking
            at one of my sites right now. Anything with data or a feed, I&apos;ll
            build it.
          </li>
          <li>
            🔒 <strong>You own it.</strong> Not a rented page on a platform that
            can throttle or ban you — your domain, your data, your audience.
          </li>
          <li>
            📈 <strong>The rate rises as my calendar fills.</strong> Founder
            pricing is how early clients get in before the standard $997.
          </li>
        </ul>

        {/* Terms — DRAFT */}
        <div className="mt-16 rounded-2xl border border-slate-700 bg-white/[0.03] p-6">
          <h2 className="text-xl font-black text-white">Terms, in plain English</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              <strong className="text-white">Price:</strong> $250 founder rate, one flat fee for the base build described above.
            </li>
            <li>
              <strong className="text-white">Refunds:</strong> full refund any time before I start building. Once work has begun, the deposit covers time already spent — ask me and I&apos;ll be fair about it.
            </li>
            <li>
              <strong className="text-white">Cancellation:</strong> you can cancel anytime; you keep whatever is built to that point.
            </li>
            <li>
              <strong className="text-white">Ownership:</strong> after the 30-day build-out the site and its content are yours.
            </li>
            <li>
              This is a service agreement, not legal, tax, or financial advice.
            </li>
          </ul>
          <p className="mt-3 text-[11px] uppercase tracking-wider text-slate-500">
            Draft terms — final wording subject to a written agreement at kickoff.
          </p>
        </div>

        {/* Investigations — second paid service */}
        <h2 className="mt-16 text-center text-2xl font-black text-white sm:text-3xl">
          Need something investigated? Hire me for that too.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-300">
          I dig into matters that deserve daylight and publish thorough, sourced
          pieces. Straight up: I only put out what the evidence supports — real
          investigative work, not hit pieces.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-700 bg-white/[0.04] p-5">
            <div className="font-black text-yellow-400">🔎 Full investigation + article — $997</div>
            <p className="mt-1.5 text-sm text-slate-300">
              Bring me a matter that deserves daylight. I investigate it, we work
              it through on a call (about two hours across the project), and I
              write and publish a thorough, sourced piece.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-white/[0.04] p-5">
            <div className="font-black text-yellow-400">⚡ Quick package &amp; publish — $197</div>
            <p className="mt-1.5 text-sm text-slate-300">
              You already have the evidence — documents, screenshots, links. You
              just need it assembled into a clean, sourced article and put out,
              fast.
            </p>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-slate-300">
          Introductory pricing — it goes up as the site grows.{" "}
          <Link href="/contact" className="text-yellow-400 underline">
            Tell me what you&apos;ve got
          </Link>{" "}
          and I&apos;ll send a secure invoice.
        </p>

        {/* Book path — donations retired; the "no build needed" door sells. */}
        <div className="mt-16 rounded-2xl border border-slate-700 bg-white/[0.04] p-6 text-center">
          <h2 className="text-2xl font-black text-white sm:text-3xl">
            Don&apos;t need a build? Take the story home.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            The book covers the whole fight — pre-order it, read it first, and
            you&apos;ll own the story no platform can pull.
          </p>
          <div className="mt-5">
            <Link
              href="/book/preorder"
              className="inline-flex items-center rounded-full border-2 border-yellow-400 px-7 py-3 text-base font-black text-white transition hover:bg-yellow-400 hover:text-[#0a1326]"
            >
              Get the Book →
            </Link>
          </div>
        </div>

        <p className="mx-auto mt-12 max-w-xl text-center text-xs text-slate-400">
          Separate from the J6 work — J6 case profiles on RealRyanNichols.com are
          free forever. This build offer is for anyone who wants a website of
          their own.
        </p>
      </div>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-white/[0.04] p-5">
      <div className="font-black text-yellow-400">{title}</div>
      <p className="mt-1.5 text-sm text-slate-300">{body}</p>
    </div>
  );
}
