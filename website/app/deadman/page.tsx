import type { Metadata } from "next";
import { DeadmanSwitchForm } from "@/components/DeadmanSwitchForm";

export const metadata: Metadata = {
  title: "Deadman Switch",
  robots: { index: false, follow: false },
};

export default function DeadmanPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
        Protected release protocol
      </p>
      <h1 className="mt-2 font-display text-4xl font-black tracking-normal">
        Deadman switch
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        This is a controlled custody-response system for named trusted contacts.
        It does not activate because Ryan is late, attending a meeting,
        unreachable, or mentioned in a social post. Activation requires a
        private contact ID, a unique code, an authoritative custody source, and
        an express public-release attestation.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Guardrail title="Verified trigger" text="Official record or direct authoritative confirmation." />
        <Guardrail title="Hourly update" text="One source-labeled status post at the top of every hour." />
        <Guardrail title="Private stays private" text="No tips, messages, credentials, children, or sealed material." />
      </div>
      <div className="mt-6">
        <DeadmanSwitchForm />
      </div>
    </article>
  );
}

function Guardrail({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] p-4">
      <h2 className="text-sm font-black text-[var(--color-ink)]">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{text}</p>
    </section>
  );
}
