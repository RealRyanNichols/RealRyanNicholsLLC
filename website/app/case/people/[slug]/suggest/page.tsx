import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TipForm } from "@/components/TipForm";
import { getPersonBySlug } from "@/lib/case";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Suggest a profile update",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SuggestProfileUpdatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);
  if (!person?.is_j6_defendant) notFound();

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/case/people/${slug}/suggest`);
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-sm text-[var(--color-muted)]">
        <Link href={`/case/people/${slug}`} className="hover:underline">
          ← Back to {person.name}&apos;s public profile
        </Link>
      </nav>

      <p className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent)]">
        Signed-in profile contribution
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
        Suggest an update to {person.name}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-[var(--color-ink-soft)]">
        Submit a correction, missing source, authentic photograph, court
        filing, or other factual addition. Nothing changes publicly until the
        submission is reviewed.
      </p>

      <div className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5">
        <TipForm
          defaultCategory="j6"
          subjectDefault={person.name}
          profileSlug={person.slug}
          submitterEmailDefault={user.email ?? undefined}
        />
      </div>
    </article>
  );
}
