import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", data.user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
      <p className="text-[var(--color-ink-soft)] mt-2 text-sm">
        Signed in as <span className="font-medium">{data.user.email}</span>.
      </p>
      <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">
          Display name on comments
        </p>
        <p className="font-medium">{profile?.display_name ?? "(not set)"}</p>
        <p className="mt-4 text-[var(--color-muted)]">
          Set your display name from the auth provider; it will show up on any approved
          comments you post.
        </p>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Link href="/" className="text-sm underline">
          ← Back to feed
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}
