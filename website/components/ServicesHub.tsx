"use client";

import { trackEvent } from "@/lib/analytics";

const LEADFLOW = "https://www.theleadflowpro.com";

type LeadFlowLinkProps = {
  href: string;
  label: string;
  location: string;
  className: string;
};

function LeadFlowLink({
  href,
  label,
  location,
  className,
}: LeadFlowLinkProps) {
  return (
    <a
      href={`${LEADFLOW}${href}`}
      className={className}
      onClick={() =>
        trackEvent("leadflow_referral_click", {
          destination: href,
          source: "rrn_services",
          location,
        })
      }
    >
      {label}
    </a>
  );
}

const SYSTEMS = [
  {
    number: "01",
    kicker: "Leads",
    title: "Put qualified inquiries on your phone.",
    body: "Facebook, Instagram, and Google campaigns built in accounts your business owns, with every lead routed where somebody can act on it.",
    href: "/agency/meta-ads",
    cta: "See lead generation",
  },
  {
    number: "02",
    kicker: "Follow-up",
    title: "Stop losing people after they raise their hand.",
    body: "Fast first replies, clear ownership, and follow-up ladders that keep working while you are serving customers.",
    href: "/agency/automation",
    cta: "See follow-up automation",
  },
  {
    number: "03",
    kicker: "Websites and funnels",
    title: "Give every visitor one obvious next step.",
    body: "Mobile-first pages that explain the offer, show the proof, capture the lead, and connect the handoff behind the form.",
    // /free-build is retired (301 to /services on theleadflowpro.com).
    href: "/services",
    cta: "See the website services",
  },
  {
    number: "04",
    kicker: "The whole system",
    title: "Connect the website, leads, and follow-up.",
    body: "The LeadFlow Pro builds and runs the moving parts together, then shows the work on a scoreboard you can inspect.",
    href: "/agency",
    cta: "See the done-for-you system",
  },
];

const PROOF = [
  {
    title: "Owned platform",
    body: "The content, audience path, and calls to action live on a domain Ryan controls.",
  },
  {
    title: "Visible proof",
    body: "The feed, records, traffic, and results are there for a visitor to inspect instead of taking a promise on faith.",
  },
  {
    title: "Clear next clicks",
    body: "Readers can subscribe, contact Ryan, buy the book, submit a tip, or move into the right business service.",
  },
  {
    title: "A system behind the page",
    body: "Forms, follow-up, analytics, publishing, and admin workflows do the work a brochure cannot.",
  },
];

