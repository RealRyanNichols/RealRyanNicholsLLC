import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Palette preview",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PaletteId = "a" | "b" | "c" | "current";

type Palette = {
  id: PaletteId;
  name: string;
  blurb: string;
  vars: Record<string, string>;
};

const PALETTES: Palette[] = [
  {
    id: "current",
    name: "Current (dark + red)",
    blurb:
      "What the site looks like today: near-black background, white text, red used heavily.",
    vars: {
      "--color-paper": "#0a0a0c",
      "--color-surface": "#16161a",
      "--color-surface-2": "#1f1f24",
      "--color-line": "#2a2a30",
      "--color-line-soft": "#1f1f24",
      "--color-ink": "#fafafa",
      "--color-ink-soft": "#d4d4d8",
      "--color-muted": "#888892",
      "--color-accent": "#dc2626",
      "--color-accent-strong": "#b91c1c",
      "--color-accent-soft": "#2a0a0a",
      "--color-accent-glow": "rgba(220, 38, 38, 0.22)",
    },
  },
  {
    id: "a",
    name: "A · Cream + red only for severe",
    blurb:
      "Warm cream background, charcoal text. Red is RESERVED for severe violations — feels investigative and readable, not angry.",
    vars: {
      "--color-paper": "#f8f5ef",
      "--color-surface": "#ffffff",
      "--color-surface-2": "#f3eee5",
      "--color-line": "#e0d8c8",
      "--color-line-soft": "#ebe5d8",
      "--color-ink": "#1a1818",
      "--color-ink-soft": "#4a4540",
      "--color-muted": "#8a8278",
      "--color-accent": "#c41818",
      "--color-accent-strong": "#9b1212",
      "--color-accent-soft": "#fbe9e6",
      "--color-accent-glow": "rgba(196, 24, 24, 0.15)",
    },
  },
  {
    id: "b",
    name: "B · Light grey + multi-color tags",
    blurb:
      "Cool grey background. Red for severe, amber for procedural, navy for institutional, green for resolved. More information density.",
    vars: {
      "--color-paper": "#f4f4f5",
      "--color-surface": "#ffffff",
      "--color-surface-2": "#e9e9ec",
      "--color-line": "#d4d4d8",
      "--color-line-soft": "#e4e4e7",
      "--color-ink": "#18181b",
      "--color-ink-soft": "#3f3f46",
      "--color-muted": "#71717a",
      "--color-accent": "#dc2626",
      "--color-accent-strong": "#b91c1c",
      "--color-accent-soft": "#fee2e2",
      "--color-accent-glow": "rgba(220, 38, 38, 0.15)",
    },
  },
  {
    id: "c",
    name: "C · Softer dark (deep navy + cream)",
    blurb:
      "Stays moody — deep navy background, cream text, red sparing. Less sinister than near-black.",
    vars: {
      "--color-paper": "#0d1426",
      "--color-surface": "#182238",
      "--color-surface-2": "#233149",
      "--color-line": "#2e3e5a",
      "--color-line-soft": "#1f2c43",
      "--color-ink": "#f4f1e8",
      "--color-ink-soft": "#cfc8b5",
      "--color-muted": "#8c8779",
      "--color-accent": "#e84a4a",
      "--color-accent-strong": "#c83838",
      "--color-accent-soft": "#2a1818",
      "--color-accent-glow": "rgba(232, 74, 74, 0.18)",
    },
  },
];

