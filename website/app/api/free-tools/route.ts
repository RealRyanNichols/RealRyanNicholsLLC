import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";

const toolSlug = z.enum([
  "records-request",
  "timeline-builder",
  "next-three-moves",
  "case-builder",
  "know-your-rights",
  "pro-se-motion",
]);
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
  "case-builder": "Case builder",
  "know-your-rights": "Know your rights card",
  "pro-se-motion": "Pro se motion starter",
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

function buildCaseFile(input: Record<string, unknown>): ToolResult {
  const summary = asText(input.summary, 1500) || "[what this case is about]";
  const parties = asText(input.parties, 900) || "[who is involved / who is on the other side]";
  const events = asText(input.events, 2400);
  const evidence = asText(input.evidence, 1400) || "[proof you have right now]";
  const missing = asText(input.missing, 1200) || "[records or proof you still need]";
  const goal = asText(input.goal, 500) || "[the outcome you want]";
  const timeline = events
    ? events
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => `${index + 1}. ${line}`)
    : ["[Add one dated event per line — e.g. 2025-07-13 — what happened]"];

  const caseFile = [
    `CASE SUMMARY: ${summary}`,
    "",
    `PARTIES: ${parties}`,
    "",
    "TIMELINE:",
    ...timeline,
    "",
    `EVIDENCE ON HAND: ${evidence}`,
    `MISSING / TO OBTAIN: ${missing}`,
    `GOAL: ${goal}`,
  ];

  return {
    title: "Your case file",
    summary:
      "One organized file — parties, timeline, evidence, gaps, and next moves — the way a lawyer wants to receive it.",
    sections: [
      { label: "Case file", body: caseFile },
      {
        label: "Close the gaps",
        body: [
          "For each timeline entry, attach the proof beside it: screenshot, filing, video, message, or receipt.",
          "Turn every 'missing' item into a written request to the agency, court, company, or witness.",
          "Keep what you personally saw separate from what someone else told you.",
          "Update this file every time something new happens, and keep the dates exact.",
        ],
      },
    ],
    copyText: caseFile.join("\n"),
    nextPath: { label: "Send Ryan your case file", href: "/submit" },
  };
}

function buildKnowYourRights(input: Record<string, unknown>): ToolResult {
  const scenario = asText(input.scenario, 80) || "police stop";
  const state = asText(input.state, 80) || "your state";
  const cards: Record<string, { rights: string[]; say: string[] }> = {
    "police stop": {
      rights: [
        "You have the right to remain silent beyond identifying yourself where the law requires it.",
        "You can ask whether you are free to leave.",
        "You do not have to consent to a search of yourself or your vehicle.",
      ],
      say: [
        "Officer, am I free to go?",
        "Am I being detained, and if so, for what?",
        "I am going to remain silent.",
        "I do not consent to any searches.",
      ],
    },
    "recording police": {
      rights: [
        "In public, you have a First Amendment right to record police performing their duties.",
        "Police cannot delete your footage or take your phone without a warrant.",
        "You may be asked to step back; keep a reasonable distance and do not physically interfere.",
      ],
      say: [
        "I am exercising my First Amendment right to record.",
        "I do not consent to you searching or taking my phone.",
        "Am I being detained, or am I free to go?",
      ],
    },
    "questioned in custody": {
      rights: [
        "If you are in custody and being interrogated, police must read your Miranda rights first.",
        "You have the right to remain silent.",
        "You have the right to a lawyer, including having one present during any questioning.",
        "Anything you say can be used against you — silence cannot.",
      ],
      say: [
        "I am invoking my right to remain silent.",
        "I want a lawyer. I will not answer questions without my attorney present.",
        "Am I free to leave?",
      ],
    },
    "asked to search": {
      rights: [
        "You can refuse consent to a search of your person, car, home, or phone.",
        "Refusing consent is not an admission of guilt and cannot be held against you.",
        "Without consent, police generally need a warrant or a recognized exception.",
      ],
      say: [
        "I do not consent to a search.",
        "Do you have a warrant?",
        "I am not resisting, but I do not consent.",
      ],
    },
    arrest: {
      rights: [
        "You have the right to remain silent and the right to a lawyer.",
        "Do not physically resist, even if you believe the arrest is unlawful — challenge it later, in court.",
        "Do not answer questions or sign anything without a lawyer.",
      ],
      say: [
        "I am invoking my right to remain silent.",
        "I want a lawyer.",
        "I do not consent to any search.",
      ],
    },
  };
  const card = cards[scenario] ?? cards["police stop"];

  return {
    title: `Know your rights: ${scenario}`,
    summary:
      "Plain-English rights and the exact words to say. Stay calm, stay quiet, ask for a lawyer.",
    sections: [
      { label: "Your rights", body: card.rights },
      { label: "What to say", body: card.say.map((line) => `"${line}"`) },
      {
        label: "Remember",
        body: [
          `Specifics vary by state (${state}). This is general information, not legal advice.`,
          "Do not lie, do not resist, do not consent to searches, and do not answer questions without a lawyer.",
          "Get the officer's name and badge number, and write down exactly what happened as soon as you safely can.",
        ],
      },
    ],
    copyText: [
      `KNOW YOUR RIGHTS — ${scenario.toUpperCase()}`,
      "",
      "YOUR RIGHTS:",
      ...card.rights.map((line) => `- ${line}`),
      "",
      "WHAT TO SAY:",
      ...card.say.map((line) => `- "${line}"`),
    ].join("\n"),
    nextPath: { label: "Report what happened to you", href: "/submit" },
  };
}

