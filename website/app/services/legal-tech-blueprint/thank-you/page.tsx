import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thank You | Legal-Tech Blueprint",
  description: "Your legal-tech blueprint purchase is confirmed.",
  alternates: { canonical: `${SITE.url}/services/legal-tech-blueprint/thank-you` },
  robots: { index: false, follow: false },
};

type Order = {
  package_slug: string | null;
  package_name: string | null;
  customer_name: string | null;
  intake_id: string | null;
  notes: string | null;
};

async function getOrder(sessionId?: string): Promise<Order | null> {
  if (!sessionId || !isSupabaseServiceConfigured()) return null;
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("blueprint_orders")
    .select("package_slug, package_name, customer_name, intake_id, notes")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  return (data as Order) ?? null;
}

function nextSteps(slug: string | null): { title: string; body: string }[] {
  if (slug === "diy_blueprint") {
    return [
      {
        title: "I have your questionnaire",
        body: "Your answers are saved. I will build your custom prompt stack and roadmap around exactly what you told me you need.",
      },
      {
        title: "Your prompts are on the way",
        body: "You will get the prompt pack, the tool setup checklist, and the database and dashboard structure by email.",
      },
      {
        title: "7 days of support",
        body: "Once you start building, I am available for 7 days to help you get the first version moving. Reply to your receipt or use the contact page.",
      },
    ];
  }
  if (slug === "guided_build") {
    return [
      {
        title: "You picked the right starting point",
        body: "The Guided Build Sprint gets your first version live with me beside you, and you keep full control of it.",
      },
      {
        title: "I will reach out to schedule",
        body: "I will contact you at your checkout email to set up your first working session and walk you through the stack.",
      },
      {
        title: "You will own the stack",
        body: "Your GitHub repo, your Supabase database, your Vercel deployment. Yours from day one.",
      },
    ];
  }
  return [
    {
      title: "Deposit received",
      body: "Thank you. Your 50% deposit reserves your build. The balance is due before final handoff.",
    },
    {
      title: "I will reach out to scope it",
      body: "I will contact you at your checkout email to scope the first working version, the data model, and the timeline.",
    },
    {
      title: "Built and handed over",
      body: "I build the first working version and hand it over, set up and deployed under your accounts.",
    },
  ];
}

export default async function BlueprintThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const order = await getOrder(session_id);
  const firstName = order?.customer_name?.trim().split(/\s+/)[0];
  const steps = nextSteps(order?.package_slug ?? null);

  return (
    <article className="rrn-page">
      <section className="bg-[var(--color-blue)] text-[var(--color-paper)]">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-6 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-gold)]">
            Legal-Tech Blueprint
          </p>
          <h1 className="mt-3 font-display text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
            {firstName ? `Thank you, ${firstName}.` : "Thank you. You are in."}
          </h1>
          <p className="mt-4 text-base font-medium leading-7 text-[#e7ecf6] sm:text-lg">
            {order?.package_name
              ? `Your purchase of the ${order.package_name} is confirmed.`
              : "Your purchase is confirmed."}{" "}
            Here is what happens next.
          </p>
        </div>
      </section>

      <section className="rrn-section">
        <div className="grid gap-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="flex gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
            >
              <span className="font-mono text-sm font-black text-[var(--color-muted)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-display text-xl font-black tracking-normal text-[var(--color-ink)]">
                  {s.title}
                </h2>
                <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/services/legal-tech-blueprint"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-[var(--color-blue)] px-6 py-3 text-base font-black text-[var(--color-blue)] transition hover:bg-[var(--color-blue)] hover:text-[var(--color-paper)]"
          >
            Back to the offer
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
          >
            Contact Ryan
          </Link>
        </div>
      </section>
    </article>
  );
}
