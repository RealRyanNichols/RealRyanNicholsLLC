// Source of truth for the legal-tech blueprint offer: the purchasable packages
// (prices resolved server-side, never trusted from the client) and the DIY
// intake questionnaire used to build a custom prompt stack.

export type BlueprintSlug = "diy_blueprint" | "guided_build" | "done_for_you";

export type BlueprintPackage = {
  slug: BlueprintSlug;
  name: string;
  /** Sticker price shown on the card. */
  priceUsd: number;
  /** What Stripe charges right now (Done-For-You collects a 50% deposit). */
  chargeUsd: number;
  priceNote: string;
  /** Short label for the pay button. */
  payLabel: string;
  /** DIY routes through the questionnaire before checkout. */
  needsIntake: boolean;
  recommended?: boolean;
};

export const BLUEPRINT_PACKAGES: BlueprintPackage[] = [
  {
    slug: "diy_blueprint",
    name: "DIY Blueprint + Prompt Stack",
    priceUsd: 2500,
    chargeUsd: 2500,
    priceNote: "one-time",
    payLabel: "Continue to secure checkout",
    needsIntake: true,
  },
  {
    slug: "guided_build",
    name: "Guided Build Sprint",
    priceUsd: 5000,
    chargeUsd: 5000,
    priceNote: "one-time",
    payLabel: "Buy the Guided Build, $5,000",
    needsIntake: false,
    recommended: true,
  },
  {
    slug: "done_for_you",
    name: "Done-For-You MVP",
    priceUsd: 9500,
    // 50% deposit now to start, balance before final handoff (matches the card).
    chargeUsd: 4750,
    priceNote: "starting price",
    payLabel: "Reserve your build, $4,750 deposit",
    needsIntake: false,
  },
];

export function blueprintPackage(slug: string): BlueprintPackage | null {
  return BLUEPRINT_PACKAGES.find((p) => p.slug === slug) ?? null;
}

export function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

// ---------------------------------------------------------------------------
// DIY intake questionnaire. Everything is optional; the more they fill in, the
// better the prompt stack. Data-driven so the form and the saved JSON stay in
// sync. `toggle` fields render as yes/no checkboxes.
// ---------------------------------------------------------------------------

export type IntakeFieldType = "text" | "email" | "tel" | "textarea" | "select" | "toggle";

export type IntakeField = {
  id: string;
  label: string;
  type: IntakeFieldType;
  placeholder?: string;
  options?: string[];
  help?: string;
};

export type IntakeSection = {
  id: string;
  title: string;
  intro?: string;
  /** Toggle-heavy sections render in a grid. */
  grid?: boolean;
  fields: IntakeField[];
};

// Fields whose ids map to real columns on blueprint_intake; everything else is
// stored in the `responses` jsonb blob by the API.
export const INTAKE_CONTACT_FIELDS = [
  "contact_name",
  "contact_email",
  "firm_name",
  "phone",
  "practice_area",
  "firm_size",
  "anything_else",
] as const;