export function ServicesHub() {
  return (
    <article className="overflow-hidden">
      <section className="relative border-b border-[var(--color-line)] bg-[var(--color-navy)] text-[var(--color-cream)]">
        <div
          className="absolute inset-0 opacity-35"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 78% 18%, var(--color-blue) 0, transparent 34%), radial-gradient(circle at 12% 88%, var(--color-gold) 0, transparent 26%)",
          }}
        />
        <div className="relative mx-auto grid min-h-[68vh] max-w-6xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:py-16">
          <div>
            <p className="eyebrow">
              Ryan built the proof. The LeadFlow Pro builds the system.
            </p>
            <h1 className="display mt-4 max-w-4xl text-[2.75rem] text-[var(--color-cream)] sm:text-6xl lg:text-7xl">
              <span className="block">More leads.</span>
              <span className="block">Less busywork.</span>
              <span className="block">One place to build it.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-cream)] sm:text-lg">
              RealRyanNichols.com is where I publish the record and show the work.
              The LeadFlow Pro is where businesses go for the website, ads,
              follow-up, automation, and scoreboard behind real growth.
            </p>
            <div className="rrn-tap-row mt-7">
              <LeadFlowLink
                href="/#free-consultation"
                label="Book a free 30-minute consultation →"
                location="hero_primary"
                className="rrn-tap btn-accent inline-flex rounded-lg px-5 py-3 text-sm font-black"
              />
              <LeadFlowLink
                href="/services"
                label="See what The LeadFlow Pro builds"
                location="hero_secondary"
                className="rrn-tap btn-ghost inline-flex rounded-lg px-5 py-3 text-sm font-black"
              />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Longview and East Texas in person. Anywhere by phone or video.
            </p>
          </div>

          <aside className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-5 text-[var(--color-ink)] shadow-[0_28px_70px_rgba(0,0,0,0.5)] sm:p-6">
            <p className="eyebrow">What moves to The LeadFlow Pro</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-normal text-[var(--color-cream)]">
              Business growth work has one home.
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                ["Website", "A clear offer and a next step that works on a phone."],
                ["Lead flow", "Ads and forms that route every inquiry into a real process."],
                ["Follow-up", "Fast replies and a documented owner for the next action."],
                ["Proof", "A scoreboard that separates activity from actual results."],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="grid grid-cols-[0.75rem_1fr] gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5"
                >
                  <span
                    className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[var(--color-gold)]"
                    aria-hidden
                  />
                  <div>
                    <h3 className="font-sans text-base font-black text-[var(--color-ink)]">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="max-w-3xl">
            <p className="eyebrow">Choose the broken part</p>
            <h2 className="mt-2 text-3xl font-black tracking-normal sm:text-5xl">
              Start where the customer is getting lost.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-soft)]">
              You do not need another pile of software. Pick the part that is
              costing you calls, jobs, bookings, or buyers. The LeadFlow Pro
              connects it to the rest of the system.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {SYSTEMS.map((system, index) => (
              <div
                key={system.number}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-gold)] sm:p-6"
                data-reveal
                style={{ "--d": index } as React.CSSProperties}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">{system.kicker}</p>
                  <span className="display text-3xl text-[var(--color-gold)]">
                    {system.number}
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-black tracking-normal text-[var(--color-ink)]">
                  {system.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {system.body}
                </p>
                <LeadFlowLink
                  href={system.href}
                  label={`${system.cta} →`}
                  location={`system_${system.number}`}
                  className="mt-5 inline-flex text-sm font-black text-[var(--color-accent-ink)] underline decoration-[var(--color-gold)] decoration-2 underline-offset-4"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:py-14">
          <div>
            <p className="eyebrow">Proof you can click</p>
            <h2 className="mt-2 text-3xl font-black tracking-normal sm:text-5xl">
              This website is not a mockup.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-soft)]">
              You are standing inside an owned platform Ryan uses every day.
              The same operating idea applies to a local business: attract the
              right person, show the proof, capture the lead, and make the next
              action obvious.
            </p>
            <div className="rrn-tap-row mt-6">
              <LeadFlowLink
                href="/results"
                label="See client results →"
                location="proof_results"
                className="rrn-tap btn-accent inline-flex rounded-lg px-5 py-3 text-sm font-black"
              />
              <LeadFlowLink
                href="/scoreboard"
                label="Open the scoreboard"
                location="proof_scoreboard"
                className="rrn-tap btn-ghost inline-flex rounded-lg px-5 py-3 text-sm font-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PROOF.map((item, index) => (
              <div
                key={item.title}
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-5"
                data-reveal
                style={{ "--d": index } as React.CSSProperties}
              >
                <h3 className="font-sans text-lg font-black text-[var(--color-ink)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--color-line)] bg-[var(--color-navy)] text-[var(--color-cream)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="eyebrow">Free 30-minute business consultation</p>
              <h2 className="mt-2 text-3xl font-black tracking-normal text-[var(--color-cream)] sm:text-5xl">
                Bring the business. Leave with your next three moves.
              </h2>
            </div>
            <div>
              <p className="text-base leading-relaxed text-[var(--color-cream)]">
                Bring your website, Facebook page, missed inquiries, software
                bills, or the one growth problem you cannot get unstuck. Ryan
                will look at the real business and tell you what to fix first.
              </p>
              <div className="rrn-tap-row mt-6">
                <LeadFlowLink
                  href="/#free-consultation"
                  label="Book the free consultation →"
                  location="consultation_band"
                  className="rrn-tap btn-accent inline-flex rounded-lg px-5 py-3 text-sm font-black"
                />
                <LeadFlowLink
                  href="/tools"
                  label="Use the free business tools"
                  location="consultation_tools"
                  className="rrn-tap btn-ghost inline-flex rounded-lg px-5 py-3 text-sm font-black"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-paper)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-14">
          <div className="max-w-3xl">
            <p className="eyebrow">One business destination</p>
            <h2 className="mt-2 text-3xl font-black tracking-normal sm:text-4xl">
              Business services now live at TheLeadFlowPro.com.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              RealRyanNichols.com stays focused on Ryan&apos;s story, record, work,
              and public platform. The LeadFlow Pro is the place to build and run
              the system that brings your business more opportunities.
            </p>
          </div>
          <LeadFlowLink
            href="/"
            label="Go to The LeadFlow Pro →"
            location="final_cta"
            className="rrn-tap btn-accent inline-flex shrink-0 rounded-lg px-6 py-3.5 text-sm font-black"
          />
        </div>
      </section>
    </article>
  );
}
