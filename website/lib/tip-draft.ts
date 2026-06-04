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

export function buildTipDraft(source: TipDraftSource, plan: IntakeRoutePlan): TipDraft {
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
