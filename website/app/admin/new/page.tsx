import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ComposeForm } from "@/components/ComposeForm";
import { isMuxConfigured } from "@/lib/mux";

export const metadata: Metadata = {
  title: "New post",
  robots: { index: false, follow: false },
};

export default async function NewPostPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    redirect("/login?next=/admin/new");
  }
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
        <p className="mt-3 text-[var(--color-ink-soft)]">
          You need to be signed in as an admin to create posts.
        </p>
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">New post</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Pick a type, write or upload, hit publish. The feed at <code>/</code>{" "}
        renders all four types in one timeline.
      </p>
      <div className="mt-8">
        <ComposeForm videoEnabled={isMuxConfigured()} />
      </div>
    </article>
  );
}
