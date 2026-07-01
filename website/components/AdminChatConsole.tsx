"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SessionSummary = {
  id: string;
  direction: string | null;
  source: string | null;
  message_count: number | null;
  last_at: string;
  human_active: boolean;
  contact_email: string | null;
  firstQuestion: string;
};

type Msg = { role: string; content: string; fromAdmin: boolean; at: string };

const DIRECTION_LABELS: Record<string, string> = {
  story: "My story & life",
  case: "The J6 case & record",
  work: "Work with Ryan",
  j6_defendant: "J6 defendant / family",
};
const SOURCE_LABELS: Record<string, string> = {
  x: "X / Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  google: "Google search",
  ai: "AI recommended",
  business: "Business / work",
  word_of_mouth: "Word of mouth",
  other: "Other",
};

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function AdminChatConsole({ sessions }: { sessions: SessionSummary[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [human, setHuman] = useState(false);
  const [contact, setContact] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const cursor = useRef<string>(new Date(0).toISOString());
  const endRef = useRef<HTMLDivElement>(null);

  const selectConversation = useCallback(async (id: string) => {
    setSelected(id);
    setThread([]);
    setHuman(false);
    setContact(null);
    cursor.current = new Date(0).toISOString();
    try {
      const res = await fetch(`/api/admin/chat-thread?chatId=${encodeURIComponent(id)}`);
      const data = await res.json().catch(() => null);
      if (data?.ok) {
        setThread(data.messages);
        setHuman(!!data.human);
        setContact(data.contact ?? null);
        if (data.messages.length)
          cursor.current = data.messages[data.messages.length - 1].at;
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Poll the open conversation for new visitor + AI messages.
  useEffect(() => {
    if (!selected) return;
    let alive = true;
    async function poll() {
      try {
        const res = await fetch(
          `/api/admin/chat-thread?chatId=${encodeURIComponent(selected!)}&after=${encodeURIComponent(cursor.current)}`,
        );
        const data = await res.json().catch(() => null);
        if (!alive || !data?.ok) return;
        setHuman(!!data.human);
        if (data.contact) setContact(data.contact);
        if (Array.isArray(data.messages) && data.messages.length) {
          setThread((t) => [...t, ...data.messages]);
          cursor.current = data.messages[data.messages.length - 1].at;
        }
      } catch {
        /* ignore */
      }
    }
    const timer = window.setInterval(poll, 4000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [selected]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread]);

  async function sendReply() {
    const content = input.trim();
    if (!content || !selected || sending) return;
    setSending(true);
    setInput("");
    const nowIso = new Date().toISOString();
    setThread((t) => [...t, { role: "assistant", content, fromAdmin: true, at: nowIso }]);
    setHuman(true);
    cursor.current = nowIso;
    try {
      await fetch("/api/admin/chat-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selected, content }),
      });
    } catch {
      /* best-effort */
    } finally {
      setSending(false);
    }
  }

  async function setMode(next: boolean) {
    if (!selected) return;
    setHuman(next);
    try {
      await fetch("/api/admin/chat-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selected, human: next }),
      });
    } catch {
      /* best-effort */
    }
  }

  if (sessions.length === 0) {
    return (
      <p className="mt-10 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-muted)]">
        No conversations yet. They&apos;ll show up here the moment someone chats
        with you.
      </p>
    );
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      {/* List */}
      <div className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
        {sessions.map((s) => {
          const dir = s.direction ? DIRECTION_LABELS[s.direction] ?? s.direction : null;
          const src = s.source ? SOURCE_LABELS[s.source] ?? s.source : null;
          const active = selected === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => selectConversation(s.id)}
              className={[
                "w-full rounded-lg border p-3 text-left transition",
                active
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-bold text-[var(--color-ink)]">
                  {s.firstQuestion}
                </p>
                {s.human_active ? (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                ) : null}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--color-muted)]">
                {dir ? (
                  <span className="font-semibold text-[var(--color-accent)]">{dir}</span>
                ) : null}
                {src ? <span>via {src}</span> : null}
                <span>{s.message_count ?? 0} msgs</span>
                <span>· {timeAgo(s.last_at)}</span>
                {s.contact_email ? <span>· ✉ {s.contact_email}</span> : null}
              </p>
            </button>
          );
        })}
      </div>

      {/* Detail */}
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]">
        {!selected ? (
          <div className="grid h-full min-h-[16rem] place-items-center p-8 text-center text-sm text-[var(--color-muted)]">
            Select a conversation to read it — or jump in and talk to them live.
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--color-ink)]">
                  {human ? "You are live in this chat" : "Ryan's AI is handling this"}
                </p>
                {contact ? (
                  <p className="truncate text-xs text-[var(--color-ink-soft)]">
                    Contact: {contact}
                  </p>
                ) : null}
              </div>
              {human ? (
                <button
                  type="button"
                  onClick={() => setMode(false)}
                  className="shrink-0 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)]"
                >
                  Hand back to AI
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode(true)}
                  className="shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-black text-white transition hover:brightness-105"
                >
                  Take over & reply
                </button>
              )}
            </div>

            <div className="max-h-[52vh] flex-1 space-y-3 overflow-y-auto p-4">
              {thread.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[var(--color-paper)] px-3.5 py-2 text-sm text-[var(--color-ink)]">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex flex-col items-end">
                    <span
                      className={[
                        "mb-1 mr-1 text-[10px] font-black uppercase tracking-wider",
                        m.fromAdmin ? "text-emerald-600" : "text-[var(--color-muted)]",
                      ].join(" ")}
                    >
                      {m.fromAdmin ? "You · live" : "Ryan's AI"}
                    </span>
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm border border-[var(--color-line)] bg-[var(--color-accent-soft)] px-3.5 py-2 text-sm text-[var(--color-ink)]">
                      {m.content}
                    </div>
                  </div>
                ),
              )}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendReply();
              }}
              className="flex items-end gap-2 border-t border-[var(--color-line)] p-3"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
                rows={1}
                placeholder="Type your reply to them…"
                className="min-h-[42px] max-h-32 flex-1 resize-none rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:brightness-105 disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
