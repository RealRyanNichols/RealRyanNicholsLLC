// A small, consistent label that tells readers what kind of thing they're
// looking at — documented evidence vs. testimony vs. claim vs. commentary.
// Renders nothing for an unknown/missing kind, so it never breaks existing UI.

type BadgeDef = { label: string; cls: string };

const BADGES: Record<string, BadgeDef> = {
  "court-filing": { label: "Court Filing", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700" },
  grievance: { label: "Grievance", cls: "border-blue-500/40 bg-blue-500/10 text-blue-700" },
  eyewitness: { label: "Eyewitness Statement", cls: "border-blue-500/40 bg-blue-500/10 text-blue-700" },
  "ryan-statement": { label: "Ryan's Statement", cls: "border-[var(--color-accent)]/45 bg-[var(--color-accent)]/10 text-[var(--color-accent)]" },
  corroborated: { label: "Third-Party Corroborated", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700" },
  "unverified-tip": { label: "Unverified Tip", cls: "border-amber-500/50 bg-amber-500/10 text-amber-700" },
  opinion: { label: "Opinion / Commentary", cls: "border-slate-400/40 bg-slate-400/10 text-slate-600" },
  media: { label: "Media / Video", cls: "border-violet-500/40 bg-violet-500/10 text-violet-700" },
  timeline: { label: "Timeline Entry", cls: "border-slate-400/40 bg-slate-400/10 text-slate-600" },
};

export type EvidenceKind = keyof typeof BADGES;

// Map free-form source strings (e.g. case_documents.doc_type) onto a badge kind.
function resolve(kind: string): BadgeDef | null {
  const k = kind.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (BADGES[k]) return BADGES[k];
  // Common aliases from existing data.
  if (/(court|filing|motion|order|brief|docket|indictment|complaint)/.test(k)) return BADGES["court-filing"];
  if (/(grievance|complaint-filed)/.test(k)) return BADGES.grievance;
  if (/(eyewitness|witness|statement-of)/.test(k)) return BADGES.eyewitness;
  if (/(ryan|defendant|my-statement|declaration)/.test(k)) return BADGES["ryan-statement"];
  if (/(corroborat|verified|confirmed)/.test(k)) return BADGES.corroborated;
  if (/(tip|unverified|lead|needs-auth)/.test(k)) return BADGES["unverified-tip"];
  if (/(opinion|commentary|op-ed|analysis)/.test(k)) return BADGES.opinion;
  if (/(video|media|image|photo|clip|bodycam|audio)/.test(k)) return BADGES.media;
  if (/(timeline|event)/.test(k)) return BADGES.timeline;
  return null;
}

export function EvidenceBadge({
  kind,
  className = "",
}: {
  kind?: string | null;
  className?: string;
}) {
  if (!kind) return null;
  const def = resolve(kind);
  if (!def) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${def.cls} ${className}`}
      title={`Evidence type: ${def.label}`}
    >
      {def.label}
    </span>
  );
}
