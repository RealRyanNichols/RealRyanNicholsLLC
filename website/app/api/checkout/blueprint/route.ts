import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStripe } from "@/lib/stripe";
import { SITE } from "@/lib/site";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import {
  BLUEPRINT_PACKAGES,
  blueprintPackage,
  type BlueprintSlug,
} from "@/lib/blueprint";

export const runtime = "nodejs";

const SLUGS = BLUEPRINT_PACKAGES.map((p) => p.slug) as [
  BlueprintSlug,
  ...BlueprintSlug[],
];

const schema = z.object({
  slug: z.enum(SLUGS),
  // The DIY questionnaire: a sparse map of answered fields. All optional.
  intake: z.record(z.union([z.string(), z.boolean()])).optional(),
});

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 },
    );
  }

  const rl = await checkRateLimit({
    request,
    bucket: "blueprint_checkout",
    windowMinutes: 60,
    maxRequests: 20,
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
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }

  // Price comes only from trusted server-side data, never from the client.
  const pkg = blueprintPackage(parsed.data.slug);
  if (!pkg) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }

  // Save the questionnaire first, so the lead is captured even if the buyer
  // abandons checkout. Best-effort: a save failure never blocks the purchase.
  let intakeId: string | null = null;
  const intake = parsed.data.intake;
  if (intake && Object.keys(intake).length > 0 && isSupabaseServiceConfigured()) {
    const str = (k: string) =>
      typeof intake[k] === "string" ? (intake[k] as string).trim() || null : null;
    const responses: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(intake)) {
      if (v === "" || v === false || v == null) continue;
      responses[k] = v;
    }
    try {
      const supabase = getSupabaseServiceClient();
      const { data } = await supabase
        .from("blueprint_intake")
        .insert({
          package_slug: pkg.slug,
          contact_name: str("contact_name"),
          contact_email: str("contact_email")?.toLowerCase() ?? null,
          firm_name: str("firm_name"),
          phone: str("phone"),
          practice_area: str("practice_area"),
          firm_size: str("firm_size"),
          anything_else: str("anything_else"),
          responses,
        })
        .select("id")
        .single();
      intakeId = (data?.id as string | undefined) ?? null;
    } catch (err) {
      console.warn(
        "blueprint_intake_save_failed",
        err instanceof Error ? err.message : "unknown",
      );
    }
  }

  const isDeposit = pkg.chargeUsd < pkg.priceUsd;
  const stripe = requireStripe();
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(pkg.chargeUsd * 100),
            product_data: {
              name: `Legal-Tech Blueprint: ${pkg.name}`,
              description: isDeposit
                ? "50% deposit to start. Balance due before final handoff."
                : pkg.priceNote,
            },
          },
        },
      ],
      success_url: `${SITE.url}/services/legal-tech-blueprint/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE.url}/services/legal-tech-blueprint`,
      metadata: {
        kind: "blueprint_purchase",
        package_slug: pkg.slug,
        package_name: pkg.name,
        intake_id: intakeId ?? "",
        amount_usd: String(pkg.chargeUsd),
        is_deposit: isDeposit ? "true" : "false",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.warn(
      "blueprint_checkout_failed",
      err instanceof Error ? err.message : "unknown",
    );
    return NextResponse.json(
      { error: "Could not start checkout. Try again." },
      { status: 500 },
    );
  }
}
