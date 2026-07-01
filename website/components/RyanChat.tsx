"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { getVisitorId } from "@/lib/client-ids";

type Turn = { role: "user" | "assistant"; content: string; live?: boolean };
type Variant = "hero" | "launcher";

const SUGGESTIONS = [
  "What happened with January 6 and the pardon?",
  "How do you rebuild after prison?",
  "What do you believe about God?",
  "Can you build something for my business?",
];

const GREETING =
  "This is a direct line to me — trained on my own words, in my voice. Ask me about the case, faith, rebuilding, or working together. I read every one, and when I'm around I'll jump in myself.";

const TEASER_KEY = "rrn_chat_teaser_seen";
const PROFILE_KEY = "rrn_visitor_profile";

function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto)
      return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function readProfile(): { direction: string | null; source: string | null } {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    return { direction: p.direction ?? null, source: p.source ?? null };
  } catch {
    return { direction: null, source: null };
  }
}

function useRyanChat(surface: string) {
  const [messages, setMessages] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [human, setHuman] = useState(false);
  const [started, setStarted] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const chatId = useRef<string | null>(null);
  const cursor = useRef<string>(new Date().toISOString());

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;
    if (!chatId.current) chatId.current = makeId();
    setStarted(true);
    const next: Turn[] = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setLoading(true);
    trackEvent("chat_send", { surface });
    try {
      const profile = readProfile();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          chatId: chatId.current,
          visitorId: getVisitorId(),
          direction: profile.direction,
          source: profile.source,
          surface,
          path: typeof window !== "undefined" ? window.location.pathname : null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.human) {
        setHuman(true); // Ryan is handling this live — his reply arrives via poll
      } else if (res.ok && data?.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      } else if (res.status === 503) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "I'm just coming online here. In the meantime, send it through the tip line or leave your email below and I'll get to you myself.",
          },
        ]);
      } else if (res.status === 429) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Give me just a second, then ask me again." },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "I'm having trouble answering right now. Leave your email below and I'll get to it myself.",
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Something glitched on my end. Try again, or leave your email below and I'll see it.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Once a conversation exists, poll for Ryan's LIVE replies + takeover state.
  useEffect(() => {
    if (!started) return;
    let alive = true;
    async function poll() {
      const id = chatId.current;
      if (!id) return;
      try {
        const res = await fetch(
          `/api/chat/poll?chatId=${encodeURIComponent(id)}&after=${encodeURIComponent(cursor.current)}`,
        );
        const data = await res.json().catch(() => null);
        if (!alive || !data?.ok) return;
        if (typeof data.human === "boolean") setHuman(data.human);
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages((m) => [
            ...m,
            ...data.messages.map((x: { content: string }) => ({
              role: "assistant" as const,
              content: x.content,
              live: true,
            })),
          ]);
          const last = data.messages[data.messages.length - 1];
          cursor.current = last.at || new Date().toISOString();
        }
      } catch {
        /* best-effort */
      }
    }
    const timer = window.setInterval(poll, 4000);
    poll();
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [started]);

  async function submitContact(email: string) {
    const clean = email.trim();
    if (!chatId.current || !clean.includes("@")) return;
    try {
      await fetch("/api/chat/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chatId.current, email: clean }),
      });
      setContactSent(true);
      trackEvent("chat_contact", { surface });
    } catch {
      /* best-effort */
    }
  }

  return { messages, loading, human, started, contactSent, send, submitContact };
}

