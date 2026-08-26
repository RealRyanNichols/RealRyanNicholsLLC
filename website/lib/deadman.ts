import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEADMAN_CONFIRMATION_LABELS,
  DEADMAN_QUEUE_CATEGORY,
  DEADMAN_RELEASE_BATCH_SIZE,
  DEADMAN_RELEASE_INTERVAL_MINUTES,
  DEADMAN_STATE_SLUG,
  type DeadmanConfirmationType,
} from "@/lib/deadman-constants";

export {
  DEADMAN_CONFIRMATION_LABELS,
  DEADMAN_QUEUE_CATEGORY,
  DEADMAN_RELEASE_INTERVAL_MINUTES,
  DEADMAN_STATE_SLUG,
};
export type { DeadmanConfirmationType };
export const DEADMAN_BATCH_SIZE = DEADMAN_RELEASE_BATCH_SIZE;

const SYSTEM_AUTHOR_ID =
  process.env.POSTS_AUTHOR_ID || "6792cdcd-2465-4a3a-9c49-4e270eaf79fa";

type AnySupabase = SupabaseClient;

export type DeadmanState = {
  active: boolean;
  incident_id: string | null;
  incident_code: string | null;
  activated_by: string | null;
  confirmation_type: DeadmanConfirmationType | null;
  activated_at: string | null;
  reversed_at: string | null;
  last_release_at: string | null;
  total_released: number;
  message: string;
};

export type DeadmanActivator = {
  id: string;
  label: string;
  hash: string;
  active: boolean;
};

export type DeadmanReleaseResult = {
  scanned: number;
  released: number;
  blocked: number;
  released_ids: string[];
  released_post_ids: string[];
  reason: string;
  next_eligible_at: string | null;
};

export function defaultDeadmanState(): DeadmanState {
  return {
    active: false,
    incident_id: null,
    incident_code: null,
    activated_by: null,
    confirmation_type: null,
    activated_at: null,
    reversed_at: null,
    last_release_at: null,
    total_released: 0,
    message:
      "Emergency publishing is off. When active, the custody-response worker publishes one source-labeled status update at the top of each hour. Private tips, messages, contact details, and sealed material are never released.",
  };
}

export function parseDeadmanState(raw: string | null | undefined): DeadmanState {
  if (!raw) return defaultDeadmanState();
  try {
    const parsed = JSON.parse(raw) as Partial<DeadmanState>;
    return {
      ...defaultDeadmanState(),
      ...parsed,
      active: parsed.active === true,
      total_released:
        typeof parsed.total_released === "number" && Number.isFinite(parsed.total_released)
          ? parsed.total_released
          : 0,
    };
  } catch {
    return defaultDeadmanState();
  }
}

export async function getDeadmanState(supabase: AnySupabase): Promise<DeadmanState> {
  const { data: incident, error: incidentError } = await supabase
    .from("deadman_incidents")
    .select(
      "id, incident_code, status, activator_id, confirmation_type, activated_at, resolved_at, last_release_at, total_released",
    )
    .order("reported_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!incidentError && incident) {
    return {
      ...defaultDeadmanState(),
      active: incident.status === "active",
      incident_id: incident.id,
      incident_code: incident.incident_code,
      activated_by: incident.activator_id,
      confirmation_type: incident.confirmation_type as DeadmanConfirmationType,
      activated_at: incident.activated_at,
      reversed_at: incident.resolved_at,
      last_release_at: incident.last_release_at,
      total_released: incident.total_released ?? 0,
    };
  }

  // Backward-compatible fallback for deployments where the v2 migration has
  // not landed yet. New activations always use deadman_incidents.
  const { data } = await supabase
    .from("posts")
    .select("body")
    .eq("slug", DEADMAN_STATE_SLUG)
    .maybeSingle();
  return parseDeadmanState(data?.body);
}

