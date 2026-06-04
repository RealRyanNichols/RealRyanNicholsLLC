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
        This switch does not dump private data. It only publishes drafts Ryan
        already marked as public-release approved. Private messages, tips,
        uploads, contact details, and unreviewed submissions stay private.
      </p>
      <div className="mt-6">
        <DeadmanSwitchForm />
      </div>
    </article>
  );
}
