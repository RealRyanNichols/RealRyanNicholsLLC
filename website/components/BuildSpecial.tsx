"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const VENMO = "https://venmo.com/u/TheRealRyanNichols";
const CASHAPP = "https://cash.app/$TheRealRyanNichols";
const EMAIL =
  "mailto:ryan@realryannichols.com?subject=I%20want%20a%20build%20(%24250%20today)&body=Here%27s%20what%20I%20want%20built%20and%20what%20I%20want%20on%20it%3A%0A%0A";

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

const KEYFRAMES = `
@keyframes rrn-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes rrn-blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0.2; } }
@keyframes rrn-glow {
  0%,100% { box-shadow: 0 0 18px rgba(250,204,21,0.45); }
  50% { box-shadow: 0 0 44px rgba(250,204,21,0.95); }
}
`;

function Marquee() {
  const text = "🔴 TODAY ONLY  •  $250 (NORMALLY $997)  •  ONLY 6 SPOTS  •  PAY NOW  •  ";
  return (
    <div className="overflow-hidden bg-red-600 py-2">
      <div
        className="inline-block whitespace-nowrap text-xs sm:text-sm font-black uppercase tracking-widest text-white"
        style={{ animation: "rrn-marquee 22s linear infinite" }}
      >
        <span>{text.repeat(6)}</span>
        <span>{text.repeat(6)}</span>
      </div>
    </div>
  );
}

