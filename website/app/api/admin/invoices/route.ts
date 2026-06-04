import { NextResponse } from "next/server";
import { Resend } from "resend";
import type Stripe from "stripe";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { SITE } from "@/lib/site";
import {
  STRIPE_INVOICE_PAYMENT_METHOD_TYPES,
  requireStripe,
} from "@/lib/stripe";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StripeCheckoutSessionCreateParams = NonNullable<
  Parameters<Stripe["checkout"]["sessions"]["create"]>[0]
>;
type StripeCheckoutLineItem = NonNullable<
  StripeCheckoutSessionCreateParams["line_items"]
>[number];

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
  payment_plan: z.boolean().default(false),
  down_payment_dollars: z.number().min(0).max(100000).default(0),
  installment_interval: z.enum(["week", "month"]).default("month"),
  installment_count: z.number().int().min(2).max(60).default(4),
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

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function intervalLabel(interval: "week" | "month", count: number): string {
  const unit = interval === "week" ? "weekly" : "monthly";
  return `${count} ${unit} payment${count === 1 ? "" : "s"}`;
}

function planCancelAt(interval: "week" | "month", installmentCount: number): number {
  const d = new Date();
  if (interval === "week") {
    d.setUTCDate(d.getUTCDate() + installmentCount * 7);
  } else {
    d.setUTCMonth(d.getUTCMonth() + installmentCount);
  }
  return Math.floor(d.getTime() / 1000);
}