function buildProSeMotion(input: Record<string, unknown>): ToolResult {
  const type = asText(input.motion_type, 120) || "Motion";
  const court = asText(input.court, 220) || "[Court — County — Cause No.]";
  const party = asText(input.party, 160) || "[Your name], Respondent, Pro Se";
  const relief = asText(input.relief, 900) || "[state exactly what you want the court to do]";
  const facts = asText(input.facts, 1800) || "[the facts that support this motion]";
  const shortName = party.split(",")[0]?.trim() || "Movant";

  const motion = [
    court,
    "",
    type.toUpperCase(),
    "",
    "TO THE HONORABLE JUDGE OF SAID COURT:",
    "",
    `${party} files this ${type} and respectfully shows the Court the following:`,
    "",
    "I. FACTS",
    facts,
    "",
    "II. RELIEF REQUESTED",
    relief,
    "",
    `WHEREFORE, ${shortName} respectfully requests that the Court grant this ${type} and award any further relief to which ${shortName} is entitled.`,
    "",
    "Respectfully submitted,",
    "",
    "_______________________________",
    party,
    "",
    "CERTIFICATE OF SERVICE",
    "I certify that a true and correct copy of this document was served on all parties of record on ____________ by ____________.",
  ];

  return {
    title: `${type} — starter draft`,
    summary:
      "A clean skeleton you can adapt and file. Fill the brackets, match your court's caption, and serve every party.",
    sections: [
      { label: "Draft motion", body: motion },
      {
        label: "Before you file",
        body: [
          "Copy the exact caption — court, county, cause number, and party names — from an existing filing in your case.",
          "If your court requires it, file the proposed order as its own separate document.",
          "Pair the motion with a Notice of Hearing if it needs a setting.",
          "Serve every party and complete the certificate of service with the real date and method.",
          "This is a starting template, not legal advice — verify your local rules and deadlines.",
        ],
      },
    ],
    copyText: motion.join("\n"),
    nextPath: { label: "Have Ryan review it", href: "/case-review" },
  };
}

function buildResult(tool: ToolSlug, input: Record<string, unknown>): ToolResult {
  if (tool === "records-request") return buildRecordsRequest(input);
  if (tool === "timeline-builder") return buildTimeline(input);
  if (tool === "next-three-moves") return buildNextMoves(input);
  if (tool === "case-builder") return buildCaseFile(input);
  if (tool === "know-your-rights") return buildKnowYourRights(input);
  return buildProSeMotion(input);
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
