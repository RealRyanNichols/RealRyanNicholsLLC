import { format } from "date-fns";
import type { IntakeRoutePlan } from "@/lib/intake-routing";

export type TipDraftSource = {
  id: string;
  category: string | null;
  location: string | null;
  defendant_name: string | null;
  urls: string[] | null;
  created_at: string;
};

export type TipDraft = {
  title: string;
  body: string;
  category: string;
};

export type TipDraftMode = "article" | "solution";

export function buildTipDraft(
  source: TipDraftSource,
  plan: IntakeRoutePlan,
  mode: TipDraftMode = "article",
): TipDraft {
  if (mode === "solution") return buildSolutionDraft(source, plan);

  const subject = cleanLine(source.defendant_name) || humanize(source.category || "tip");
  const location = cleanLine(source.location);
  const titleParts = ["Tip Lead", subject];
  if (location) titleParts.push(location);

  const sourceLinks = (source.urls ?? [])
    .filter((url) => /^https?:\/\//i.test(url))
    .slice(0, 8);
  const submittedAt = safeDateLabel(source.created_at);

  const body = [
    "> DRAFT CONTROL: This started from a private tip. Verify before publishing. Do not publish contact details, private messages, raw uploads, sealed material, minor names, home addresses, phone numbers, or unverified accusations.",
    "",
    "## What came in",
    "",
    `A lead came into the site about **${subject}**${location ? ` in **${location}**` : ""}.`,
    "",
    `- Intake route: **${plan.label}**`,
    `- Urgency: **${plan.urgency}**`,
    `- Category: **${humanize(source.category || "tip")}**`,
    `- Received: **${submittedAt}**`,
    `- Internal tip id: \`${source.id}\``,
    "",
    "## Public-safe angle",
    "",
    publicAngle(plan, subject, location),
    "",
    "## What has to be verified first",
    "",
    ...plan.nextActions.map((action) => `- ${action}`),
    "",
    "## Source links to check",
    "",
    ...(sourceLinks.length
      ? sourceLinks.map((url) => `- ${url}`)
      : ["- No public source link was attached. Ask for the best document, screenshot, video, or record URL before publishing."]),
    "",
    "## Internal source signal",
    "",
    "No private narrative excerpt is included in this draft. Review the private tip record in the admin queue before writing the public version.",
    "",
    "## Call for records",
    "",
    "If you have a document, video, court record, screenshot, date, witness statement, or public link that confirms or corrects this lead, send it through the tip line so it can be checked against the record.",
  ].join("\n");

  return {
    title: titleParts.join(": ").slice(0, 200),
    body,
    category: "tip-lead",
  };
}

function buildSolutionDraft(source: TipDraftSource, plan: IntakeRoutePlan): TipDraft {
  const subject = cleanLine(source.defendant_name) || humanize(source.category || "tip");
  const location = cleanLine(source.location);
  const sourceLinks = (source.urls ?? [])
    .filter((url) => /^https?:\/\//i.test(url))
    .slice(0, 8);
  const submittedAt = safeDateLabel(source.created_at);

  const body = [
    "> SOLUTION CONTROL: This started from a private tip. Treat it as an internal/public-safe action brief. Do not publish contact details, raw narrative, private uploads, sealed material, minor names, home addresses, phone numbers, or unverified accusations.",
    "",
    "## The problem to solve",
    "",
    `A lead came into the site about **${subject}**${location ? ` in **${location}**` : ""}. The immediate job is to turn it into an action lane, not a rumor.`,
    "",
    `- Route: **${plan.label}**`,
    `- Urgency: **${plan.urgency}**`,
    `- Score: **${plan.score}**`,
    `- Category: **${humanize(source.category || "tip")}**`,
    `- Received: **${submittedAt}**`,
    `- Internal tip id: \`${source.id}\``,
    "",
    "## First useful answer",
    "",
    solutionAnswer(plan, subject, location),
    "",
    "## Next three moves",
    "",
    ...plan.nextActions.map((action, index) => `${index + 1}. ${action}`),
    "",
    "## What to ask the submitter or public for",
    "",
    ...solutionAsks(plan).map((ask) => `- ${ask}`),
    "",
    "## Public source links to open",
    "",
    ...(sourceLinks.length
      ? sourceLinks.map((url) => `- ${url}`)
      : ["- No public source link was attached. Ask for the strongest public URL, record, screenshot, video, or document before moving this public."]),
    "",
    "## Where this can go",
    "",
    destinationFor(plan),
    "",
    "## Privacy line",
    "",
    "The public version can say a lead was received and what record is needed next. It should not quote private narrative, name private submitters, expose contact information, or turn an unchecked claim into a published accusation.",
  ].join("\n");

  return {
    title: `Solution Brief: ${subject}${location ? `: ${location}` : ""}`.slice(0, 200),
    body,
    category: "solution-brief",
  };
}

function publicAngle(plan: IntakeRoutePlan, subject: string, location: string | null) {
  const place = location ? ` in ${location}` : "";
  if (plan.kind === "case_map") {
    return `This may be a connection lead. The job is to find whether ${subject}${place} touches another person, agency, case number, document, timeline event, or witness statement already in the record.`;
  }
  if (plan.kind === "verify") {
    return `This may be a source-file lead. The job is to separate what can be proven from what is only claimed before it becomes public copy.`;
  }
  if (plan.kind === "article") {
    return `This may become a public explainer. The article should stay plain-English: what happened, why it matters, what evidence exists, and what is still missing.`;
  }
  if (plan.kind === "service") {
    return `This may need private follow-up before any public action. Keep the public version focused on process, records, and next steps.`;
  }
  return `This belongs in the watch file until one more concrete source, date, place, person, or document makes the lead usable.`;
}

function solutionAnswer(plan: IntakeRoutePlan, subject: string, location: string | null) {
  const place = location ? ` in ${location}` : "";
  if (plan.kind === "case_map") {
    return `Build a connection note for ${subject}${place}: identify the person, agency, case number, document, date, or witness statement it touches, then attach the source path.`;
  }
  if (plan.kind === "verify") {
    return `Create a verification checklist for ${subject}${place}: preserve the public links, request native files, and separate confirmed facts from claims before publishing.`;
  }
  if (plan.kind === "article") {
    return `Turn ${subject}${place} into a public-safe explainer only after the strongest source is attached. The first version should ask for one missing record, not overstate the claim.`;
  }
  if (plan.kind === "service") {
    return `Route ${subject}${place} into a private response path. Decide whether this needs case review, evidence triage, a strategy call, or a custom invoice.`;
  }
  return `Keep ${subject}${place} in the watch file until one more date, record, witness, source link, or document turns it into a usable lead.`;
}

function solutionAsks(plan: IntakeRoutePlan) {
  if (plan.kind === "case_map") {
    return [
      "Who or what does this connect to?",
      "What date, place, agency, case number, or document proves the connection?",
      "Can someone provide a public link or native file that confirms the link?",
    ];
  }
  if (plan.kind === "verify") {
    return [
      "What is the strongest source file?",
      "Is there a full screenshot, native export, bodycam, court record, video, or document?",
      "Who can confirm or correct the claim without exposing private information?",
    ];
  }
  if (plan.kind === "article") {
    return [
      "What happened in one plain-English sentence?",
      "What is the single best record to attach?",
      "What specific witness, document, or agency response should the public help find?",
    ];
  }
  if (plan.kind === "service") {
    return [
      "Does the person need a private reply, service quote, invoice, or case review?",
      "What outcome do they want: timeline, record request, evidence triage, dashboard, or strategy call?",
      "What can be discussed publicly, and what must stay private?",
    ];
  }
  return [
    "What date is missing?",
    "What person, agency, or document is missing?",
    "What source would make this usable?",
  ];
}

function destinationFor(plan: IntakeRoutePlan) {
  if (plan.kind === "case_map") {
    return "Case nexus, intake ledger connection note, timeline event, or profile/case node.";
  }
  if (plan.kind === "verify") {
    return "Evidence checklist, document queue, source request, case file update, or verification thread.";
  }
  if (plan.kind === "article") {
    return "Draft post, public witness call, records-request explainer, or source-backed update.";
  }
  if (plan.kind === "service") {
    return "Private message follow-up, case-review offer, strategy-call offer, custom invoice, or service dashboard.";
  }
  return "Watch file until another source, date, person, document, or witness appears.";
}

function safeDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return format(date, "MMM d, yyyy");
}

function cleanLine(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function humanize(value: string) {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
