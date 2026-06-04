import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";

const toolSlug = z.enum(["records-request", "timeline-builder", "next-three-moves"]);
type ToolSlug = z.infer<typeof toolSlug>;

const schema = z.object({
  tool_slug: toolSlug,
  display_name: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  phone: z.string().max(60).optional().or(z.literal("")),
  community: z.string().max(180).optional().or(z.literal("")),
  location: z.string().max(180).optional().or(z.literal("")),
  subject: z.string().max(220).optional().or(z.literal("")),
  privacy_level: z.enum(["private", "public_summary"]).default("private"),
  input: z.record(z.unknown()).default({}),
});

type ToolResult = {
  title: string;
  summary: string;
  sections: { label: string; body: string[] }[];
  copyText: string;
  nextPath: { label: string; href: string };
};

const labels: Record<ToolSlug, string> = {
  "records-request": "Records request builder",
  "timeline-builder": "Timeline starter",
  "next-three-moves": "Next 3 moves",
};

function asText(value: unknown, max = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function publicRef(id: string): string {
  return `TOOL-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function tagify(...values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .flatMap((value) => (value ?? "").split(/[^a-z0-9]+/i))
        .map((value) => value.toLowerCase().trim())
        .filter((value) => value.length >= 3)
        .slice(0, 20),
    ),
  );
}

function buildRecordsRequest(input: Record<string, unknown>): ToolResult {
  const agency = asText(input.agency, 160) || "[agency / office]";
  const jurisdiction = asText(input.jurisdiction, 120) || "your state";
  const records = asText(input.records, 1200) || "[specific records requested]";
  const dateRange = asText(input.date_range, 160) || "[date range]";
  const people = asText(input.people, 300);
  const delivery = asText(input.delivery, 160) || "email delivery if available";
  const law =
    /texas/i.test(jurisdiction)
      ? "Texas Public Information Act, Texas Government Code Chapter 552"
      : "the applicable public records law";
  const request = [
    `To the records custodian for ${agency},`,
    "",
    `I am requesting records under ${law}.`,
    "",
    `Records requested: ${records}`,
    `Date range: ${dateRange}`,
    people ? `People, departments, or case numbers involved: ${people}` : null,
    `Preferred delivery: ${delivery}`,
    "",
    "If any portion is withheld, please identify the specific legal basis for withholding it and release any segregable non-exempt portions. If clarification would narrow the request, please contact me before denying or delaying production.",
    "",
    "Thank you.",
  ].filter((line): line is string => line !== null);

  return {
    title: "Public records request draft",
    summary:
      "A cleaner request is easier for an agency to process and harder to ignore.",
    sections: [
      { label: "Draft request", body: request },
      {
        label: "Before sending",
        body: [
          "Add your name, email, and mailing address only if you are comfortable using them.",
          "Attach a screenshot or note showing the date you sent it.",
          "Calendar the statutory deadline and every follow-up.",
        ],
      },
    ],
    copyText: request.join("\n"),
    nextPath: { label: "Send Ryan the response", href: "/submit" },
  };
}

function buildTimeline(input: Record<string, unknown>): ToolResult {
  const date = asText(input.event_date, 80) || "[date / approximate date]";
  const place = asText(input.place, 160) || "[location]";
  const people = asText(input.people, 400) || "[people or agencies involved]";
  const happened = asText(input.happened, 1400) || "[what happened]";
  const proof = asText(input.proof, 800) || "[proof you have]";
  const missing = asText(input.missing, 800) || "[records still missing]";
  const entry = [
    `Date: ${date}`,
    `Place: ${place}`,
    `People/agencies: ${people}`,
    `What happened: ${happened}`,
    `Proof on hand: ${proof}`,
    `Missing record: ${missing}`,
  ];

  return {
    title: "Timeline starter card",
    summary:
      "A timeline turns a story into a record people can check, challenge, and connect.",
    sections: [
      { label: "Timeline entry", body: entry },
      {
        label: "Turn it into evidence",
        body: [
          "Put the screenshot, filing, video, message, or receipt beside this entry.",
          "Separate what you personally saw from what someone else told you.",
          "Create one entry per date. Do not bury five events in one paragraph.",
        ],
      },
    ],
    copyText: entry.join("\n"),
    nextPath: { label: "Add this to your story", href: "/tell-your-story" },
  };
}

function buildNextMoves(input: Record<string, unknown>): ToolResult {
  const issue = asText(input.issue_type, 160) || "records / evidence problem";
  const deadline = asText(input.deadline, 160) || "no clear deadline";
  const proof = asText(input.proof, 800) || "the first documents or screenshots";
  const goal = asText(input.goal, 600) || "get the facts organized";
  const moves = [
    `1. Preserve: Save ${proof}. Put it in one folder and record today's date.`,
    `2. Timeline: Write the first five dated facts about the ${issue}. Keep claims separate from proof.`,
    `3. Request: Identify the missing record and ask the agency, court, company, or witness for it in writing.`,
  ];
  const warnings = [
    deadline === "no clear deadline"
      ? "Find out whether any appeal, hearing, filing, preservation, or records deadline exists."
      : `Deadline on your radar: ${deadline}. Do not wait until the last day to organize proof.`,
    `Goal: ${goal}`,
    "This is organization support, not legal advice or a promised outcome.",
  ];

  return {
    title: "Your next 3 moves",
    summary:
      "When people are overwhelmed, the win is one folder, one timeline, and one written request.",
    sections: [
      { label: "Do this first", body: moves },
      { label: "Watch points", body: warnings },
    ],
    copyText: [...moves, "", ...warnings].join("\n"),
    nextPath: { label: "Ask the help desk", href: "/case-review" },
  };
}

