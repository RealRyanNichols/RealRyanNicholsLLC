import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/site-settings";
import { ProfileUploadForm } from "@/components/ProfileUploadForm";

export const metadata: Metadata = {
  title: "Profile photos",
  robots: { index: false, follow: false },
};

export default async function AdminProfilePage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/profile");
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
        <p className="mt-3 text-[var(--color-ink-soft)]">
          You need to be signed in as an admin.
        </p>
      </article>
    );
  }

  const current = await getSiteSettings();

  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-4xl font-bold tracking-tight">Profile photos</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Upload a profile picture and a cover banner. Both appear in the home
        hero and header within ~60 seconds of saving.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-bold tracking-tight">Current</h2>
        <div className="mt-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden">
          <div className="relative h-32 sm:h-40 w-full bg-[var(--color-surface-2)]">
            {current.cover_url ? (
              <Image
                src={current.cover_url}
                alt="Current cover"
                fill
                sizes="(min-width: 1024px) 640px, 100vw"
                className="object-cover"
                unoptimized={current.cover_url.startsWith("http")}
              />
            ) : (
              <p className="absolute inset-0 flex items-center justify-center text-xs text-[var(--color-muted)] uppercase tracking-wider">
                No cover photo
              </p>
            )}
          </div>
          <div className="p-4 flex items-center gap-4 -mt-10">
            <div className="relative h-20 w-20 rounded-full ring-4 ring-[var(--color-surface)] bg-[var(--color-surface-2)] overflow-hidden flex-shrink-0">
              {current.avatar_url ? (
                <Image
                  src={current.avatar_url}
                  alt="Current avatar"
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized={current.avatar_url.startsWith("http")}
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-xs text-[var(--color-muted)] uppercase tracking-wider">
                  None
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--color-muted)] pt-6">
              {current.avatar_url ? "Avatar set" : "No avatar set"} ·{" "}
              {current.cover_url ? "Cover set" : "No cover set"}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-tight">Upload</h2>
        <p className="text-xs text-[var(--color-muted)] mt-1">
          JPEG, PNG, WebP, or HEIC. Up to 50 MB each. Square crops work best for
          the avatar; wide ratios (3:1 or 4:1) work best for the cover.
        </p>
        <div className="mt-4">
          <ProfileUploadForm
            currentAvatar={current.avatar_url}
            currentCover={current.cover_url}
          />
        </div>
      </section>
    </article>
  );
}
