export type IntakeRouteKind =
  | "case_map"
  | "verify"
  | "article"
  | "service"
  | "watch";

export type IntakeRoutePlan = {
  kind: IntakeRouteKind;
  label: string;
  urgency: "hot" | "next" | "watch";
  score: number;
  reason: string;
  nextActions: string[];
  tags: string[];
};

export type IntakeRouteInput = {
  category?: string | null;
  subject?: string | null;
  location?: string | null;
  narrative?: string | null;
  urls?: string[] | null;
};

const ROUTE_COPY: Record<IntakeRouteKind, { label: string; reason: string }> = {
  case_map: {
    label: "Map this clue",
    reason: "This looks like it can connect a person, place, date, agency, or document to another record.",
  },
  verify: {
    label: "Verify evidence",
    reason: "This has source-file value, but it needs native proof or a second confirmation before use.",
  },
  article: {
    label: "Article lead",
    reason: "This has public-story value and could become a post, explainer, or call for more witnesses.",
  },
  service: {
    label: "Follow up",
    reason: "This may be a person asking for help, a paid-service lead, or a private response path.",
  },
  watch: {
    label: "Watch file",
    reason: "This is useful signal, but it needs more specifics before it becomes a case or article lane.",
  },
};

const KEYWORDS = {
  evidence: [
    "affidavit",
    "bodycam",
    "cad",
    "case number",
    "charging",
    "court",
    "dashcam",
    "document",
    "evidence",
    "exhibit",
    "filing",
    "photo",
    "police report",
    "record",
    "screenshot",
    "transcript",
    "video",
    "witness",
  ],
  map: [
    "agency",
    "attorney",
    "court",
    "doj",
    "fbi",
    "judge",
    "jail",
    "officer",
    "prosecutor",
    "sheriff",
    "source",
    "witness",
  ],
  article: [
    "corruption",
    "cover up",
    "expose",
    "public",
    "story",
    "threat",
    "viral",
    "wrong",
  ],
  service: [
    "call",
    "case review",
    "contact me",
    "help me",
    "hire",
    "invoice",
    "pay",
    "price",
    "strategy",
  ],
};

export function buildIntakeRoutePlan(input: IntakeRouteInput): IntakeRoutePlan {
  const text = [
    input.category,
    input.subject,
    input.location,
    input.narrative,
    ...(input.urls ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const evidenceHits = countHits(text, KEYWORDS.evidence);
  const mapHits = countHits(text, KEYWORDS.map);
  const articleHits = countHits(text, KEYWORDS.article);
  const serviceHits = countHits(text, KEYWORDS.service);
  const hasUrls = (input.urls ?? []).length > 0;
  const hasSubject = Boolean(input.subject?.trim());
  const hasLocation = Boolean(input.location?.trim());
  const hasDate = /\b(20\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(text);

  const scores: Record<IntakeRouteKind, number> = {
    case_map: mapHits * 12 + (hasSubject ? 10 : 0) + (hasLocation ? 8 : 0) + (hasDate ? 8 : 0),
    verify: evidenceHits * 13 + (hasUrls ? 15 : 0) + (hasDate ? 8 : 0),
    article: articleHits * 12 + (text.length > 700 ? 10 : 0) + (hasUrls ? 4 : 0),
    service: serviceHits * 16 + (input.category === "other" ? 4 : 0),
    watch: 18,
  };

  const kind = (Object.entries(scores) as [IntakeRouteKind, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "watch";
  const score = Math.min(100, Math.max(18, scores[kind]));
  const urgency: IntakeRoutePlan["urgency"] =
    score >= 56 || (hasUrls && evidenceHits > 1)
      ? "hot"
      : score >= 34
        ? "next"
        : "watch";
  const tags = buildTags(input, { evidenceHits, mapHits, articleHits, serviceHits, hasUrls, hasDate });

  return {
    kind,
    label: ROUTE_COPY[kind].label,
    urgency,
    score,
    reason: ROUTE_COPY[kind].reason,
    nextActions: nextActionsFor(kind, {
      hasUrls,
      hasSubject,
      hasLocation,
      hasDate,
      evidenceHits,
    }),
    tags,
  };
}

function countHits(text: string, keywords: string[]): number {
  return keywords.reduce((count, keyword) => {
    return text.includes(keyword) ? count + 1 : count;
  }, 0);
}

function buildTags(
  input: IntakeRouteInput,
  signals: {
    evidenceHits: number;
    mapHits: number;
    articleHits: number;
    serviceHits: number;
    hasUrls: boolean;
    hasDate: boolean;
  },
): string[] {
  const tags = new Set<string>();
  if (input.category) tags.add(input.category);
  if (input.subject?.trim()) tags.add("subject");
  if (input.location?.trim()) tags.add("location");
  if (signals.hasUrls) tags.add("links");
  if (signals.hasDate) tags.add("date");
  if (signals.evidenceHits > 0) tags.add("evidence");
  if (signals.mapHits > 0) tags.add("connection");
  if (signals.articleHits > 0) tags.add("story");
  if (signals.serviceHits > 0) tags.add("service");
  return Array.from(tags).slice(0, 8);
}

function nextActionsFor(
  kind: IntakeRouteKind,
  signals: {
    hasUrls: boolean;
    hasSubject: boolean;
    hasLocation: boolean;
    hasDate: boolean;
    evidenceHits: number;
  },
): string[] {
  const missing: string[] = [];
  if (!signals.hasSubject) missing.push("subject/person");
  if (!signals.hasLocation) missing.push("location");
  if (!signals.hasDate) missing.push("date");

  if (kind === "case_map") {
    return [
      "Match the named person, agency, court, or place to an existing case node.",
      "Add one source-backed connection note to the case nexus or intake ledger.",
      missing.length ? `Ask for missing ${missing.join(", ")} before publishing details.` : "Request native files if the connection is not already sourced.",
    ];
  }
  if (kind === "verify") {
    return [
      signals.hasUrls ? "Open each link and preserve screenshots/source URLs." : "Ask the sender for a document, URL, video, or screenshot.",
      "Separate facts, claims, and private identifying details before use.",
      "If verified, merge into a case document, profile, timeline, or article receipt.",
    ];
  }
  if (kind === "article") {
    return [
      "Draft a public-safe angle: what happened, why it matters, what is still missing.",
      "Ask the public for one specific record or witness confirmation.",
      "Link the post back to submit a tip, donate, and the intake ledger.",
    ];
  }
  if (kind === "service") {
    return [
      "Reply privately and identify whether this is case review, strategy call, or evidence triage.",
      "If help is requested, point to the right service offer or invoice path.",
      "Keep private facts out of the public ledger until consent and review are clear.",
    ];
  }
  return [
    "Keep it in the watch file and wait for one more source, date, or witness.",
    "Ask for the single best document or screenshot that proves the point.",
    "Do not publish the substance until the record can be verified.",
  ];
}
