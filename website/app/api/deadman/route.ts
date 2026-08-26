import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildInitialCustodyBulletin,
  deadmanKeysConfiguredFor,
  releaseNextDeadmanUpdate,
  verifyDeadmanCodeFor,
} from "@/lib/deadman";
import { dispatchNextDeadmanXPost } from "@/lib/deadman-social";
import { DEADMAN_CONFIRMATION_TYPES } from "@/lib/deadman-constants";
import { sendAdminAlert } from "@/lib/admin-email-alerts";
import { checkRateLimit } from "@/lib/rate-limit";
import { SITE } from "@/lib/site";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const activateSchema = z.object({
  action: z.literal("activate"),
  activator_id: z.string().min(2).max(40).regex(/^[a-z0-9_-]+$/i),
  code: z.string().min(16).max(200),
  confirmation_type: z.enum(DEADMAN_CONFIRMATION_TYPES),
  confirmation_summary: z.string().min(12).max(1200),
  source_url: z.union([z.string().url().max(1000), z.literal("")]).optional(),
  agency: z.string().max(160).optional(),
  facility: z.string().max(160).optional(),
  public_release_authorized: z.literal(true),
});

const reverseSchema = z.object({
  action: z.literal("reverse"),
  code: z.string().min(16).max(200),
  resolution_summary: z.string().min(10).max(1200),
});

const schema = z.discriminatedUnion("action", [activateSchema, reverseSchema]);

function sourceUrlRequired(type: z.infer<typeof activateSchema>["confirmation_type"]): boolean {
  return (
    type === "official_booking_record" ||
    type === "filed_court_order" ||
    type === "custodial_agency_confirmation"
  );
}

function incidentCode(now: Date): string {
  const day = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `ENC-${day}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function recordEvent(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  input: {
    incidentId?: string | null;
    eventType: string;
    actorId: string;
    fingerprint?: string | null;
    detail?: Record<string, unknown>;
  },
) {
  await supabase.from("deadman_event_log").insert({
    incident_id: input.incidentId ?? null,
    event_type: input.eventType,
    actor_id: input.actorId,
    request_fingerprint: input.fingerprint ?? null,
    detail: input.detail ?? {},
  });
}

async function reverseSwitch(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  input: z.infer<typeof reverseSchema>,
  fingerprint: string,
) {
  const verification = await verifyDeadmanCodeFor(supabase, "reverse", input.code);
  if (!verification.valid) {
    await recordEvent(supabase, {
      eventType: "invalid_reversal_code",
      actorId: "unknown",
      fingerprint,
    });
    return NextResponse.json({ error: "Invalid code." }, { status: 403 });
  }

  const { data: incident } = await supabase
    .from("deadman_incidents")
    .select("id, incident_code")
    .in("status", ["verifying", "active"])
    .order("reported_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!incident) {
    return NextResponse.json({
      ok: true,
      active: false,
      released: 0,
      message: "The emergency publishing switch is already off.",
    });
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("deadman_incidents")
    .update({
      status: "resolved",
      resolved_at: now,
      resolution_summary: input.resolution_summary,
      updated_at: now,
    })
    .eq("id", incident.id);
  if (error) throw error;

  await recordEvent(supabase, {
    incidentId: incident.id,
    eventType: "switch_reversed",
    actorId: verification.actor_id,
    fingerprint,
    detail: { resolution_summary: input.resolution_summary },
  });

  await sendAdminAlert({
    subject: `Deadman's Switch reversed · ${incident.incident_code}`,
    text: `The emergency publishing switch was turned off.\n\nIncident: ${incident.incident_code}\nResolution: ${input.resolution_summary}`,
    html: `<p>The emergency publishing switch was turned off.</p><p><strong>Incident:</strong> ${escapeHtml(incident.incident_code)}</p><p><strong>Resolution:</strong> ${escapeHtml(input.resolution_summary)}</p>`,
  });

  return NextResponse.json({
    ok: true,
    active: false,
    released: 0,
    incident_code: incident.incident_code,
    message: "Emergency publishing is off. Published records remain intact.",
  });
}

