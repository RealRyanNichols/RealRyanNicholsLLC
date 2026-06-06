import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { BlueprintIntakeForm } from "@/components/BlueprintIntakeForm";

export const metadata: Metadata = {
  title: "DIY Blueprint Intake | Legal-Tech Case Dashboard",
  description:
    "Tell me what your legal-tech system needs so I can build your custom prompt stack, then check out securely.",
  alternates: { canonical: `${SITE.url}/services/legal-tech-blueprint/intake` },
  robots: { index: false, follow: false },
};

export default function BlueprintIntakePage() {
  return (
    <article className="rrn-page">
      <section className="border-b border-[var(--color-line)] bg-[var(--color-blue)] text-[var(--color-paper)]">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:px-6 lg:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-gold)]">
            DIY Blueprint + Prompt Stack
          </p>
          <h1 className="mt-4 font-display text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Tell me what you need. I will build your prompt stack around it.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#e7ecf6] sm:text-lg">
            Fill out as much or as little as you want. Every answer helps me
            tailor the roadmap, the database structure, and the prompts to your
            practice. Only your email is needed, and checkout collects that too.
          </p>
          <div className="mt-5">
            <Link
              href="/services/legal-tech-blueprint#packages"
              className="text-sm font-bold text-[#e7ecf6] underline underline-offset-4 transition hover:text-white"
            >
              Back to all packages
            </Link>
          </div>
        </div>
      </section>

      <section className="rrn-section">
        <BlueprintIntakeForm />
      </section>
    </article>
  );
}
