"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Hit = {
  id: string;
  label: string;
  type: "defendant" | "case";
  sub: string;
};
type BriefingResp = {
  ok: boolean;
  briefing_md?: string;
  cached?: boolean;
  error?: string;
  message?: string;
  retry_in_ms?: number;
};

export function CaseBriefingForm() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [picked, setPicked] = useState<Hit | null>(null);
  const [question, setQuestion] = useState("");
  const [briefing, setBriefing] = useState<BriefingResp | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || picked) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.rpc("nexus_search", { q: query.trim() });
      setHits((data as Hit[]) ?? []);
    }, 180);
    return () => clearTimeout(t);
  }, [query, picked]);

  async function generate() {
    if (!picked) return;
    setLoading(true);
    setBriefing(null);
    try {
      const entityId = picked.id.split(":").slice(1).join(":");
      const res = await fetch("/api/case/briefing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entity_type: picked.type,
          entity_id: entityId,
          question: question.trim() || undefined,
        }),
      });
      const json = (await res.json()) as BriefingResp;
      setBriefing(json);
    } finally {
      setLoading(false);
    }
  }

  const briefingHtml = useMemo(() => {
    if (!briefing?.briefing_md) return null;
    return renderMarkdown(briefing.briefing_md);
  }, [briefing]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-surface)] p-5">
        <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold mb-1.5">
          1. Pick an entity
        </label>
        <div className="relative">
          <input
            type="search"
            value={picked ? picked.label : query}
            onChange={(e) => {
              setPicked(null);
              setQuery(e.target.value);
            }}
            placeholder="Defendant name or case number"
            className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm font-mono focus:border-[var(--color-blue)] focus:outline-none"
          />
          {hits.length > 0 && !picked ? (
            <ul className="absolute top-full mt-1 left-0 right-0 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-md shadow-lg max-h-72 overflow-auto z-20">
              {hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked(h);
                      setQuery("");
                      setHits([]);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--color-surface)] flex items-baseline justify-between gap-3"
                  >
                    <span className="text-sm">
                      <span
                        className={
                          h.type === "case"
                            ? "text-[var(--color-blue)]"
                            : "text-[var(--color-accent)]"
                        }
                      >
                        {h.type === "case" ? "case" : "def."}
                      </span>{" "}
                      {h.label}
                    </span>
                    <span className="text-xs text-[var(--color-muted)] font-mono">
                      {h.sub}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {picked ? (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="rounded-full border border-[var(--color-blue)] bg-[var(--color-blue-soft)] text-[var(--color-blue)] px-2.5 py-0.5 font-bold">
              {picked.type}
            </span>
            <span className="font-mono text-[var(--color-ink)]">{picked.label}</span>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="ml-2 text-[var(--color-muted)] hover:text-[var(--color-ink)] underline underline-offset-2"
            >
              change
            </button>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-surface)] p-5">
        <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold mb-1.5">
          2. Ask a question (optional)
        </label>
        <textarea
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Was a plea agreement reached? What's the sentence pattern across this case?"
          className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm focus:border-[var(--color-blue)] focus:outline-none"
        />
        <p className="mt-1.5 text-[11px] text-[var(--color-muted)]">
          Leave blank for a default briefing (status, key facts, open
          questions).
        </p>
      </div>

      <button
        type="button"
        onClick={generate}
        disabled={!picked || loading}
        className="w-full rounded-full bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-3 text-sm font-bold hover:bg-[var(--color-blue-strong)] disabled:opacity-50 transition"
      >
        {loading ? "Generating briefing…" : "Generate briefing →"}
      </button>

      {briefing ? (
        <div className="rounded-2xl border-2 border-[#e1bd5b] bg-[#0e1a36] text-[#cfd9ea] p-5">
          {briefing.ok ? (
            <>
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#e1bd5b]">
                  Briefing {briefing.cached ? "· cached" : "· fresh"}
                </p>
              </div>
              <div
                className="prose-body prose-invert text-sm leading-relaxed [&_h2]:font-display [&_h2]:text-[var(--color-paper)] [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-[#e1bd5b] [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5"
                dangerouslySetInnerHTML={{ __html: briefingHtml ?? "" }}
              />
            </>
          ) : (
            <div>
              <p className="text-sm font-bold text-[#ff7f7f]">
                {briefing.error ?? "Briefing failed"}
              </p>
              {briefing.message ? (
                <p className="mt-1 text-xs text-[#a9b7d0]">{briefing.message}</p>
              ) : null}
              {briefing.retry_in_ms ? (
                <p className="mt-1 text-xs text-[#a9b7d0]">
                  Retry in {Math.ceil(briefing.retry_in_ms / 1000)}s.
                </p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

// Lightweight markdown renderer for the briefing output. Handles ## H2,
// **bold**, *italic*, - lists, and paragraphs. Escapes raw HTML so we
// don't ever inject untrusted markup from a model response.
function renderMarkdown(md: string): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  let para: string[] = [];
  function flushPara() {
    if (para.length === 0) return;
    const html = inlineFormat(esc(para.join(" ")));
    out.push(`<p>${html}</p>`);
    para = [];
  }
  function closeList() {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  }
  for (const raw of lines) {
    const ln = raw.trim();
    if (!ln) {
      flushPara();
      closeList();
      continue;
    }
    if (ln.startsWith("## ")) {
      flushPara();
      closeList();
      out.push(`<h2>${inlineFormat(esc(ln.slice(3)))}</h2>`);
      continue;
    }
    if (ln.startsWith("# ")) {
      flushPara();
      closeList();
      out.push(`<h3>${inlineFormat(esc(ln.slice(2)))}</h3>`);
      continue;
    }
    if (ln.startsWith("- ") || ln.startsWith("* ")) {
      flushPara();
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inlineFormat(esc(ln.slice(2)))}</li>`);
      continue;
    }
    closeList();
    para.push(ln);
  }
  flushPara();
  closeList();
  return out.join("\n");
}

function inlineFormat(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