export const INTAKE_SECTIONS: IntakeSection[] = [
  {
    id: "about",
    title: "About you and your practice",
    intro:
      "Only your email is needed so I can deliver your prompts. Everything else is optional.",
    fields: [
      { id: "contact_name", label: "Your name", type: "text", placeholder: "First and last" },
      { id: "contact_email", label: "Email (for delivery)", type: "email", placeholder: "you@firm.com" },
      { id: "firm_name", label: "Firm or business name", type: "text" },
      { id: "phone", label: "Phone (optional)", type: "tel" },
      { id: "practice_area", label: "Practice area(s)", type: "text", placeholder: "Family law, criminal, PI, estate, etc." },
      { id: "firm_size", label: "Firm size", type: "select", options: ["Solo", "2 to 5", "6 to 20", "20 plus"] },
      { id: "current_tools", label: "How do you organize cases today?", type: "textarea", placeholder: "Folders, email, paper, a case tool, all of the above..." },
      { id: "biggest_pain", label: "The single biggest thing you want this to fix", type: "textarea" },
    ],
  },
  {
    id: "public",
    title: "Public website",
    grid: true,
    fields: [
      { id: "need_public_site", label: "A public website", type: "toggle" },
      { id: "need_pages", label: "Specific pages (about, practice areas, contact, FAQ)", type: "toggle" },
      { id: "need_blog", label: "A blog", type: "toggle" },
      { id: "need_newsfeed", label: "A newsfeed / updates feed", type: "toggle" },
      { id: "need_seo", label: "SEO and search visibility", type: "toggle" },
      { id: "need_lead_capture", label: "Lead capture / contact forms", type: "toggle" },
      { id: "existing_domain", label: "Existing domain (write it in)", type: "text", placeholder: "yourfirm.com" },
    ],
  },
  {
    id: "clients",
    title: "Clients, intake, and members",
    grid: true,
    fields: [
      { id: "need_client_intake", label: "Client intake forms", type: "toggle" },
      { id: "need_client_login", label: "Client login", type: "toggle" },
      { id: "need_client_dashboard", label: "Client dashboard (status, docs)", type: "toggle" },
      { id: "need_client_upload", label: "Clients upload documents themselves", type: "toggle" },
      { id: "have_members", label: "Members or recurring clients", type: "toggle" },
      { id: "need_customer_accounts", label: "Customer accounts", type: "toggle" },
    ],
  },
  {
    id: "cases",
    title: "Case management",
    grid: true,
    fields: [
      { id: "need_case_dashboard", label: "Case / matter dashboard", type: "toggle" },
      { id: "need_parties_db", label: "Parties and contacts database", type: "toggle" },
      { id: "need_timeline", label: "Timeline builder", type: "toggle" },
      { id: "need_notes_tasks", label: "Notes and task tracking", type: "toggle" },
      { id: "need_court_dates", label: "Court date tracking", type: "toggle" },
      { id: "need_deadlines", label: "Deadline / statute-of-limitations alerts", type: "toggle" },
      { id: "need_calendar", label: "Calendar", type: "toggle" },
      { id: "need_status", label: "Case status tracking", type: "toggle" },
      { id: "need_conflict_checks", label: "Conflict checks", type: "toggle" },
    ],
  },
  {
    id: "documents",
    title: "Documents, evidence, and media",
    grid: true,
    fields: [
      { id: "need_doc_library", label: "Document library", type: "toggle" },
      { id: "need_evidence_upload", label: "Evidence upload and organization", type: "toggle" },
      { id: "need_exhibit_builder", label: "Exhibit builder (exhibit lists / binders)", type: "toggle" },
      { id: "need_file_storage", label: "Secure file storage", type: "toggle" },
      { id: "need_large_files", label: "Large files", type: "toggle" },
      { id: "need_video", label: "Video hosting and playback", type: "toggle" },
      { id: "need_audio", label: "Audio (calls, voicemails, recordings)", type: "toggle" },
      { id: "need_photos", label: "Photo organization", type: "toggle" },
    ],
  },
  {
    id: "workproduct",
    title: "Legal work product",
    intro: "The deeper legal-tech pieces. Check anything that would help.",
    grid: true,
    fields: [
      { id: "need_motion_builder", label: "Motion building / drafting templates", type: "toggle" },
      { id: "need_case_builder", label: "Case building / case theory organization", type: "toggle" },
      { id: "need_pleadings", label: "Pleadings and form automation", type: "toggle" },
      { id: "need_discovery", label: "Discovery tracking", type: "toggle" },
      { id: "need_depo_transcripts", label: "Deposition / transcript management", type: "toggle" },
      { id: "need_esign", label: "E-signatures", type: "toggle" },
      { id: "need_redaction", label: "Redaction workflow", type: "toggle" },
    ],
  },
  {
    id: "payments",
    title: "Payments and billing",
    grid: true,
    fields: [
      { id: "need_payments", label: "Take payments online (Stripe)", type: "toggle" },
      { id: "need_invoices", label: "Invoices", type: "toggle" },
      { id: "need_retainers", label: "Retainers", type: "toggle" },
      { id: "need_plans", label: "Subscriptions / payment plans", type: "toggle" },
      { id: "need_billing_portal", label: "Client billing portal", type: "toggle" },
      { id: "need_time_tracking", label: "Time tracking", type: "toggle" },
      { id: "need_trust_aware", label: "Trust / IOLTA accounting awareness", type: "toggle" },
    ],
  },
  {
    id: "comms",
    title: "Communication and operations",
    grid: true,
    fields: [
      { id: "need_email", label: "Email integration / automated email", type: "toggle" },
      { id: "need_scheduling", label: "Scheduling / appointment booking", type: "toggle" },
      { id: "need_sms", label: "SMS / text reminders", type: "toggle" },
      { id: "need_notifications", label: "In-app notifications", type: "toggle" },
      { id: "need_esign_requests", label: "Send signature requests", type: "toggle" },
    ],
  },
  {
    id: "ai",
    title: "AI and automation",
    intro:
      "Note: real client data should only be used after confidentiality, consent, and security are handled. We build the foundation first.",
    grid: true,
    fields: [
      { id: "want_ai_summaries", label: "AI-assisted case / document summaries", type: "toggle" },
      { id: "want_ai_intake", label: "AI intake triage", type: "toggle" },
      { id: "want_ai_drafting", label: "AI drafting help", type: "toggle" },
      { id: "want_ai_search", label: "AI search across your records", type: "toggle" },
    ],
  },
  {
    id: "admin",
    title: "Admin, team, and data",
    grid: true,
    fields: [
      { id: "need_admin_dashboard", label: "Private admin dashboard", type: "toggle" },
      { id: "need_roles", label: "Multiple users with roles / permissions", type: "toggle" },
      { id: "need_analytics", label: "Analytics and lead tracking", type: "toggle" },
      { id: "need_data_migration", label: "Migrate data from current tools", type: "toggle" },
      { id: "need_audit_logs", label: "Audit logs", type: "toggle" },
      { id: "need_2fa", label: "Two-factor / extra security", type: "toggle" },
      { id: "need_mobile", label: "Strong mobile experience", type: "toggle" },
      { id: "need_backups", label: "Backups", type: "toggle" },
    ],
  },
  {
    id: "scope",
    title: "Scope, support, and timeline",
    fields: [
      { id: "want_continuous_support", label: "I want continuous support after the build", type: "toggle" },
      { id: "want_training", label: "I want training on how it works", type: "toggle" },
      { id: "timeline", label: "Timeline", type: "select", options: ["As soon as possible", "1 to 3 months", "Flexible"] },
      { id: "budget", label: "Budget beyond this package", type: "select", options: ["Just this package", "Up to $5k more", "Up to $15k more", "Open, depends on value"] },
    ],
  },
  {
    id: "anything",
    title: "Anything we missed",
    fields: [
      { id: "anything_else", label: "What do you need that we did not cover? Anything unique to your practice?", type: "textarea" },
      { id: "inspiration", label: "Any sites, apps, or tools you want it to feel like?", type: "textarea" },
    ],
  },
];