export async function saveDeadmanState(
  supabase: AnySupabase,
  state: DeadmanState,
): Promise<void> {
  const body = JSON.stringify(state);
  const now = new Date().toISOString();
  const { data: existing, error: selectError } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", DEADMAN_STATE_SLUG)
    .maybeSingle();
  if (selectError) throw selectError;

  if (existing?.id) {
    const { error } = await supabase
      .from("posts")
      .update({
        body,
        status: "hidden",
        title: "Deadman switch state",
        category: "system",
        updated_at: now,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("posts").insert({
    slug: DEADMAN_STATE_SLUG,
    type: "note",
    status: "hidden",
    title: "Deadman switch state",
    body,
    category: "system",
    author_id: SYSTEM_AUTHOR_ID,
    published_at: null,
    pinned: false,
  });
  if (error) throw error;
}

export function deadmanKeysConfigured(): boolean {
  const activators = getDeadmanActivators();
  return !!(
    process.env.DEADMAN_SECRET_SALT &&
    activators.length > 0 &&
    process.env.DEADMAN_REVERSAL_HASH
  );
}

export function parseDeadmanActivators(
  raw: string | null | undefined,
  legacyHash?: string | null,
): DeadmanActivator[] {
  const parsed: DeadmanActivator[] = [];
  if (raw) {
    try {
      const values = JSON.parse(raw) as unknown;
      if (Array.isArray(values)) {
        for (const value of values) {
          if (!value || typeof value !== "object") continue;
          const item = value as Record<string, unknown>;
          const id = typeof item.id === "string" ? item.id.trim() : "";
          const label = typeof item.label === "string" ? item.label.trim() : "";
          const hash = typeof item.hash === "string" ? item.hash.trim().toLowerCase() : "";
          const active = item.active !== false;
          if (
            /^[a-z0-9][a-z0-9_-]{1,39}$/i.test(id) &&
            label.length >= 2 &&
            label.length <= 100 &&
            /^[a-f0-9]{64}$/.test(hash)
          ) {
            parsed.push({ id, label, hash, active });
          }
        }
      }
    } catch {
      // A malformed env value fails closed. The legacy entry below may still
      // keep an existing installation reachable during migration.
    }
  }
  if (legacyHash && /^[a-f0-9]{64}$/i.test(legacyHash)) {
    parsed.push({
      id: "legacy",
      label: "Legacy trusted contact",
      hash: legacyHash.toLowerCase(),
      active: true,
    });
  }
  return parsed.filter(
    (item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index,
  );
}

export function getDeadmanActivators(): DeadmanActivator[] {
  return parseDeadmanActivators(
    process.env.DEADMAN_ACTIVATORS_JSON,
    process.env.DEADMAN_ACTIVATION_HASH,
  );
}

type DeadmanAuthConfig = {
  secretSalt: string;
  activators: DeadmanActivator[];
  reversalHash: string;
};

async function getDeadmanAuthConfig(
  supabase: AnySupabase,
): Promise<DeadmanAuthConfig | null> {
  const { data, error } = await supabase
    .from("deadman_auth_config")
    .select("secret_salt, activators, reversal_hash")
    .eq("id", "primary")
    .maybeSingle();
  if (!error && data) {
    const activators = parseDeadmanActivators(JSON.stringify(data.activators));
    const secretSalt =
      typeof data.secret_salt === "string" ? data.secret_salt.trim() : "";
    const reversalHash =
      typeof data.reversal_hash === "string"
        ? data.reversal_hash.trim().toLowerCase()
        : "";
    if (
      secretSalt.length >= 16 &&
      activators.length > 0 &&
      /^[a-f0-9]{64}$/.test(reversalHash)
    ) {
      return { secretSalt, activators, reversalHash };
    }
  }

  const envActivators = getDeadmanActivators();
  const envSalt = process.env.DEADMAN_SECRET_SALT?.trim();
  const envReversalHash = process.env.DEADMAN_REVERSAL_HASH?.trim().toLowerCase();
  if (
    envSalt &&
    envSalt.length >= 16 &&
    envActivators.length > 0 &&
    envReversalHash &&
    /^[a-f0-9]{64}$/.test(envReversalHash)
  ) {
    return {
      secretSalt: envSalt,
      activators: envActivators,
      reversalHash: envReversalHash,
    };
  }
  return null;
}

export async function deadmanKeysConfiguredFor(
  supabase: AnySupabase,
): Promise<boolean> {
  return (await getDeadmanAuthConfig(supabase)) !== null;
}

export async function verifyDeadmanCodeFor(
  supabase: AnySupabase,
  action: "activate" | "reverse",
  code: string,
  activatorId?: string,
): Promise<DeadmanCodeVerification> {
  if (code.length < 16) return { valid: false };
  const config = await getDeadmanAuthConfig(supabase);
  if (!config) return { valid: false };

  let expected: string;
  let actorId: string;
  let actorLabel: string;
  if (action === "reverse") {
    expected = config.reversalHash;
    actorId = "owner-reversal";
    actorLabel = "Owner reversal code";
  } else {
    const activator = config.activators.find(
      (item) => item.active && item.id === activatorId,
    );
    if (!activator) return { valid: false };
    expected = activator.hash;
    actorId = activator.id;
    actorLabel = activator.label;
  }

  const actual = crypto
    .createHash("sha256")
    .update(`${config.secretSalt}:${code}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(actual, "hex");
  if (expectedBuffer.length !== actualBuffer.length) return { valid: false };
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
    ? { valid: true, actor_id: actorId, actor_label: actorLabel }
    : { valid: false };
}

export function hashDeadmanCode(code: string): string {
  const salt = process.env.DEADMAN_SECRET_SALT;
  if (!salt) throw new Error("DEADMAN_SECRET_SALT is not configured.");
  return crypto.createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

export type DeadmanCodeVerification =
  | { valid: true; actor_id: string; actor_label: string }
  | { valid: false };

export function verifyDeadmanCode(
  action: "activate" | "reverse",
  code: string,
  activatorId?: string,
): DeadmanCodeVerification {
  if (!deadmanKeysConfigured() || code.length < 16) return { valid: false };
  let expected: string | undefined;
  let actorId: string;
  let actorLabel: string;

  if (action === "reverse") {
    expected = process.env.DEADMAN_REVERSAL_HASH;
    actorId = "owner-reversal";
    actorLabel = "Owner reversal code";
  } else {
    const activator = getDeadmanActivators().find(
      (item) => item.active && item.id === activatorId,
    );
    if (!activator) return { valid: false };
    expected = activator.hash;
    actorId = activator.id;
    actorLabel = activator.label;
  }
  if (!expected || !/^[a-f0-9]{64}$/i.test(expected)) return { valid: false };

  const actual = hashDeadmanCode(code);
  const expectedBuffer = Buffer.from(expected.toLowerCase(), "hex");
  const actualBuffer = Buffer.from(actual, "hex");
  if (expectedBuffer.length !== actualBuffer.length) return { valid: false };
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
    ? { valid: true, actor_id: actorId, actor_label: actorLabel }
    : { valid: false };
}

export function deadmanReleaseDue(
  lastReleaseAt: string | null,
  now = new Date(),
): boolean {
  if (!lastReleaseAt) return true;
  const last = new Date(lastReleaseAt).getTime();
  if (!Number.isFinite(last)) return true;
  return new Date(last).toISOString().slice(0, 13) !== now.toISOString().slice(0, 13);
}

export async function releaseNextDeadmanUpdate(
  supabase: AnySupabase,
  incidentId: string,
): Promise<DeadmanReleaseResult> {
  const reconcile = async () => {
    const { data, error } = await supabase.rpc(
      "reconcile_deadman_evidence_network_queue",
      { p_incident_id: incidentId },
    );
    if (error) throw error;
    return Number(data ?? 0);
  };

  const isEvidenceGateError = (error: {
    code?: string | null;
    hint?: string | null;
    message?: string | null;
  } | null): boolean =>
    !!error &&
    ((error.code === "P0001" && error.hint === "deadman_evidence_network_gate") ||
      error.message?.includes("Evidence-network publication gate rejected") === true);

  type ReleaseRow = {
    released_update_id?: string | null;
    released_post_id?: string | null;
    ready_count?: number | string | null;
    reason?: string | null;
    next_eligible_at?: string | null;
  };
  let blocked = 0;
  let data: ReleaseRow | ReleaseRow[] | null = null;
  let error: {
    code?: string | null;
    hint?: string | null;
    message?: string | null;
  } | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    blocked += await reconcile();
    ({ data, error } = await supabase.rpc("release_next_deadman_update", {
      p_incident_id: incidentId,
    }));
    if (!isEvidenceGateError(error)) break;
  }
  if (error) throw error;
  const result = Array.isArray(data) ? data[0] : data;
  const releasedUpdateId = result?.released_update_id as string | null | undefined;
  const releasedPostId = result?.released_post_id as string | null | undefined;
  return {
    scanned: Number(result?.ready_count ?? 0),
    released: releasedUpdateId ? 1 : 0,
    blocked,
    released_ids: releasedUpdateId ? [releasedUpdateId] : [],
    released_post_ids: releasedPostId ? [releasedPostId] : [],
    reason: String(result?.reason ?? "unknown"),
    next_eligible_at:
      typeof result?.next_eligible_at === "string" ? result.next_eligible_at : null,
  };
}

function safePublicText(value: string | null | undefined, max: number): string {
  return (value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[\\`*_\[\]()<>{}|]/g, "\\$&")
    .trim()
    .slice(0, max);
}

function markdownLink(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return `[Open the cited confirmation source](${parsed.toString()})`;
  } catch {
    return null;
  }
}

export function buildInitialCustodyBulletin(input: {
  confirmedAt: string;
  confirmationType: DeadmanConfirmationType;
  agency?: string | null;
  facility?: string | null;
  publicSummary: string;
  sourceUrl?: string | null;
}): { title: string; body: string; seoDescription: string } {
  const agency = safePublicText(input.agency, 160);
  const facility = safePublicText(input.facility, 160);
  const source = markdownLink(input.sourceUrl);
  const label = DEADMAN_CONFIRMATION_LABELS[input.confirmationType];
  const reportedWhere = [agency, facility].filter(Boolean).join(" · ");
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(input.confirmedAt));

  const title =
    "Ryan Nichols custody update: verified status and Harrison County accountability";
  const seoDescription =
    "Verified Ryan Nichols custody status, Harrison County accountability questions, due process concerns, exculpatory evidence, and an hourly public timeline.";
  const lines = [
    "This is the first public bulletin in the custody-response record for **Ryan Nichols**. Every public decision in this matter will be documented, sourced, timestamped, and corrected when the record requires it.",
    "",
    "## Verified facts",
    "",
    `At **${time} Central Time**, an authorized emergency contact activated this protocol after checking a **${label}**.`,
    reportedWhere ? `The reported agency or facility is **${reportedWhere}**.` : "The agency and facility have not yet been confirmed for publication.",
    "",
    source ?? "A public source link was not available at activation. The source record is being preserved privately for verification.",
    "",
    "The activating contact's full report is preserved in the private incident log. It is not copied into this article because a trusted contact's free-form description is not, by itself, proof of every detail it may contain.",
    "",
    "## Official account and allegations",
    "",
    "No complete public official explanation for the detention has yet been verified for this bulletin. Any alleged violation, charge, or government account will be attributed to the office or record that states it; an allegation will not be rewritten as an established fact.",
    "",
    "## Evidence, contradictions, and unanswered questions",
    "",
    "The exact legal basis, operative order, alleged violation, booking information, counsel's response, and next hearing must be confirmed from original sources. The reporting will compare the government's stated basis against controlling orders, release conditions, docket entries, recordings, exculpatory evidence, favorable context, and contrary evidence. A social-media post is not a substitute for a court or custody record.",
    "",
    "## Accountability notice",
    "",
    "Harrison County must answer a direct set of public questions: which office or official requested, authorized, approved, enforced, or failed to prevent this detention; what authority was cited; what evidence was reviewed; and what notice and opportunity to respond Ryan received. Public officials are on notice that their documented actions, omissions, and explanations will be quoted, compared with the governing record, and preserved. Individuals will be named only when a reliable source establishes their public role and relevant conduct.",
    "",
    "## Advocacy position",
    "",
    "Before this meeting, Ryan described any unjustified detention as lawfare, political persecution, and unfair treatment. That is **Ryan's stated position and this site's advocacy**, not a judicial finding. This site calls for Ryan's immediate release unless the government can produce a lawful, transparent, and documented basis for holding him. If public officials enabled an unjustified detention, this site demands public answers and lawful accountability.",
    "",
    "{{poll: What verified material can you help locate? | Court or docket record | Booking information | Original eyewitness material | I can share this update}}",
    "",
    "## How to help lawfully",
    "",
    "Share this page with local and national journalists, civil-liberties groups, veteran communities, and elected representatives. Preserve original public records and submit source material through the site's evidence form. Ask specific, factual questions. Do not threaten, harass, dox, contact children, target witnesses, or publish private addresses or sealed information.",
    "",
    "{{report: Ryan Nichols custody response}}",
    "",
    "{{poll: Will you stick to verified information as this develops? | Yes | I will check sources | I can submit records}}",
    "",
    "{{share}}",
  ];
  return { title, body: lines.join("\n"), seoDescription };
}
