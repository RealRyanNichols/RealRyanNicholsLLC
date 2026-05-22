import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/OnboardingForm";

export const metadata: Metadata = {
  title: "Finish your profile",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, display_name")
    .eq("id", auth.user.id)
    .maybeSingle();

  // If they're complete, send them on their way.
  const complete =
    profile?.full_name?.trim() &&
    profile?.username?.trim() &&
    profile?.display_name?.trim();
  const { next } = await searchParams;
  if (complete) {
    redirect(next || "/account");
  }

  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
        One more step
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight font-display">
        Finish your profile
      </h1>
      <p className="mt-3 text-base text-[var(--color-ink-soft)] leading-relaxed">
        Real names only. Ryan personally verifies every account before unlocking
        comments and J6 profile claims. This catches sockpuppets and keeps the
        record honest.
      </p>

      <div className="mt-2 text-sm text-[var(--color-muted)]">
        Signed in as <span className="font-mono">{auth.user.email}</span>
      </div>

      <div className="mt-7">
        <OnboardingForm
          defaultFullName={profile?.full_name ?? ""}
          defaultDisplayName={profile?.display_name ?? ""}
          defaultUsername={profile?.username ?? ""}
          nextHref={next || "/account"}
        />
      </div>

      <p className="mt-8 text-xs text-[var(--color-muted)]">
        Want to leave instead?{" "}
        <Link href="/logout" className="underline">
          Sign out
        </Link>
      </p>
    </article>
  );
}