async function sendPaymentPlanEmail(opts: {
  to: string;
  clientName: string;
  title: string;
  description: string;
  checkoutUrl: string;
  totalCents: number;
  downPaymentCents: number;
  installmentCents: number;
  installmentInterval: "week" | "month";
  installmentCount: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return { sent: false, error: "Resend is not configured, so the payment-plan email was not sent." };
  }

  const usd = (cents: number) =>
    (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const subject = `Payment plan: ${opts.title}`;
  const plan = `${usd(opts.downPaymentCents)} down, then ${intervalLabel(
    opts.installmentInterval,
    opts.installmentCount,
  )} of ${usd(opts.installmentCents)}`;
  const text = `Hi ${opts.clientName},

Here is the payment-plan checkout link for ${opts.title}.

Total balance: ${usd(opts.totalCents)}
Plan: ${plan}

Work covered:
${opts.description}

Open and approve the payment plan here:
${opts.checkoutUrl}

This checkout page is hosted by Stripe. Once you approve it, Stripe will collect the down payment and then bill the scheduled installments automatically.

Real Ryan Nichols LLC
${SITE.url}`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;max-width:620px;margin:0 auto;padding:24px 16px;">
      <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:#b42318;margin:0 0 10px;">Payment plan</p>
      <h1 style="font-size:24px;line-height:1.25;margin:0 0 12px;">${esc(opts.title)}</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px;">Hi ${esc(opts.clientName)}, here is the Stripe-hosted checkout link for the payment plan.</p>
      <div style="border:1px solid #dfc98f;border-radius:12px;padding:14px 16px;background:#fffaf0;margin:0 0 20px;">
        <p style="font-size:13px;text-transform:uppercase;letter-spacing:.12em;color:#7a6a51;font-weight:800;margin:0 0 6px;">Plan terms</p>
        <p style="font-size:18px;font-weight:800;margin:0 0 6px;">${esc(plan)}</p>
        <p style="font-size:14px;color:#5b5144;margin:0;">Total balance: ${usd(opts.totalCents)}</p>
      </div>
      <p style="margin:0 0 24px;">
        <a href="${opts.checkoutUrl}" style="background:#1f6f4a;color:#fff;text-decoration:none;padding:13px 18px;border-radius:10px;display:inline-block;font-weight:800;">Open payment plan</a>
      </p>
      <p style="font-size:14px;line-height:1.6;color:#555;margin:0 0 10px;"><strong>Work covered:</strong></p>
      <p style="font-size:14px;line-height:1.6;color:#555;margin:0 0 18px;">${esc(opts.description)}</p>
      <p style="font-size:12px;line-height:1.6;color:#777;margin:0;">Stripe collects the down payment and then bills the scheduled installments automatically after approval.</p>
    </div>
  `;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: opts.to,
    subject,
    html,
    text,
  });
  return { sent: !error, error: error?.message ?? null };
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
  const downPaymentCents = input.payment_plan
    ? Math.round(input.down_payment_dollars * 100)
    : 0;
  if (input.payment_plan) {
    if (!Number.isInteger(downPaymentCents) || downPaymentCents < 0) {
      return NextResponse.json({ error: "Invalid down payment." }, { status: 400 });
    }
    if (downPaymentCents >= amountCents) {
      return NextResponse.json(
        { error: "Down payment must be less than the total invoice amount." },
        { status: 400 },
      );
    }
    const remaining = amountCents - downPaymentCents;
    if (remaining % input.installment_count !== 0) {
      return NextResponse.json(
        {
          error:
            "Remaining balance must divide cleanly by the number of installments. Adjust the down payment or payment count.",
        },
        { status: 400 },
      );
    }
  }
  const installmentCents = input.payment_plan
    ? (amountCents - downPaymentCents) / input.installment_count
    : null;

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
      payment_mode: input.payment_plan ? "plan" : "full",
      down_payment_cents: downPaymentCents,
      installment_cents: installmentCents,
      installment_interval: input.payment_plan ? input.installment_interval : null,
      installment_count: input.payment_plan ? input.installment_count : null,
    })
    .select(
      "id, status, amount_cents, stripe_hosted_invoice_url, stripe_invoice_pdf, payment_mode, down_payment_cents, installment_cents, installment_interval, installment_count",
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

    if (input.payment_plan) {
      if (!installmentCents) {
        throw new Error("Payment plan did not calculate an installment amount.");
      }
      const metadata = {
        kind: "service_payment_plan",
        service_invoice_id: invoice.id,
        client_name: input.client_name,
        payment_options: "stripe_checkout_automatic_installments",
        installment_interval: input.installment_interval,
        installment_count: String(input.installment_count),
        down_payment_cents: String(downPaymentCents),
        installment_cents: String(installmentCents),
        total_cents: String(amountCents),
      };
      const lineItems: StripeCheckoutLineItem[] = [];
      if (downPaymentCents > 0) {
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: downPaymentCents,
            product_data: {
              name: `${input.title} down payment`,
              description: input.description.slice(0, 250),
            },
          },
        });
      }
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: installmentCents,
          recurring: { interval: input.installment_interval },
          product_data: {
            name: `${input.title} installment`,
            description: `${intervalLabel(input.installment_interval, input.installment_count)} for ${input.client_name}`,
          },
        },
      });

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customer.id,
        line_items: lineItems,
        success_url: `${SITE.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE.url}/checkout/cancel`,
        metadata,
        subscription_data: {
          description: input.title,
          metadata: {
            ...metadata,
            cancel_after_timestamp: String(
              planCancelAt(input.installment_interval, input.installment_count),
            ),
          },
        },
      });

      let emailSent = false;
      let emailError: string | null = null;
      if (input.delivery === "stripe_send" && input.client_email && session.url) {
        const send = await sendPaymentPlanEmail({
          to: input.client_email,
          clientName: input.client_name,
          title: input.title,
          description: input.description,
          checkoutUrl: session.url,
          totalCents: amountCents,
          downPaymentCents,
          installmentCents,
          installmentInterval: input.installment_interval,
          installmentCount: input.installment_count,
        });
        emailSent = send.sent;
        emailError = send.error;
      }

      const { data: updated, error: updateError } = await svc
        .from("service_invoices")
        .update({
          updated_at: new Date().toISOString(),
          status: "open",
          sent_at: input.delivery === "stripe_send" && emailSent ? new Date().toISOString() : null,
          stripe_customer_id: customer.id,
          stripe_checkout_session_id: session.id,
          stripe_hosted_invoice_url: session.url,
          stripe_last_error: emailError,
        })
        .eq("id", invoice.id)
        .select(
          "id, status, amount_cents, stripe_hosted_invoice_url, stripe_invoice_pdf, payment_mode, down_payment_cents, installment_cents, installment_interval, installment_count",
        )
        .single();

      if (updateError || !updated) {
        return NextResponse.json(
          { error: updateError?.message ?? "Stripe payment plan created, but local record did not update." },
          { status: 500 },
        );
      }

      return NextResponse.json({ ok: true, invoice: updated, email_sent: emailSent });
    }

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
      payment_settings: {
        payment_method_types: STRIPE_INVOICE_PAYMENT_METHOD_TYPES,
      },
      metadata: {
        kind: "service_invoice",
        service_invoice_id: invoice.id,
        client_name: input.client_name,
        payment_options: "card,link,affirm,klarna",
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
        "id, status, amount_cents, stripe_hosted_invoice_url, stripe_invoice_pdf, payment_mode, down_payment_cents, installment_cents, installment_interval, installment_count",
      )
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? "Stripe invoice created, but local record did not update." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, invoice: updated, email_sent: input.delivery === "stripe_send" });
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