export default async function PalettePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/preview/palette");
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const { p } = await searchParams;
  const id = (p === "a" || p === "b" || p === "c" || p === "current"
    ? p
    : "a") as PaletteId;
  const active = PALETTES.find((x) => x.id === id) ?? PALETTES[0]!;

  return (
    <article className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · palette preview
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Pick a color scheme
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Each option below shows the same content under a different palette. Click
        through, then tell me which one to apply to the whole site.
      </p>

      {/* Switcher */}
      <nav className="mt-6 flex flex-wrap gap-2">
        {PALETTES.map((opt) => (
          <Link
            key={opt.id}
            href={`/preview/palette?p=${opt.id}`}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold border-2 transition",
              opt.id === active.id
                ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                : "border-[var(--color-line)] hover:border-[var(--color-accent)]",
            ].join(" ")}
          >
            {opt.name}
          </Link>
        ))}
      </nav>

      {/* Preview frame — vars override only inside this container */}
      <div
        className="mt-6 rounded-2xl border border-[var(--color-line)] overflow-hidden"
        style={active.vars as React.CSSProperties}
      >
        <div className="bg-[var(--color-paper)] text-[var(--color-ink)] p-6 sm:p-10">
          <div className="text-xs uppercase tracking-wider font-bold text-[var(--color-accent)]">
            {active.name}
          </div>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)] max-w-2xl">
            {active.blurb}
          </p>

          {/* Mock hero */}
          <section className="mt-8">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--color-accent)]">
              Ryan Nichols · A Promise
            </p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight font-display leading-[1.05]">
              The J6 Case.
            </h2>
            <p className="mt-4 text-xl text-[var(--color-ink-soft)] leading-snug">
              Free. For every January 6 defendant. Forever.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-white px-5 py-3 font-bold hover:bg-[var(--color-accent-strong)] transition"
              >
                Get a profile →
              </button>
              <button
                type="button"
                className="rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-3 font-bold hover:border-[var(--color-accent)] transition"
              >
                Send a tip →
              </button>
            </div>
          </section>

          {/* Mock grievance cards with severity badges */}
          <section className="mt-12">
            <h3 className="text-2xl font-bold tracking-tight font-display">
              Sample grievances
            </h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <GrievanceCard
                severity="severe"
                title="Water shut off — 18 days"
                summary="Cell water shut off without notice. Filed grievance Jan 18. No response."
              />
              <GrievanceCard
                severity="severe"
                title="Denied access to discovery"
                summary="Counsel requested case file. Facility denied three times. Violates 6th Amendment."
              />
              <GrievanceCard
                severity="procedural"
                title="Mail delays exceeding 30 days"
                summary="Legal mail held without explanation. Filed in IGP — no response received."
              />
              <GrievanceCard
                severity="institutional"
                title="Pre-trial detention extended"
                summary="Hearing continued without defense input. Bond never set."
              />
              <GrievanceCard
                severity="resolved"
                title="Property returned post-pardon"
                summary="Personal effects returned after Jan 20, 2025 pardon. Resolved."
              />
              <GrievanceCard
                severity="severe"
                title="Broken grievance process"
                summary="IGPs not logged. Officers refused to receipt complaints. Pattern documented across detainees."
              />
            </div>
          </section>

          {/* Mock evidence card */}
          <section className="mt-12">
            <h3 className="text-2xl font-bold tracking-tight font-display">
              Sample evidence card
            </h3>
            <article className="mt-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="text-lg font-bold tracking-tight">
                  Grievance Form · Water Cutoff (Jan 18, 2021)
                </h4>
                <span className="text-xs text-[var(--color-muted)]">
                  filed by Ryan Nichols
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                Original IGP filed at CTF after water service was shut off in
                Unit C-2B without notice. Facility never responded.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-[var(--color-accent)] text-white px-2 py-0.5 font-bold uppercase">
                  Severe
                </span>
                <span className="rounded-md border border-[var(--color-line)] px-2 py-0.5 text-[var(--color-ink-soft)]">
                  IGP · grievance_form
                </span>
                <span className="rounded-md border border-[var(--color-line)] px-2 py-0.5 text-[var(--color-ink-soft)]">
                  Jan 18, 2021
                </span>
              </div>
            </article>
          </section>

          {/* Mock body copy */}
          <section className="mt-12 max-w-2xl">
            <h3 className="text-2xl font-bold tracking-tight font-display">
              Sample body text
            </h3>
            <p className="mt-3 text-[var(--color-ink)] leading-relaxed">
              When a case file sits inside a law firm, only the lawyers and
              the court see it. The public hears soundbites. They do not see
              the grievance forms denied without a hearing. They do not see
              the{" "}
              <a
                href="#"
                className="text-[var(--color-accent)] font-semibold hover:underline"
              >
                water shut off
              </a>
              . They do not see the denial of access to counsel.
            </p>
            <p className="mt-3 text-[var(--color-ink-soft)] leading-relaxed">
              Secondary text in muted tone — captions, metadata, byline
              information.
            </p>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              Tertiary text — the kind you read when you want context but it&apos;s
              not the headline.
            </p>
          </section>
        </div>
      </div>

      <p className="mt-6 text-sm text-[var(--color-ink-soft)]">
        Like this one? Tell me which palette letter (A, B, or C) to apply
        site-wide. I&apos;ll update <code>app/globals.css</code> in the next PR.
      </p>
    </article>
  );
}

function GrievanceCard({
  severity,
  title,
  summary,
}: {
  severity: "severe" | "procedural" | "institutional" | "resolved";
  title: string;
  summary: string;
}) {
  const tones: Record<
    string,
    { bg: string; fg: string; label: string }
  > = {
    severe: {
      bg: "var(--color-accent)",
      fg: "#fff",
      label: "Severe",
    },
    procedural: {
      bg: "#d97706",
      fg: "#fff",
      label: "Procedural",
    },
    institutional: {
      bg: "#1e40af",
      fg: "#fff",
      label: "Institutional",
    },
    resolved: {
      bg: "#16a34a",
      fg: "#fff",
      label: "Resolved",
    },
  };
  const t = tones[severity]!;
  return (
    <article className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-bold tracking-tight">{title}</h4>
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
          style={{ background: t.bg, color: t.fg }}
        >
          {t.label}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-[var(--color-ink-soft)] leading-relaxed">
        {summary}
      </p>
    </article>
  );
}