function Thread({
  messages,
  loading,
  human,
  compact,
}: {
  messages: Turn[];
  loading: boolean;
  human: boolean;
  compact?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolled = useRef(false);
  useEffect(() => {
    // Scroll only the chat's own overflow box — never the page. scrollIntoView
    // walks every scrollable ancestor, so the inline homepage chat yanked the
    // whole page down toward #talk on first load.
    const end = endRef.current;
    if (!end) return;
    let box: HTMLElement | null = end.parentElement;
    while (box && box.scrollHeight <= box.clientHeight + 1) {
      box = box.parentElement;
    }
    if (!box || box === document.body || box === document.documentElement) return;
    box.scrollTo({
      top: box.scrollHeight,
      behavior: hasAutoScrolled.current ? "smooth" : "auto",
    });
    hasAutoScrolled.current = true;
  }, [messages, loading]);

  return (
    <div className={compact ? "space-y-3" : "space-y-4"} aria-live="polite">
      {messages.length === 0 ? (
        <div className="rounded-2xl rounded-tl-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
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
          <div key={i} className="flex flex-col items-start">
            {m.live ? (
              <span className="mb-1 ml-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                Ryan · live
              </span>
            ) : null}
            <div className="max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-[var(--color-line)] bg-[var(--color-accent-soft)] px-4 py-2.5 text-sm leading-relaxed text-[var(--color-ink)]">
              {m.content}
            </div>
          </div>
        ),
      )}

      {loading && !human ? (
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent)] [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent)] [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent)]" />
          </span>
          Ryan&apos;s AI is typing…
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
  const [talking, setTalking] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    setMicSupported(Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition));
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* already stopped */
      }
    };
  }, []);

  function toggleTalk() {
    if (talking) {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      setTalking(false);
      return;
    }
    type RecInstance = {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start: () => void;
      stop: () => void;
      onresult:
        | ((e: {
            resultIndex: number;
            results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
          }) => void)
        | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
    };
    const w = window as unknown as {
      SpeechRecognition?: new () => RecInstance;
      webkitSpeechRecognition?: new () => RecInstance;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) text += r[0]?.transcript ?? "";
      }
      if (text.trim()) {
        setInput((prev) => (prev ? `${prev} ${text.trim()}` : text.trim()));
      }
    };
    rec.onend = () => setTalking(false);
    rec.onerror = () => setTalking(false);
    recRef.current = rec;
    try {
      rec.start();
      setTalking(true);
      trackEvent("chat_talk_to_text", {});
    } catch {
      /* start() while running throws — ignore */
    }
  }

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
        placeholder={talking ? "Listening… just talk." : "Ask me anything — tap the mic and just talk"}
        className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
      />
      {micSupported ? (
        <button
          type="button"
          onClick={toggleTalk}
          aria-label={talking ? "Stop talking" : "Talk instead of type"}
          aria-pressed={talking}
          className={[
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition",
            talking
              ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-[#fdf8ea] animate-pulse"
              : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink-soft)] hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]",
          ].join(" ")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </button>
      ) : null}
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

function ContactRow({
  onSubmit,
  sent,
}: {
  onSubmit: (email: string) => void;
  sent: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  if (sent) {
    return (
      <p className="mt-2 text-[11px] font-semibold text-emerald-600">
        Got it — Ryan will reach out to you personally.
      </p>
    );
  }
  return open ? (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email);
      }}
      className="mt-2 flex items-center gap-2"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="min-h-9 flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
      />
      <button
        type="submit"
        className="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-xs font-bold text-[var(--color-paper)]"
      >
        Send to Ryan
      </button>
    </form>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="mt-2 text-[11px] font-semibold text-[var(--color-accent)] hover:underline"
    >
      Want a personal reply? Leave your email →
    </button>
  );
}

function LiveBanner() {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700">
      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
      You&apos;re talking to Ryan live.
    </div>
  );
}

function OfferRow() {
  const offers = [
    { href: "/book", label: "📖 The book" },
    { href: "/services", label: "🔨 Work with me" },
    { href: "/submit", label: "📨 Send a tip" },
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-line)] pt-3">
      {offers.map((o) => (
        <a
          key={o.href}
          href={o.href}
          onClick={() => trackEvent("chat_offer_click", { offer: o.href })}
          className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          {o.label}
        </a>
      ))}
    </div>
  );
}

