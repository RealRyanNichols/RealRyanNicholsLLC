"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type Turn = { role: "user" | "assistant"; content: string };
type Variant = "hero" | "launcher";

const SUGGESTIONS = [
  "What happened with January 6 and the pardon?",
  "How do you rebuild after prison?",
  "What do you believe about God?",
  "Can you build something for my business?",
];

const GREETING =
  "I'm Ryan's AI — trained on his words, in his voice. Ask me about the case, faith, rebuilding, or working together. He reads what comes through and jumps in himself when he can.";

function useRyanChat(surface: string) {
  const [messages, setMessages] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;
    const next: Turn[] = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setLoading(true);
    trackEvent("chat_send", { surface });
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json().catch(() => null);
      let reply: string;
      if (res.ok && data?.reply) {
        reply = data.reply as string;
      } else if (res.status === 503) {
        reply =
          "I'm just coming online here. In the meantime, send it through the tip line or join my list and I'll get to you myself.";
      } else if (res.status === 429) {
        reply = "Give me just a second, then ask me again.";
      } else {
        reply =
          "I'm having trouble answering right now. Drop it on the tip line and I'll get to it myself.";
      }
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Something glitched on my end. Try again, or leave it on the tip line and I'll see it.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return { messages, loading, send };
}

function Thread({
  messages,
  loading,
  compact,
}: {
  messages: Turn[];
  loading: boolean;
  compact?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  return (
    <div
      className={compact ? "space-y-3" : "space-y-4"}
      aria-live="polite"
    >
      {messages.length === 0 ? (
        <div className="rounded-2xl rounded-tl-sm border border-[var(--color-line)] bg-[var(--color-accent-soft)] px-4 py-3 text-sm leading-relaxed text-[var(--color-ink)]">
          {GREETING}
        </div>
      ) : null}

      {messages.map((m, i) =>
        m.role === "user" ? (
          <div key={i} className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[var(--color-surface)] px-4 py-2.5 text-sm leading-relaxed text-[var(--color-ink)]">
              {m.content}
            </div>
          </div>
        ) : (
          <div key={i} className="flex justify-start">
            <div className="max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-[var(--color-line)] bg-[var(--color-accent-soft)] px-4 py-2.5 text-sm leading-relaxed text-[var(--color-ink)]">
              {m.content}
            </div>
          </div>
        ),
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent)] [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent)] [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent)]" />
          </span>
          Ryan's AI is typing…
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}

function Composer({
  onSend,
  loading,
  autoFocus,
}: {
  onSend: (t: string) => void;
  loading: boolean;
  autoFocus?: boolean;
}) {
  const [input, setInput] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend(input);
        setInput("");
      }}
      className="flex items-end gap-2"
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend(input);
            setInput("");
          }
        }}
        rows={1}
        autoFocus={autoFocus}
        placeholder="Ask me anything…"
        className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
      />
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--color-accent)] text-[var(--color-ink)] transition hover:brightness-105 disabled:opacity-40"
        aria-label="Send"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4 20-7z" />
        </svg>
      </button>
    </form>
  );
}

function Monogram({ size = "h-10 w-10" }: { size?: string }) {
  return (
    <span
      className={`grid ${size} shrink-0 place-items-center rounded-xl bg-[var(--color-accent)] font-display text-sm font-black text-[var(--color-ink)]`}
      aria-hidden
    >
      RN
    </span>
  );
}

export function RyanChat({
  variant = "hero",
  surface = "home",
}: {
  variant?: Variant;
  surface?: string;
}) {
  const { messages, loading, send } = useRyanChat(surface);
  const [open, setOpen] = useState(false);

  // Esc closes the launcher panel.
  useEffect(() => {
    if (variant !== "launcher") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  if (variant === "hero") {
    return (
      <section className="overflow-hidden rounded-2xl border border-[var(--color-accent)]/40 bg-[var(--color-paper)] shadow-[0_0_0_1px_var(--color-accent-glow)]">
        <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4">
          <div className="flex items-center gap-3">
            <Monogram />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Talk to me
              </p>
              <h2 className="font-display text-xl font-bold tracking-tight text-[var(--color-ink)]">
                Ask me anything — in my own words.
              </h2>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="max-h-[340px] overflow-y-auto pr-1">
            <Thread messages={messages} loading={loading} />
          </div>

          {messages.length === 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4">
            <Composer onSend={send} loading={loading} />
          </div>
          <p className="mt-2 text-[11px] text-[var(--color-muted)]">
            Ryan&apos;s AI, trained on his words. He reads what comes through.
          </p>
        </div>
      </section>
    );
  }

  // launcher (desktop only — mobile uses the homepage hero + the bottom bar)
  return (
    <div className="hidden lg:block">
      {open ? (
        <div
          role="dialog"
          aria-label="Talk to Ryan"
          className="fixed bottom-5 right-5 z-50 flex h-[560px] w-[380px] flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-ink)] px-4 py-3 text-[var(--color-paper)]">
            <div className="flex items-center gap-2.5">
              <Monogram size="h-8 w-8" />
              <div>
                <p className="text-sm font-bold leading-tight">Talk to Ryan</p>
                <p className="text-[11px] leading-tight text-[var(--color-paper)]/70">
                  Answers in his voice
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1 text-[var(--color-paper)]/80 transition hover:bg-white/10 hover:text-[var(--color-paper)]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-5 w-5">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <Thread messages={messages} loading={loading} compact />
            {messages.length === 0 ? (
              <div className="mt-3 flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-left text-xs font-semibold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="border-t border-[var(--color-line)] px-3 py-3">
            <Composer onSend={send} loading={loading} autoFocus />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            trackEvent("chat_open", { surface });
          }}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-[var(--color-accent)] px-4 py-3 text-sm font-bold text-[var(--color-ink)] shadow-xl shadow-[var(--color-accent-glow)] transition hover:brightness-105"
          aria-label="Talk to Ryan"
        >
          <Monogram size="h-7 w-7" />
          Talk to Ryan
        </button>
      )}
    </div>
  );
}