function buildResult(tool: ToolSlug, input: Record<string, unknown>): ToolResult {
  if (tool === "records-request") return buildRecordsRequest(input);
  if (tool === "timeline-builder") return buildTimeline(input);
  return buildNextMoves(input);
}

export async function POST(request: Request) {
  const rl = await checkRateLimit({
    request,
    bucket: "free_tools",
    windowMinutes: 60,
    maxRequests: 12,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: rl.error },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const id = randomUUID();
  const ref = publicRef(id);
  const data = parsed.data;
  const result = buildResult(data.tool_slug, data.input);
  const clueTags = tagify(
    data.tool_slug,
    data.community,
    data.location,
    data.subject,
    asText(data.input.issue_type, 100),
    asText(data.input.agency, 100),
  );

  let saved = false;
  if (isSupabaseServiceConfigured()) {
    try {
      const supabase = getSupabaseServiceClient();
      const { error } = await supabase.from("free_tool_runs").insert({
        id,
        tool_slug: data.tool_slug,
        public_ref: ref,
        display_name: data.display_name?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        community: data.community?.trim() || null,
        location: data.location?.trim() || null,
        subject: data.subject?.trim() || null,
        privacy_level: data.privacy_level,
        input_json: data.input,
        result_json: result,
        clue_tags: clueTags,
        ip_hash: rl.ipHash,
      });
      saved = !error;
      if (!error && data.privacy_level === "public_summary") {
        await supabase.from("intake_items").insert({
          source_type: "tool",
          source_id: id,
          public_ref: ref,
          category: data.tool_slug,
          subject: data.subject?.trim() || labels[data.tool_slug],
          location: data.location?.trim() || null,
          public_summary: `A visitor used the ${labels[data.tool_slug]} for ${data.community?.trim() || data.location?.trim() || "a public issue"}. Private details stay with Ryan, but the public signal can be verified, disputed, or connected to other records.`,
          source_status: "new",
          public_status: "received",
          clue_tags: clueTags,
          visibility: "public",
        });
      }
      if (error) console.warn("free_tool_run_save_failed", error.message);
    } catch (error) {
      console.warn("free_tool_run_save_failed", error);
    }
  }

  return NextResponse.json({
    ok: true,
    saved,
    public_ref: ref,
    result,
  });
}
