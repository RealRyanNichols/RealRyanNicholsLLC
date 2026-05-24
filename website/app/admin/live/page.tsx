import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isMuxConfigured } from "@/lib/mux";
import { LIVE_STREAM_COLUMNS } from "@/lib/live";
import { LiveControlRoom } from "@/components/LiveControlRoom";
import type { LiveStream } from "@/lib/types";

export const metadata: Metadata = {
  title: "Live",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLivePage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/live");

  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const { data: streams, error } = await supabase
    .from("live_streams")
    .select(`${LIVE_STREAM_COLUMNS}, live_simulcast_targets(*)`)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <article className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · live
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Live control room
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Create a live room, copy the RTMPS credentials into OBS or a mobile
            encoder, add social RTMP targets, then announce the live page.
          </p>
        </div>
        <Link
          href="/live"
          className="rounded-full border-2 border-[var(--color-accent)] px-4 py-2 text-sm font-black text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
        >
          Public live page
        </Link>
      </div>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Could not load live streams: {error.message}
        </p>
      ) : null}

      <div className="mt-8">
        <LiveControlRoom
          initialStreams={(streams ?? []) as LiveStream[]}
          muxConfigured={isMuxConfigured()}
        />
      </div>
    </article>
  );
}
