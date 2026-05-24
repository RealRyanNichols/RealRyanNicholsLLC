"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LiveSimulcastTarget, LiveStream } from "@/lib/types";

type Credentials = {
  liveStreamId: string;
  rtmpUrl: string;
  streamKey: string;
  watchUrl: string;
};

type SocialShare = {
  copy: string;
  xUrl: string;
  facebookUrl: string;
};

export function LiveControlRoom({
  initialStreams,
  muxConfigured,
}: {
  initialStreams: LiveStream[];
  muxConfigured: boolean;
}) {
  const [streams, setStreams] = useState(initialStreams);
  const [selectedStreamId, setSelectedStreamId] = useState(
    initialStreams[0]?.id ?? ""
  );
  const [title, setTitle] = useState("Ryan Nichols Live");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Live");
  const [platform, setPlatform] = useState("YouTube");
  const [label, setLabel] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [streamKey, setStreamKey] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [socialShare, setSocialShare] = useState<SocialShare | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const selectedStream = useMemo(
    () => streams.find((stream) => stream.id === selectedStreamId) ?? null,
    [streams, selectedStreamId]
  );

  async function copy(value: string) {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
    setMessage("Copied.");
  }

  async function createLiveRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create");
    setMessage("");
    setSocialShare(null);
    try {
      const response = await fetch("/api/admin/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create live room.");
      const liveStream = data.liveStream as LiveStream;
      setStreams((current) => [liveStream, ...current]);
      setSelectedStreamId(liveStream.id);
      setCredentials(data.credentials as Credentials);
      setMessage("Live room created. Put the RTMPS URL and stream key into OBS or your mobile streaming app.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create live room.");
    } finally {
      setBusy(null);
    }
  }

  async function loadCredentials(liveStreamId: string) {
    setBusy(`credentials:${liveStreamId}`);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/live/${liveStreamId}/credentials`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load stream key.");
      setCredentials(data.credentials as Credentials);
      setMessage("Stream credentials loaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load stream key.");
    } finally {
      setBusy(null);
    }
  }

  async function addSimulcastTarget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStream) return;
    setBusy("simulcast");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/live/${selectedStream.id}/simulcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          label: label || platform,
          url: destinationUrl,
          streamKey,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not add simulcast target.");
      const target = data.target as LiveSimulcastTarget;
      setStreams((current) =>
        current.map((stream) =>
          stream.id === selectedStream.id
            ? {
                ...stream,
                live_simulcast_targets: [
                  ...(stream.live_simulcast_targets ?? []),
                  target,
                ],
              }
            : stream
        )
      );
      setLabel("");
      setDestinationUrl("");
      setStreamKey("");
      setMessage(`${target.label} added. It will start when the live room receives video.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not add simulcast target."
      );
    } finally {
      setBusy(null);
    }
  }

  async function announce(liveStreamId: string) {
    setBusy(`announce:${liveStreamId}`);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/live/${liveStreamId}/announce`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not announce live stream.");
      setSocialShare(data.social as SocialShare);
      setStreams((current) =>
        current.map((stream) =>
          stream.id === liveStreamId
            ? {
                ...stream,
                announce_count: (stream.announce_count ?? 0) + 1,
                last_announced_at: new Date().toISOString(),
              }
            : stream
        )
      );
      setMessage(`Subscriber email sent: ${data.sent ?? 0}. Failed: ${data.failed ?? 0}.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not announce live stream."
      );
    } finally {
      setBusy(null);
    }
  }

  async function endStream(liveStreamId: string) {
    setBusy(`end:${liveStreamId}`);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/live/${liveStreamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not end live stream.");
      const liveStream = data.liveStream as LiveStream;
      setStreams((current) =>
        current.map((stream) => (stream.id === liveStream.id ? liveStream : stream))
      );
      setMessage("Live stream marked ended.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not end live stream.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      {!muxConfigured ? (
        <section className="rounded-xl border-2 border-red-700 bg-red-50 p-5 text-red-950">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
            Mux not connected
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Add <code>MUX_TOKEN_ID</code>, <code>MUX_TOKEN_SECRET</code>, and{" "}
            <code>MUX_WEBHOOK_SECRET</code> in Vercel before creating live rooms.
          </p>
        </section>
      ) : null}

      <form
        onSubmit={createLiveRoom}
        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
          Start here
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">
          Create a live room
        </h2>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-sm font-bold">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 font-normal"
              required
              maxLength={120}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-28 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 font-normal"
              maxLength={2000}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold sm:max-w-xs">
            Channel
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 font-normal"
              maxLength={80}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={!muxConfigured || busy === "create"}
          className="mt-5 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-black text-[var(--color-paper)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "create" ? "Creating..." : "Create live room"}
        </button>
      </form>

      {credentials ? (
        <section className="rounded-xl border-2 border-red-700 bg-red-50 p-5 text-red-950">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
            Stream credentials
          </p>
          <div className="mt-4 grid gap-3">
            <CredentialRow label="RTMPS URL" value={credentials.rtmpUrl} onCopy={copy} />
            <CredentialRow label="Stream key" value={credentials.streamKey} onCopy={copy} secret />
            <CredentialRow label="Watch page" value={credentials.watchUrl} onCopy={copy} />
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                Rooms
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Live stream history
              </h2>
            </div>
            {streams.length > 0 ? (
              <select
                value={selectedStreamId}
                onChange={(event) => setSelectedStreamId(event.target.value)}
                className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-bold"
              >
                {streams.map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.title}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            {streams.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">
                No live rooms yet.
              </p>
            ) : (
              streams.map((stream) => (
                <article
                  key={stream.id}
                  className="rounded-lg border border-[var(--color-line)] bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={stream.status} />
                        {stream.category ? (
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                            {stream.category}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 text-lg font-black">{stream.title}</h3>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        Created {new Date(stream.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/live/${stream.slug}`}
                        className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-black hover:border-[var(--color-accent)]"
                      >
                        Watch
                      </Link>
                      <button
                        type="button"
                        onClick={() => loadCredentials(stream.id)}
                        disabled={!muxConfigured || busy === `credentials:${stream.id}`}
                        className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-black disabled:opacity-50"
                      >
                        Key
                      </button>
                      <button
                        type="button"
                        onClick={() => announce(stream.id)}
                        disabled={busy === `announce:${stream.id}`}
                        className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-black text-white disabled:opacity-50"
                      >
                        Announce
                      </button>
                      {stream.status !== "ended" ? (
                        <button
                          type="button"
                          onClick={() => endStream(stream.id)}
                          disabled={busy === `end:${stream.id}`}
                          className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-black text-red-800 disabled:opacity-50"
                        >
                          End
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {stream.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                      {stream.description}
                    </p>
                  ) : null}
                  {(stream.live_simulcast_targets ?? []).length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(stream.live_simulcast_targets ?? []).map((target) => (
                        <span
                          key={target.id}
                          className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-xs font-bold text-[var(--color-ink-soft)]"
                        >
                          {target.label}: {target.status}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <form
            onSubmit={addSimulcastTarget}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              Social destinations
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight">
              Add RTMP target
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
              Add YouTube, Facebook, Twitch, Rumble, or any service that gives
              you an RTMP or RTMPS URL plus stream key. Add targets before the
              room goes live.
            </p>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1.5 text-sm font-bold">
                Platform
                <select
                  value={platform}
                  onChange={(event) => setPlatform(event.target.value)}
                  className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 font-normal"
                >
                  <option>YouTube</option>
                  <option>Facebook</option>
                  <option>X</option>
                  <option>Rumble</option>
                  <option>Twitch</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-bold">
                Label
                <input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder={`${platform} Live`}
                  className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 font-normal"
                  maxLength={80}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold">
                RTMP / RTMPS URL
                <input
                  value={destinationUrl}
                  onChange={(event) => setDestinationUrl(event.target.value)}
                  placeholder="rtmps://..."
                  className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 font-normal"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold">
                Stream key
                <input
                  type="password"
                  value={streamKey}
                  onChange={(event) => setStreamKey(event.target.value)}
                  className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 font-normal"
                  required
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={!muxConfigured || !selectedStream || busy === "simulcast"}
              className="mt-4 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-black text-[var(--color-paper)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "simulcast" ? "Adding..." : "Add destination"}
            </button>
          </form>

          {socialShare ? (
            <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                Social alert
              </p>
              <textarea
                readOnly
                value={socialShare.copy}
                className="mt-3 min-h-32 w-full rounded-lg border border-[var(--color-line)] bg-white p-3 text-sm"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copy(socialShare.copy)}
                  className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-black"
                >
                  Copy text
                </button>
                <a
                  href={socialShare.xUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-black px-3 py-1.5 text-xs font-black text-white"
                >
                  Post to X
                </a>
                <a
                  href={socialShare.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-blue-700 px-3 py-1.5 text-xs font-black text-white"
                >
                  Share to Facebook
                </a>
              </div>
            </section>
          ) : null}
        </div>
      </section>

      {message ? (
        <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-sm font-semibold text-[var(--color-ink-soft)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function CredentialRow({
  label,
  value,
  secret,
  onCopy,
}: {
  label: string;
  value: string;
  secret?: boolean;
  onCopy: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 rounded-lg bg-white p-3 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center">
      <span className="text-xs font-black uppercase tracking-wider text-red-700">
        {label}
      </span>
      <code className="min-w-0 overflow-x-auto whitespace-nowrap rounded bg-red-950/5 px-2 py-1 text-xs">
        {secret ? "************************" : value}
      </code>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-black text-red-800"
      >
        Copy
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: LiveStream["status"] }) {
  const live = status === "live";
  return (
    <span
      className={[
        "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
        live
          ? "bg-red-700 text-white"
          : "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
      ].join(" ")}
    >
      {status}
    </span>
  );
}
