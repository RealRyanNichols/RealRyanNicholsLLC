import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPersonBySlug } from "@/lib/case";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ClaimForm } from "@/components/ClaimForm";

export const metadata: Metadata = {
  title: "Claim profile",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getPersonBySlug(slug);
  if (!p) notFound();

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    redirect(`/login?next=/case/people/${slug}/claim`);
  }

  // If this person is already verified-claimed, don't show the form.
  if (p.claim_status === "verified") {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Already claimed</h1>
        <p className="mt-3 text-[var(--color-ink-soft)]">
          This profile has been verified to its owner. If you believe the
          verification was wrong, send a tip explaining why.
        </p>
        <Link
          href="/submit"
          className="mt-5 inline-block text-[var(--color-accent)] font-semibold hover:underline"
        >
          Send a tip →
        </Link>
      </article>
    );
  }

  // Don't show the form for non-J6er entries (officials etc.)
  if (!p.is_j6_defendant) {
    notFound();
  }

  // If this user already submitted a claim for this person, surface the
  // existing claim status instead of letting them duplicate-submit.
  const { data: existing } = await supabase
    .from("case_person_claims")
    .select("id, status, proof, created_at, reviewed_notes")
    .eq("person_id", p.id)
    .eq("claimant_user_id", auth.user.id)
    .maybeSingle();

  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      <nav className="text-sm text-[var(--color-muted)] mb-4">
        <Link href={`/case/people/${slug}`} className="hover:underline">
          ← Back to profile
        </Link>
      </nav>

      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
        Anti-Weaponization Case Builder · Claim
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight font-display">
        Claim {p.name}&apos;s profile
      </h1>
      <p className="mt-3 text-base text-[var(--color-ink-soft)] leading-relaxed">
        Tell Ryan why this is you. He&apos;ll verify against the DOJ docket and
        public record. Once approved, this profile becomes yours to build —
        photos, scanned documents, video embeds, your testimony in your words.
      </p>

      {existing ? (
        <ExistingClaim
          status={existing.status}
          proof={existing.proof}
          notes={existing.reviewed_notes}
        />
      ) : (
        <div className="mt-8">
          <ClaimForm slug={slug} userEmail={auth.user.email ?? ""} />
        </div>
      )}
    </article>
  );
}

function ExistingClaim({
  status,
  proof,
  notes,
}: {
  status: string;
  proof: string;
  notes: string | null;
}) {
  const tone =
    status === "approved"
      ? "border-[var(--color-success)] bg-[var(--color-blue-soft)]"
      : status === "rejected"
      ? "border-[var(--color-line)] bg-[var(--color-surface-2)]"
      : "border-[var(--color-accent)] bg-[var(--color-accent-soft)]";
  const headline =
    status === "approved"
      ? "Your claim was approved."
      : status === "rejected"
      ? "Your claim was rejected."
      : "Your claim is pending review.";
  return (
    <div className={`mt-8 rounded-2xl border-2 ${tone} p-6`}>
      <h2 className="text-xl font-bold tracking-tight">{headline}</h2>
      {status === "pending" ? (
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Ryan reviews claims personally. You&apos;ll get an email at the
          address on your account when there&apos;s a decision.
        </p>
      ) : null}
      {status === "rejected" ? (
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          {notes ? `Reason: ${notes}` : "If you think this was a mistake, send a tip with more proof."}
        </p>
      ) : null}
      {status === "approved" ? (
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          The profile is yours. Build it out:{" "}
          <Link href="/account" className="text-[var(--color-accent)] font-semibold hover:underline">
            Go to your account →
          </Link>
        </p>
      ) : null}
      <div className="mt-4 border-t border-[var(--color-line)] pt-3 text-sm">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
          What you submitted
        </p>
        <p className="mt-1.5 whitespace-pre-wrap text-[var(--color-ink-soft)]">
          {proof}
        </p>
      </div>
    </div>
  );
}