function useMidnightCountdown() {
  const [left, setLeft] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const ms = Math.max(0, end.getTime() - now.getTime());
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      setLeft(`${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return left;
}

function PayButtons() {
  return (
    <div className="mt-5 mx-auto flex max-w-sm flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center">
      <a
        href={VENMO}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full sm:w-auto rounded-2xl bg-[#3D95CE] px-8 py-5 text-xl font-black text-white transition hover:scale-[1.03]"
        style={{ animation: "rrn-glow 1.6s ease-in-out infinite" }}
      >
        Pay with Venmo →
        <span className="block text-sm font-bold opacity-90">@TheRealRyanNichols</span>
      </a>
      <a
        href={CASHAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full sm:w-auto rounded-2xl bg-[#00C244] px-8 py-5 text-xl font-black text-white transition hover:scale-[1.03]"
        style={{ animation: "rrn-glow 1.6s ease-in-out infinite" }}
      >
        Pay with Cash App →
        <span className="block text-sm font-bold opacity-90">$TheRealRyanNichols</span>
      </a>
    </div>
  );
}

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
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        {headline} · {p.week.toLocaleString()} this week
      </span>
    </div>
  );
}

export function BuildSpecial() {
  const countdown = useMidnightCountdown();
  return (
    <div className="bg-[#070b16] text-white">
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <Marquee />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <p
          className="text-center text-xs sm:text-sm font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] text-yellow-400"
          style={{ animation: "rrn-blink 1s steps(1,end) infinite" }}
        >
          ⚡ Today only — when the clock hits zero, it&apos;s gone ⚡
        </p>

        <h1 className="mt-5 text-center text-4xl sm:text-6xl font-black leading-[1.05] text-white">
          I&apos;ll build you a website
          <br />
          just like <span className="text-yellow-400">this one.</span>
        </h1>

        <p className="mt-5 text-center text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
          The site you&apos;re on right now? I built it. Yours can do <strong className="text-white">anything you want</strong> — and today only, the next <strong className="text-white">6 people</strong> get one for...
        </p>

        <div className="mt-6 flex items-end justify-center gap-3">
          <span className="text-2xl sm:text-3xl text-slate-500 line-through">$997</span>
          <span className="text-6xl sm:text-8xl font-black leading-none text-yellow-400">$250</span>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label="Price today" value="$250" sub="normally $997" highlight />
          <Stat label="Spots" value="6" sub="first come, first served" />
          <Stat label="Offer ends in" value={countdown ?? "today"} sub="midnight tonight" pulse />
        </div>

        <LiveViewers />

        <div className="mt-12 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-black">
            Lock your spot — send $250 now
          </p>
          <PayButtons />
          <p className="mt-5 text-sm text-slate-300">
            Put <strong className="text-white">your email in the payment note</strong>, then{" "}
            <a className="text-yellow-400 underline" href={EMAIL}>
              email me
            </a>{" "}
            to claim your spot and tell me what you want built.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Want to split it up? <a className="text-yellow-400 underline" href={EMAIL}>Email me</a> and we&apos;ll set up a payment plan that fits.
          </p>
        </div>

        {/* Load it with anything — module options */}
        <h2 className="mt-16 text-center text-2xl sm:text-3xl font-black text-white">
          Load it with anything you want
        </h2>
        <p className="mt-3 text-center text-slate-300 max-w-2xl mx-auto">
          Your site is a dashboard for <em>your</em> life or business. Mix and match — or bring me something not on this list. If you can picture it, I can build it.
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

        {/* Reasons to buy */}
        <h2 className="mt-16 text-center text-2xl sm:text-3xl font-black text-white">
          Why this is a no-brainer
        </h2>
        <ul className="mt-5 mx-auto max-w-2xl space-y-3 text-slate-200">
          <li>
            🏷️ <strong>Agencies charge thousands for a custom build.</strong> You&apos;re getting one for <strong className="text-yellow-400">$250</strong> — today.
          </li>
          <li>
            💸 <strong>$250 doesn&apos;t cover the hours I&apos;ll put in.</strong> I&apos;ll spend more time on your build than this pays me. I&apos;m taking the hit because rent is due <em>today</em> — not because it&apos;s what the work is worth.
          </li>
          <li>
            🛠️ <strong>I actually build this stuff.</strong> You&apos;re looking at one of my sites right now. Anything with data or a feed, I&apos;ll build it.
          </li>
          <li>
            🚫 <strong>This won&apos;t come back.</strong> I&apos;ve got a job and other work going — I won&apos;t run a deal like this again. One time, today only.
          </li>
        </ul>

        {/* What you get */}
        <h2 className="mt-16 text-center text-2xl sm:text-3xl font-black text-white">What you get</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Feature title="Your own platform" body="Your site, your domain, your audience — no algorithm in the middle, no platform that can ban you." />
          <Feature title="Built like mine" body="The same modern stack as this site: fast, clean, fully mobile, professional." />
          <Feature title="Genuinely sharp" body="I will not put my name on a cheap build. It will look great." />
        </div>

        {/* Terms */}
        <h2 className="mt-16 text-center text-2xl sm:text-3xl font-black text-white">The deal, in plain terms</h2>
        <ul className="mt-5 mx-auto max-w-2xl space-y-2.5 text-slate-200">
          <li>✅ <strong>$250</strong> — today only (normally $997).</li>
          <li>✅ <strong>6 spots.</strong> When they&apos;re gone, they&apos;re gone.</li>
          <li>✅ You&apos;ll have <strong>access within 3–7 days.</strong></li>
          <li>✅ I build it out and keep improving it over <strong>30 days.</strong></li>
          <li>✅ After 30 days it&apos;s <strong>yours</strong> — or we set up a simple plan to keep building.</li>
          <li>✅ <strong>Warranty:</strong> if something I built breaks in normal use, I fix it.</li>
        </ul>

        {/* Investigations — second paid service */}
        <h2 className="mt-16 text-center text-2xl sm:text-3xl font-black text-white">
          Need something investigated? Hire me for that too.
        </h2>
        <p className="mt-3 text-center text-slate-300 max-w-2xl mx-auto">
          I dig into matters that deserve daylight and publish thorough, sourced pieces. Straight up: I only put out what the evidence supports — real investigative work, not hit pieces.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-700 bg-white/[0.04] p-5">
            <div className="font-black text-yellow-400">🔎 Full investigation + article — $997</div>
            <p className="mt-1.5 text-sm text-slate-300">
              Bring me a matter that deserves daylight. I investigate it, we get on the phone to work it through (about two hours across the project), and I write and publish a thorough, sourced piece.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-white/[0.04] p-5">
            <div className="font-black text-yellow-400">⚡ Quick package &amp; publish — $197</div>
            <p className="mt-1.5 text-sm text-slate-300">
              You already have the evidence — documents, screenshots, links. You just need someone to assemble it into a clean, sourced article and put it out, fast.
            </p>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Introductory pricing — it goes up as the site grows. To commission one,{" "}
          <a className="text-yellow-400 underline" href={EMAIL}>email me</a> or pay via Venmo / Cash App with the details in the note.
        </p>

        {/* Donate path for people who can't use a build but want to help */}
        <div className="mt-16 rounded-2xl border border-slate-700 bg-white/[0.04] p-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Don&apos;t need a build? You can still help.</h2>
          <p className="mt-3 text-slate-300 max-w-2xl mx-auto">
            Six builds at $250 is the <strong className="text-white">$1,500 I need for rent today.</strong> If you can&apos;t use a website but want to help me get there, any amount counts — every dollar matters.
          </p>
          <div className="mt-5 mx-auto flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <a
              href={VENMO}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto rounded-full border-2 border-[#3D95CE] px-7 py-3 text-base font-black text-white transition hover:bg-[#3D95CE]"
            >
              Donate any amount · Venmo
            </a>
            <a
              href={CASHAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto rounded-full border-2 border-[#00C244] px-7 py-3 text-base font-black text-white transition hover:bg-[#00C244]"
            >
              Donate any amount · Cash App
            </a>
          </div>
        </div>

        <p className="mt-12 mx-auto max-w-xl text-center text-xs text-slate-400">
          Separate from my J6 work — J6 case profiles on RealRyanNichols.com are free forever. This $250 offer is for anyone who wants a website of their own.
        </p>

        <div className="mt-8 text-center">
          <a
            href={VENMO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full max-w-sm sm:w-auto rounded-full bg-yellow-400 px-10 py-4 text-xl font-black text-black transition hover:bg-yellow-300"
            style={{ animation: "rrn-glow 1.6s ease-in-out infinite" }}
          >
            Claim a spot — $250 →
          </a>
          <p
            className="mt-3 text-sm font-bold text-yellow-400"
            style={{ animation: "rrn-blink 1.2s steps(1,end) infinite" }}
          >
            ⏳ {countdown ? `Ends in ${countdown}` : "Today only"}
          </p>
        </div>
      </div>

      <Marquee />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
  pulse,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  pulse?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 text-center ${
        highlight ? "border-yellow-400 bg-yellow-400/10" : "border-slate-700 bg-white/[0.04]"
      }`}
    >
      <div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">{label}</div>
      <div
        className={`mt-1 text-2xl sm:text-3xl font-black tabular-nums ${
          highlight ? "text-yellow-400" : "text-white"
        } ${pulse ? "animate-pulse" : ""}`}
      >
        {value}
      </div>
      {sub ? <div className="mt-1 text-xs text-slate-400">{sub}</div> : null}
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
