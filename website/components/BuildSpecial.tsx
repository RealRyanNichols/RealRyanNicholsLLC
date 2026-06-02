"use client";

import { useEffect, useState } from "react";

const VENMO = "https://venmo.com/u/TheRealRyanNichols";
const CASHAPP = "https://cash.app/$TheRealRyanNichols";
const EMAIL =
  "mailto:ryan@realryannichols.com?subject=I%20want%20a%20website%20(%24250%20today)&body=Here%27s%20what%20I%20want%20built%3A%0A%0A";

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
        className="inline-block whitespace-nowrap text-sm font-black uppercase tracking-widest text-white"
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

export function BuildSpecial() {
  const countdown = useMidnightCountdown();
  return (
    <div className="bg-[#070b16] text-white">
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <Marquee />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <p
          className="text-center text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-yellow-400"
          style={{ animation: "rrn-blink 1s steps(1,end) infinite" }}
        >
          ⚡ Today only — when the clock hits zero, it&apos;s gone ⚡
        </p>

        <h1 className="mt-5 text-center text-4xl sm:text-6xl font-black leading-[1.04]">
          I&apos;ll build you a website
          <br />
          just like <span className="text-yellow-400">this one.</span>
        </h1>

        <p className="mt-5 text-center text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
          The site you&apos;re on right now? I built it myself. Today, the next{" "}
          <strong className="text-white">6 people</strong> get one like it — for a fraction of what it costs.
        </p>

        <div className="mt-6 flex items-end justify-center gap-3">
          <span className="text-3xl text-slate-500 line-through">$997</span>
          <span className="text-6xl sm:text-8xl font-black leading-none text-yellow-400">$250</span>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label="Price today" value="$250" sub="normally $997" highlight />
          <Stat label="Spots" value="6" sub="first come, first served" />
          <Stat label="Offer ends in" value={countdown ?? "today"} sub="midnight tonight" pulse />
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-black">
            Lock your spot — send $250 now
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={VENMO}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-[#3D95CE] px-8 py-5 text-xl font-black text-white transition hover:scale-[1.03]"
              style={{ animation: "rrn-glow 1.6s ease-in-out infinite" }}
            >
              Pay with Venmo →
              <span className="block text-sm font-bold opacity-90">@TheRealRyanNichols</span>
            </a>
            <a
              href={CASHAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-[#00C244] px-8 py-5 text-xl font-black text-white transition hover:scale-[1.03]"
              style={{ animation: "rrn-glow 1.6s ease-in-out infinite" }}
            >
              Pay with Cash App →
              <span className="block text-sm font-bold opacity-90">$TheRealRyanNichols</span>
            </a>
          </div>
          <p className="mt-5 text-sm text-slate-300">
            Put <strong className="text-white">your email in the payment note</strong>, then{" "}
            <a className="text-yellow-400 underline" href={EMAIL}>
              email me
            </a>{" "}
            to claim your spot and tell me what you want built.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Short on cash? I take <strong>Klarna</strong> &amp; <strong>Afterpay</strong>, and I&apos;ll set up a payment plan — just email me.
          </p>
        </div>

        <h2 className="mt-14 text-center text-2xl font-black">What you get</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Feature title="Your own platform" body="Your feed, your profile, your domain, your audience — no algorithm, no platform that can ban you for telling the truth." />
          <Feature title="Built like mine" body="The same modern stack as this site: fast, clean, mobile, professional." />
          <Feature title="Genuinely sharp" body="I will not put my name on a cheap website. It will look great." />
        </div>

        <h2 className="mt-14 text-center text-2xl font-black">The deal, in plain terms</h2>
        <ul className="mt-5 mx-auto max-w-2xl space-y-2.5 text-slate-200">
          <li>✅ <strong>$250</strong> — today only (normally $997).</li>
          <li>✅ <strong>6 spots.</strong> When they&apos;re gone, they&apos;re gone.</li>
          <li>✅ You&apos;ll have <strong>access within 3–7 days.</strong></li>
          <li>✅ I build it out and keep improving it over <strong>30 days.</strong></li>
          <li>✅ After 30 days it&apos;s <strong>yours</strong> — or we set up a simple plan to keep building.</li>
          <li>✅ <strong>Warranty:</strong> if something I built breaks in normal use, I fix it.</li>
        </ul>

        <p className="mt-12 mx-auto max-w-xl text-center text-xs text-slate-500">
          Separate from my J6 work — J6 case profiles on RealRyanNichols.com are free forever. This $250 offer is for anyone who wants a full site of their own.
        </p>

        <div className="mt-8 text-center">
          <a
            href={VENMO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-yellow-400 px-10 py-4 text-xl font-black text-black transition hover:bg-yellow-300"
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