async function activateSwitch(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  input: z.infer<typeof activateSchema>,
  fingerprint: string,
) {
  if (sourceUrlRequired(input.confirmation_type) && !input.source_url) {
    return NextResponse.json(
      { error: "A public source URL is required for this confirmation type." },
      { status: 400 },
    );
  }

  const verification = await verifyDeadmanCodeFor(
    supabase,
    "activate",
    input.code,
    input.activator_id,
  );
  if (!verification.valid) {
    await recordEvent(supabase, {
      eventType: "invalid_activation_code",
      actorId: input.activator_id || "unknown",
      fingerprint,
    });
    return NextResponse.json({ error: "Invalid contact ID or code." }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("deadman_incidents")
    .select("id, incident_code, status")
    .in("status", ["verifying", "active"])
    .order("reported_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await recordEvent(supabase, {
      incidentId: existing.id,
      eventType: "duplicate_activation_ignored",
      actorId: verification.actor_id,
      fingerprint,
    });
    return NextResponse.json({
      ok: true,
      active: existing.status === "active",
      released: 0,
      incident_code: existing.incident_code,
      message: "An emergency incident is already open. This request was recorded without publishing a duplicate.",
    });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const code = incidentCode(now);
  const { data: incident, error: incidentError } = await supabase
    .from("deadman_incidents")
    .insert({
      incident_code: code,
      status: "verifying",
      activator_id: verification.actor_id,
      activator_label: verification.actor_label,
      confirmation_type: input.confirmation_type,
      confirmation_summary: input.confirmation_summary,
      source_url: input.source_url || null,
      agency: input.agency?.trim() || null,
      facility: input.facility?.trim() || null,
      public_release_authorized: false,
      reported_at: nowIso,
      metadata: {
        protocol_version: 2,
        cadence: "top_of_every_hour",
        editorial_mode: "defense_advocacy_with_source_labels",
      },
    })
    .select("id, incident_code")
    .single();
  if (incidentError || !incident) {
    if (incidentError?.code === "23505") {
      return NextResponse.json({
        ok: true,
        active: true,
        released: 0,
        message: "An emergency incident was activated by another trusted contact at the same time.",
      });
    }
    throw incidentError ?? new Error("Could not create the incident record.");
  }

  try {
    const bulletin = buildInitialCustodyBulletin({
      confirmedAt: nowIso,
      confirmationType: input.confirmation_type,
      agency: input.agency,
      facility: input.facility,
      publicSummary: input.confirmation_summary,
      sourceUrl: input.source_url,
    });
    const slug = `custody-response-${nowIso.slice(0, 10)}-${incident.incident_code
      .split("-")
      .at(-1)!
      .toLowerCase()}`;
    const publicUrl = `${SITE.url}/posts/${slug}`;
    const { error: activateError } = await supabase
      .from("deadman_incidents")
      .update({
        status: "active",
        public_release_authorized: true,
        activated_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", incident.id);
    if (activateError) throw activateError;

    const sources = input.source_url
      ? [{ url: input.source_url, type: input.confirmation_type }]
      : [
          {
            type: input.confirmation_type,
            note: "Direct authoritative confirmation preserved in the private incident record.",
          },
        ];
    const { data: updateId, error: stageError } = await supabase.rpc(
      "stage_deadman_update",
      {
        p_incident_id: incident.id,
        p_slug: slug,
        p_title: bulletin.title,
        p_body: bulletin.body,
        p_source_classification: input.confirmation_type,
        p_public_record_sources: sources,
        p_fact_basis: {
          confirmation_type: input.confirmation_type,
          confirmation_summary: input.confirmation_summary,
          confirmed_at: nowIso,
          agency: input.agency?.trim() || null,
          facility: input.facility?.trim() || null,
        },
        p_seo_description: bulletin.seoDescription,
        p_created_by: `trusted-contact:${verification.actor_id}`,
        p_x_post: `Verified custody response activated for Ryan Nichols. We are documenting public records, due process concerns, exculpatory evidence, and Harrison County's role hour by hour. Read and share: ${publicUrl}`,
        p_facebook_post: `A verified custody response has been activated for Ryan Nichols.\n\nWe are documenting the public record, due process concerns, exculpatory evidence, and Harrison County's role hour by hour. Read the source-labeled update, share it, and help preserve relevant public records. Do not harass anyone.\n\n${publicUrl}`,
      },
    );
    if (stageError || typeof updateId !== "string") {
      throw stageError ?? new Error("Could not stage the initial custody bulletin.");
    }

    await recordEvent(supabase, {
      incidentId: incident.id,
      eventType: "switch_activated",
      actorId: verification.actor_id,
      fingerprint,
      detail: {
        confirmation_type: input.confirmation_type,
        source_url: input.source_url || null,
        initial_update_id: updateId,
      },
    });

    const release = await releaseNextDeadmanUpdate(supabase, incident.id);
    const social = await dispatchNextDeadmanXPost(supabase).catch(() => null);
    await sendAdminAlert({
      subject: `Deadman's Switch activated · ${incident.incident_code}`,
      text: [
        "The verified-custody protocol was activated by a trusted contact.",
        `Incident: ${incident.incident_code}`,
        `Activator: ${verification.actor_label}`,
        `Confirmation: ${input.confirmation_type}`,
        `Initial bulletin: ${publicUrl}`,
        "Review the private incident record and preserve all original sources.",
      ].join("\n"),
      html: `<p><strong>The verified-custody protocol was activated by a trusted contact.</strong></p><p><strong>Incident:</strong> ${escapeHtml(incident.incident_code)}<br/><strong>Activator:</strong> ${escapeHtml(verification.actor_label)}<br/><strong>Confirmation:</strong> ${escapeHtml(input.confirmation_type)}</p><p><a href="${escapeHtml(publicUrl)}">Open the initial bulletin</a></p><p>Review the private incident record and preserve all original sources.</p>`,
    });

    return NextResponse.json({
      ok: true,
      active: true,
      released: release.released,
      blocked: release.blocked,
      incident_code: incident.incident_code,
      public_url: release.released_ids.includes(updateId) ? publicUrl : null,
      next_eligible_at: release.next_eligible_at,
      x_dispatch: social,
      message:
        "Verified-custody response activated. The initial source-labeled bulletin was published and hourly reporting is live.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Activation failed.";
    await supabase
      .from("deadman_incidents")
      .update({
        status: "activation_failed",
        public_release_authorized: false,
        resolution_summary: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", incident.id);
    await recordEvent(supabase, {
      incidentId: incident.id,
      eventType: "activation_failed",
      actorId: verification.actor_id,
      fingerprint,
      detail: { error: message },
    });
    throw error;
  }
}

export async function POST(request: Request) {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { error: "Deadman's Switch is not fully configured." },
      { status: 503 },
    );
  }

  const supabase = getSupabaseServiceClient();
  if (!(await deadmanKeysConfiguredFor(supabase))) {
    return NextResponse.json(
      { error: "Deadman's Switch is not fully configured." },
      { status: 503 },
    );
  }

  const rate = await checkRateLimit({
    request,
    bucket: "deadman-v2",
    windowMinutes: 15,
    maxRequests: 5,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Wait before trying again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
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

  try {
    if (parsed.data.action === "reverse") {
      return await reverseSwitch(supabase, parsed.data, rate.ipHash);
    }
    return await activateSwitch(supabase, parsed.data, rate.ipHash);
  } catch (error) {
    console.error(
      "deadman_v2_request_failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { error: "The emergency request could not be completed. No unverified public post was released." },
      { status: 500 },
    );
  }
}
