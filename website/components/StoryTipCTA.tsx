import { TipForm } from "@/components/TipForm";

// Inline tip line at the bottom of an article. Reuses the same TipForm +
// /api/tips pipeline as the /submit page, so a reader can send a tip about
// this exact story without leaving the page. `subject` (the article title)
// pre-fills the form's subject field so the tip arrives tagged to this story.
export function StoryTipCTA({ subject }: { subject?: string }) {
  return (
    <section className="mt-12 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-5 sm:p-7">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
        The newsroom · Tip line
      </p>
      <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight font-display">
        Know something about this story?
      </h2>
      <p className="mt-2 text-[var(--color-ink-soft)] leading-relaxed">
        Firsthand information, records, screenshots, court or police documents —
        send it right here, no account needed. Your name and email are optional
        and never published. Please don&apos;t contact anyone named in this
        article — just send facts, dates, and documents.
      </p>
      <div className="mt-6">
        <TipForm defaultCategory="local" subjectDefault={subject} />
      </div>
    </section>
  );
}
