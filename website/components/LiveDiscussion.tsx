import { LiveCommentForm } from "@/components/LiveCommentForm";
import { LiveCommentList } from "@/components/LiveCommentList";

export function LiveDiscussion({ liveStreamId }: { liveStreamId: string }) {
  return (
    <section id="live-comments" className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
            Public room
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">
            Comments under the stream
          </h2>
        </div>
        <a
          href="#private-message"
          className="text-xs font-bold text-[var(--color-accent)] hover:underline"
        >
          Send something private
        </a>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <LiveCommentList liveStreamId={liveStreamId} />
        <LiveCommentForm liveStreamId={liveStreamId} />
      </div>
    </section>
  );
}