// Ryan's real face, not a monogram — his explicit call. Every chat surface
// (hero header, panel header, launcher pill) uses this.
function Avatar({ size = "h-10 w-10" }: { size?: string }) {
  return (
    <Image
      src="/avatar.jpg"
      alt=""
      width={80}
      height={80}
      className={`${size} shrink-0 rounded-full object-cover`}
      aria-hidden
    />
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-5 w-5" aria-hidden>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}

export function RyanChat({
  variant = "hero",
  surface = "home",
}: {
  variant?: Variant;
  surface?: string;
}) {
  const { messages, loading, human, started, contactSent, send, submitContact } =
    useRyanChat(surface);
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);

  useEffect(() => {
    if (variant !== "launcher") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    // Any surface on any page can open the chat panel:
    // window.dispatchEvent(new Event("ryanchat:open"))
    function onOpenEvent() {
      openChat();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("ryanchat:open", onOpenEvent);
    let t: number | undefined;
    try {
      if (!localStorage.getItem(TEASER_KEY)) {
        t = window.setTimeout(() => setTeaser(true), 4500);
      }
    } catch {
      /* ignore */
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ryanchat:open", onOpenEvent);
      if (t) window.clearTimeout(t);
    };
  }, [variant]);

  function markTeaserSeen() {
    try {
      localStorage.setItem(TEASER_KEY, "1");
    } catch {
      /* ignore */
    }
  }
  function openChat() {
    setOpen(true);
    setTeaser(false);
    markTeaserSeen();
    trackEvent("chat_open", { surface });
  }

  if (variant === "hero") {
    return (
      <section className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-navy)]">
                Talk to me — a direct line
              </p>
              <h2 className="font-display text-xl font-bold tracking-tight text-[var(--color-ink)]">
                Ask me anything — in my own words.
              </h2>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          {human ? <LiveBanner /> : null}
          <div className="max-h-[340px] overflow-y-auto pr-1">
            <Thread messages={messages} loading={loading} human={human} />
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
          {started ? (
            <ContactRow onSubmit={submitContact} sent={contactSent} />
          ) : (
            <p className="mt-2 text-[11px] text-[var(--color-muted)]">
              A direct line to Ryan. He reads what comes through.
            </p>
          )}
          <OfferRow />
        </div>
      </section>
    );
  }

  // launcher — every screen size. On phones it floats above the bottom
  // action bar; the open panel goes near-full-screen. This is the front
  // door to the whole data engine: it has to be seen.
  return (
    <div>
      {open ? (
        <div
          role="dialog"
          aria-label="Talk to Ryan"
          className="fixed inset-x-2 bottom-2 z-50 flex h-[82dvh] flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] shadow-2xl lg:inset-x-auto lg:bottom-5 lg:right-5 lg:h-[564px] lg:w-[384px]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-ink)] px-4 py-3 text-[var(--color-paper)]">
            <div className="flex items-center gap-2.5">
              <span className="relative">
                <Avatar size="h-9 w-9" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--color-ink)] bg-emerald-400" />
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">Talk to Ryan</p>
                <p className="text-[11px] leading-tight text-[var(--color-paper)]/70">
                  A direct line · he reads every one
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1 text-[var(--color-paper)]/80 transition hover:bg-white/10 hover:text-[var(--color-paper)]"
            >
              <CloseGlyph />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {human ? <LiveBanner /> : null}
            <Thread messages={messages} loading={loading} human={human} compact />
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
            {started ? (
              <ContactRow onSubmit={submitContact} sent={contactSent} />
            ) : null}
            <OfferRow />
          </div>

          <div className="border-t border-[var(--color-line)] px-3 py-3">
            <Composer onSend={send} loading={loading} autoFocus />
          </div>
        </div>
      ) : (
        <div className="fixed right-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-3 lg:bottom-6 lg:right-6">
          {teaser ? (
            <div className="relative max-w-[280px] rounded-2xl rounded-br-sm border border-[#e1bd5b]/50 bg-[#0b1b34] px-4 py-3 shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setTeaser(false);
                  markTeaserSeen();
                }}
                aria-label="Dismiss"
                className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-[#e1bd5b]/50 bg-[#0b1b34] text-sm text-[#cfd9ea] shadow"
              >
                ×
              </button>
              <button type="button" onClick={openChat} className="block text-left">
                <p className="text-sm font-bold text-[#fdf8ea]">
                  Ask me anything. Out loud, if you want.
                </p>
                <p className="mt-0.5 text-xs text-[#cfd9ea]">
                  The case, the comeback, building your own platform — tap the
                  mic and just talk. I read every single one.
                </p>
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={openChat}
            aria-label="Talk to Ryan"
            className="flex items-center gap-3 rounded-full border border-[#e1bd5b]/50 bg-[#0b1b34] py-2.5 pl-2.5 pr-5 shadow-2xl transition hover:border-[#e1bd5b] lg:py-3 lg:pl-3 lg:pr-6"
          >
            <span className="relative">
              <Avatar size="h-11 w-11 lg:h-14 lg:w-14" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0b1b34] bg-emerald-400" />
            </span>
            <span className="text-left leading-tight">
              <span className="block text-base font-black text-[#fdf8ea] lg:text-lg">
                Talk to Ryan
              </span>
              <span className="block text-xs font-semibold text-[#e1bd5b] lg:text-sm">
                Tap the mic and just talk
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
