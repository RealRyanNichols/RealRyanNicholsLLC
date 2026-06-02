// Server-only. Reports which integrations are wired up by checking the PRESENCE
// of their environment variables — never their values, so the result is safe to
// render to a signed-in admin. Presence does not prove validity (a set-but-wrong
// key still fails), but a missing var is by far the most common reason a
// contact / payment / email path goes dead in this app, since every one of those
// features ships dormant until its keys are set in Vercel.

const present = (v: string | undefined | null): boolean =>
  typeof v === "string" && v.trim().length > 0;

export type CheckStatus = "ok" | "partial" | "off";

export type IntegrationCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  /** Needed for a core money / contact / email path (vs. a nice-to-have). */
  critical: boolean;
  /** One-line plain-English statement of the current state. */
  summary: string;
  /** What starts working once this is on. */
  unlocks: string;
  /** Env var names still missing (empty when status is "ok"). */
  missing: string[];
  /** Where to get the value and where to set it. */
  where: string;
};

export type IntegrationGroup = {
  group: string;
  blurb: string;
  checks: IntegrationCheck[];
};

/** all-set -> ok; some-but-not-all -> partial; none -> off */
function rollup(flags: boolean[]): CheckStatus {
  if (flags.every(Boolean)) return "ok";
  if (flags.some(Boolean)) return "partial";
  return "off";
}

