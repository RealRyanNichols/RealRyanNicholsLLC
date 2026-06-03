import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { requireStripe } from "@/lib/stripe";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const invoiceSchema = z.object({
  client_name: z.string().trim().min(1).max(200),
  client_email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  client_phone: z
    .string()
    .trim()
    .max(80)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().min(1).max(5000),
  memo: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  amount_dollars: z.number().positive().max(100000),
  due_days: z.number().int().min(0).max(365).default(14),
  delivery: z.enum(["local_draft", "stripe_link", "stripe_send"]).default("stripe_link"),
});

function toIsoDueDate(days: number): string {
  const due = new Date();
  due.setUTCDate(due.getUTCDate() + days);
  return due.toISOString();
}

function normalizeStripeInvoiceStatus(status: StripeInvoiceStatus): InvoiceStatus {
  switch (status) {
    case "paid":
      return "paid";
    case "void":
      return "void";
    case "uncollectible":
      return "uncollectible";
    default:
      return "open";
  }
}

type StripeInvoiceStatus =
  | "draft"
  | "open"
  | "paid"
  | "uncollectible"
  | "void"
  | null;
type InvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible" | "failed";

export async function POST(request: Request) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = invoiceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid invoice." },
      { status: 400 },
    );
  }

  const input = parsed.data;
  if (input.delivery === "stripe_send" && !input.client_email) {
    return NextResponse.json(
      { error: "Client email is required before Stripe can email an invoice." },
      { status: 400 },
    );
  }

  const amountCents = Math.round(input.amount_dollars * 100);
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: "Invalid invoice amount." }, { status: 400 });
  }

  const svc = getSupabaseServiceClient();
  const dueAt = toIsoDueDate(input.due_days);
  const { data: invoice, error: insertError } = await svc
    .from("service_invoices")
    .insert({
      created_by_user_id: user?.id ?? null,
      client_name: input.client_name,
      client_email: input.client_email,
      client_phone: input.client_phone,
      title: input.title,
      description: input.description,
      memo: input.memo,
      amount_cents: amountCents,
      currency: "usd",
      status: "draft",
      due_at: dueAt,
    })
    .select(
      "id, status, amount_cents, stripe_hosted_invoice_url, stripe_invoice_pdf",
    )
    .single();

  if (insertError || !invoice) {
    return NextResponse.json(
      { error: insertError?.message ?? "Could not save invoice." },
      { status: 500 },
    );
  }

  if (input.delivery === "local_draft") {
    return NextResponse.json({ ok: true, invoice });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured. Draft was saved, but no payment link was created." },
      { status: 503 },
    );
  }

  const stripe = requireStripe();
  try {
    const customer = await stripe.customers.create({
      name: input.client_name,
      email: input.client_email ?? undefined,
      phone: input.client_phone ?? undefined,
      metadata: {
        service_invoice_id: invoice.id,
        source: "realryannichols_admin",
      },
    });

    await stripe.invoiceItems.create({
      customer: customer.id,
      amount: amountCents,
      currency: "usd",
      description: input.description,
      metadata: {
        kind: "service_invoice",
        service_invoice_id: invoice.id,
      },
    });

    const stripeInvoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: input.due_days,
      description: input.title,
      metadata: {
        kind: "service_invoice",
        service_invoice_id: invoice.id,
        client_name: input.client_name,
      },
      auto_advance: false,
    });

    let finalized = await stripe.invoices.finalizeInvoice(stripeInvoice.id);
    let sentAt: string | null = null;
    if (input.delivery === "stripe_send") {
      finalized = await stripe.invoices.sendInvoice(finalized.id);
      sentAt = new Date().toISOString();
    }

    const status = normalizeStripeInvoiceStatus(finalized.status);
    const { data: updated, error: updateError } = await svc
      .from("service_invoices")
      .update({
        updated_at: new Date().toISOString(),
        status,
        sent_at: sentAt,
        stripe_customer_id: customer.id,
        stripe_invoice_id: finalized.id,
        stripe_hosted_invoice_url: finalized.hosted_invoice_url,
        stripe_invoice_pdf: finalized.invoice_pdf,
        stripe_last_error: null,
      })
      .eq("id", invoice.id)
      .select(
        "id, status, amount_cents, stripe_hosted_invoice_url, stripe_invoice_pdf",
      )
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? "Stripe invoice created, but local record did not update." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, invoice: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe invoice creation failed.";
    await svc
      .from("service_invoices")
      .update({
        updated_at: new Date().toISOString(),
        status: "failed",
        stripe_last_error: message,
      })
      .eq("id", invoice.id);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