export function getIntegrationHealth(): IntegrationGroup[] {
  const e = process.env;

  const resendKey = present(e.RESEND_API_KEY);
  const resendFrom = present(e.RESEND_FROM_EMAIL);
  const mailing = present(e.SITE_MAILING_ADDRESS);
  const adminNotify = present(e.ADMIN_NOTIFY_EMAIL);

  const stripeKey = present(e.STRIPE_SECRET_KEY);
  const stripeWebhook = present(e.STRIPE_WEBHOOK_SECRET);
  const supporterPrice = present(e.STRIPE_SUPPORTER_PRICE_ID);

  const serviceRole = present(e.SUPABASE_SERVICE_ROLE_KEY);
  const supaUrl = present(e.NEXT_PUBLIC_SUPABASE_URL);
  const supaAnon = present(e.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const muxId = present(e.MUX_TOKEN_ID);
  const muxSecret = present(e.MUX_TOKEN_SECRET);
  const muxWebhook = present(e.MUX_WEBHOOK_SECRET);
  const anthropic = present(e.ANTHROPIC_API_KEY);
  const adminEmails = present(e.ADMIN_EMAILS);

  const missing = (pairs: Array<[boolean, string]>): string[] =>
    pairs.filter(([ok]) => !ok).map(([, name]) => name);

  return [
    {
      group: "Email",
      blurb:
        "If this whole group is red, the site saves submissions but sends nothing — which is exactly why contact, tips, and signups feel broken even though the data is getting through.",
      checks: [
        {
          id: "resend",
          label: "Email sending (Resend)",
          status: rollup([resendKey, resendFrom]),
          critical: true,
          summary:
            resendKey && resendFrom
              ? "Connected — the site can send email."
              : "No email is being sent right now.",
          unlocks:
            "Subscriber confirmation emails, support thank-you notes, new-tip and J6-claim alerts to you, and post/live broadcast blasts.",
          missing: missing([
            [resendKey, "RESEND_API_KEY"],
            [resendFrom, "RESEND_FROM_EMAIL"],
          ]),
          where:
            "Sign up at resend.com, verify your sending domain (realryannichols.com), create an API key, then set RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel → Settings → Environment Variables.",
        },
        {
          id: "mailing",
          label: "Mailing address (CAN-SPAM)",
          status: mailing ? "ok" : "off",
          critical: true,
          summary: mailing
            ? "Set — email signups are allowed."
            : "Email newsletter signups are blocked until a postal address is set (US CAN-SPAM law).",
          unlocks:
            "Lets people subscribe by email; printed in every email footer and on the privacy page.",
          missing: missing([[mailing, "SITE_MAILING_ADDRESS"]]),
          where:
            'Any street address or PO box is fine. Set SITE_MAILING_ADDRESS in Vercel (e.g. "PO Box 123, City, ST 00000").',
        },
        {
          id: "admin-notify",
          label: "Where alerts go",
          status: adminNotify || resendFrom ? "ok" : "off",
          critical: false,
          summary: adminNotify
            ? "Tip and claim alerts go to ADMIN_NOTIFY_EMAIL."
            : resendFrom
              ? "Alerts fall back to your RESEND_FROM_EMAIL address (fine)."
              : "No alert destination yet — set email sending first.",
          unlocks: "The inbox that receives new-tip and free-claim notifications.",
          missing: [],
          where:
            "Optional. Set ADMIN_NOTIFY_EMAIL in Vercel to route alerts somewhere other than the From address.",
        },
      ],
    },
    {
      group: "Payments",
      blurb: "Taking money: one-time donations, the store, and the membership.",
      checks: [
        {
          id: "stripe",
          label: "Card payments (Stripe)",
          status: stripeKey ? "ok" : "off",
          critical: true,
          summary: stripeKey
            ? "Connected — donations and checkout work."
            : "Payments are off — every checkout returns 'not configured yet.'",
          unlocks: "One-time donations, store orders, and supporter checkout.",
          missing: missing([[stripeKey, "STRIPE_SECRET_KEY"]]),
          where:
            "Stripe Dashboard → Developers → API keys (a restricted key with write on Checkout/Payment Intents is enough). Set STRIPE_SECRET_KEY in Vercel.",
        },
        {
          id: "stripe-webhook",
          label: "Payment recording (webhook)",
          status: stripeWebhook ? "ok" : "off",
          critical: false,
          summary: stripeWebhook
            ? "Set — completed payments are recorded automatically."
            : "Payments still go through, but the site can't auto-record them, update the funding total, or trigger fulfillment.",
          unlocks:
            "Auto-records completed payments, bumps the funding meter, and fires order fulfillment.",
          missing: missing([[stripeWebhook, "STRIPE_WEBHOOK_SECRET"]]),
          where:
            "Stripe → Developers → Webhooks → add endpoint /api/stripe/webhook, then copy its signing secret into STRIPE_WEBHOOK_SECRET in Vercel.",
        },
        {
          id: "supporter",
          label: "Membership ($5/mo)",
          status: supporterPrice ? "ok" : "off",
          critical: false,
          summary: supporterPrice
            ? "Connected — the $5/mo membership checkout works."
            : "The $5/mo membership API errors out (a hardcoded Stripe payment link may still work). One-time donations are unaffected.",
          unlocks: "The recurring $5/month supporter subscription via native checkout.",
          missing: missing([[supporterPrice, "STRIPE_SUPPORTER_PRICE_ID"]]),
          where:
            "In Stripe, create a recurring $5/mo Price, then paste its price_… id into STRIPE_SUPPORTER_PRICE_ID in Vercel.",
        },
      ],
    },
    {
      group: "Database",
      blurb: "Where everything is read and written. Messages and notes post here.",
      checks: [
        {
          id: "supabase-public",
          label: "Database connection",
          status: rollup([supaUrl, supaAnon]),
          critical: true,
          summary:
            supaUrl && supaAnon
              ? "Connected."
              : "The site can't reach its database — most pages and forms will fail.",
          unlocks:
            "Everything. Private messages and support notes are written through this anon connection.",
          missing: missing([
            [supaUrl, "NEXT_PUBLIC_SUPABASE_URL"],
            [supaAnon, "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
          ]),
          where: "Supabase → Project Settings → API. Set both in Vercel.",
        },
        {
          id: "supabase-service",
          label: "Server writes (service role)",
          status: serviceRole ? "ok" : "off",
          critical: true,
          summary: serviceRole
            ? "Connected — tip intake and signups can be written."
            : "Tip intake and email/phone signups return 'not configured yet.'",
          unlocks:
            "Public tip-line submissions, email/phone signups, and admin write tools.",
          missing: missing([[serviceRole, "SUPABASE_SERVICE_ROLE_KEY"]]),
          where:
            "Supabase → Project Settings → API → service_role key. Set SUPABASE_SERVICE_ROLE_KEY in Vercel. Never expose it to the browser.",
        },
      ],
    },
    {
      group: "Media & extras",
      blurb: "Optional. The core site (reading, contact, donations) runs without these.",
      checks: [
        {
          id: "mux",
          label: "Video & live (Mux)",
          status: rollup([muxId, muxSecret, muxWebhook]),
          critical: false,
          summary:
            muxId && muxSecret
              ? muxWebhook
                ? "Connected."
                : "Uploads work, but the webhook secret is missing so posts won't auto-publish after transcoding."
              : "HD uploads and live streaming are off.",
          unlocks: "HD video uploads, live streaming, and adaptive playback.",
          missing: missing([
            [muxId, "MUX_TOKEN_ID"],
            [muxSecret, "MUX_TOKEN_SECRET"],
            [muxWebhook, "MUX_WEBHOOK_SECRET"],
          ]),
          where:
            "dashboard.mux.com → Settings → Access Tokens (full Video perms). Set MUX_TOKEN_ID, MUX_TOKEN_SECRET, and the webhook's MUX_WEBHOOK_SECRET in Vercel. Use the Live page's built-in check to test the token live.",
        },
        {
          id: "anthropic",
          label: "AI case briefings",
          status: anthropic ? "ok" : "off",
          critical: false,
          summary: anthropic
            ? "Connected — /case/briefing is live."
            : "The AI briefings page returns 503 (the rest of the site is unaffected).",
          unlocks: "The AI-generated case briefings at /case/briefing.",
          missing: missing([[anthropic, "ANTHROPIC_API_KEY"]]),
          where: "console.anthropic.com → API keys. Set ANTHROPIC_API_KEY in Vercel.",
        },
        {
          id: "admin-emails",
          label: "Admin access list",
          status: adminEmails ? "ok" : "off",
          critical: false,
          summary: adminEmails
            ? "Set — listed emails get author tools."
            : "No ADMIN_EMAILS set (admin is then driven only by the Supabase admin_emails table).",
          unlocks: "Author-only tools for whoever signs in with a listed email.",
          missing: missing([[adminEmails, "ADMIN_EMAILS"]]),
          where:
            "Comma-separated emails in ADMIN_EMAILS (Vercel). Also seed public.admin_emails in Supabase so row-level security agrees.",
        },
      ],
    },
  ];
}

/** Count of critical checks that are not fully "ok" — for an at-a-glance banner. */
export function countCriticalIssues(groups: IntegrationGroup[]): number {
  return groups.reduce(
    (n, g) =>
      n + g.checks.filter((c) => c.critical && c.status !== "ok").length,
    0,
  );
}
