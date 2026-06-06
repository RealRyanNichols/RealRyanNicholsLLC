import { SITE } from "./site";
import { BOOK } from "./book";

export type EmailEnvelope = {
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

function requireMailingAddress(): string {
  const addr = SITE.mailingAddress;
  if (!addr) {
    throw new Error(
      "SITE_MAILING_ADDRESS env var is required (CAN-SPAM compliance)."
    );
  }
  return addr;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function unsubscribeUrl(token: string): string {
  return `${SITE.url}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

function confirmUrl(token: string): string {
  return `${SITE.url}/api/subscribe/confirm?token=${encodeURIComponent(token)}`;
}

const FONT = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;`;

function footerHtml(unsubUrl: string): string {
  const address = requireMailingAddress();
  return `
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0 16px;" />
    <p style="font-size:12px;color:#888;line-height:1.6;margin:0 0 8px;">
      You're receiving this because you subscribed at
      <a href="${SITE.url}" style="color:#888;">${SITE.url.replace(/^https?:\/\//, "")}</a>.
    </p>
    <p style="font-size:12px;color:#888;line-height:1.6;margin:0 0 8px;">
      ${esc(SITE.author)} · ${esc(address)}
    </p>
    <p style="font-size:12px;color:#888;line-height:1.6;margin:0;">
      <a href="${unsubUrl}" style="color:#888;text-decoration:underline;">Unsubscribe</a>
    </p>
  `;
}

function footerText(unsubUrl: string): string {
  const address = requireMailingAddress();
  return `\n\n— ${SITE.author}\n${address}\n\nUnsubscribe: ${unsubUrl}`;
}

function listUnsubscribeHeaders(unsubUrl: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export function buildConfirmationEmail(opts: {
  email: string;
  confirmationToken: string;
}): EmailEnvelope {
  const url = confirmUrl(opts.confirmationToken);
  const subject = `Confirm your subscription to ${SITE.name}`;
  const text = `Hi,

You (or someone using ${opts.email}) asked to subscribe to updates from ${SITE.name} at ${SITE.url}.

Confirm your subscription by clicking this link:
${url}

If you didn't sign up, just ignore this email — you won't be added to the list.

— ${SITE.author}`;

  const html = `
    <div style="${FONT}color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px 16px;">
      <h1 style="font-size:22px;line-height:1.3;margin:0 0 16px;">Confirm your subscription</h1>
      <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 18px;">
        You (or someone using <strong>${esc(opts.email)}</strong>) asked to subscribe to updates from ${esc(SITE.name)}.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${url}" style="background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600;">Confirm subscription</a>
      </p>
      <p style="font-size:13px;line-height:1.6;color:#666;margin:0 0 12px;">
        If you didn't sign up, just ignore this email — you won't be added to the list.
      </p>
      <p style="font-size:13px;line-height:1.6;color:#666;margin:0;">
        Or paste this link in your browser: <br/>
        <a href="${url}" style="color:#666;word-break:break-all;">${url}</a>
      </p>
    </div>
  `;

  // No List-Unsubscribe on confirmation email — they're not on the list yet.
  return { subject, html, text };
}

export function buildWelcomeEmail(opts: {
  email: string;
  unsubscribeToken: string;
}): EmailEnvelope {
  const unsubUrl = unsubscribeUrl(opts.unsubscribeToken);
  const subject = `You're in — welcome to ${SITE.name}`;
  const text = `You're confirmed.

I'll send an email when there's something new worth reading. No algorithm, no platform middlemen, no spam.

The site: ${SITE.url}
${footerText(unsubUrl)}`;

  const html = `
    <div style="${FONT}color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px 16px;">
      <h1 style="font-size:22px;line-height:1.3;margin:0 0 16px;">You're confirmed.</h1>
      <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 18px;">
        I'll send an email when there's something new worth reading.
        No algorithm, no platform middlemen, no spam.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${SITE.url}" style="background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;font-weight:600;">Visit the site →</a>
      </p>
      ${footerHtml(unsubUrl)}
    </div>
  `;

  return { subject, html, text, headers: listUnsubscribeHeaders(unsubUrl) };
}

export function buildPostBroadcastEmail(opts: {
  post: { title: string; body: string; slug: string };
  unsubscribeToken: string;
}): EmailEnvelope {
  const unsubUrl = unsubscribeUrl(opts.unsubscribeToken);
  const url = `${SITE.url}/posts/${opts.post.slug}`;
  const excerpt = opts.post.body.slice(0, 280).replace(/\s+/g, " ").trim();
  const truncated = opts.post.body.length > 280;
  const subject = opts.post.title;

  const text = `${opts.post.title}

${excerpt}${truncated ? "..." : ""}

Read the rest: ${url}
${footerText(unsubUrl)}`;

  const html = `
    <div style="${FONT}color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px 16px;">
      <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px;">${esc(opts.post.title)}</h1>
      <p style="font-size:15px;line-height:1.65;color:#444;margin:0 0 20px;">${esc(excerpt)}${truncated ? "…" : ""}</p>
      <p style="margin:0 0 24px;">
        <a href="${url}" style="background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;font-weight:600;">Read the rest →</a>
      </p>
      ${footerHtml(unsubUrl)}
    </div>
  `;

  return { subject, html, text, headers: listUnsubscribeHeaders(unsubUrl) };
}

export function buildLiveBroadcastEmail(opts: {
  live: { title: string; description: string; slug: string };
  unsubscribeToken: string;
}): EmailEnvelope {
  const unsubUrl = unsubscribeUrl(opts.unsubscribeToken);
  const url = `${SITE.url}/live/${opts.live.slug}`;
  const excerpt =
    opts.live.description.slice(0, 280).replace(/\s+/g, " ").trim() ||
    "Ryan is live now on the site he owns.";
  const truncated = opts.live.description.length > 280;
  const subject = `LIVE: ${opts.live.title}`;

  const text = `Ryan is live now.

${opts.live.title}

${excerpt}${truncated ? "…" : ""}

Watch here: ${url}
${footerText(unsubUrl)}`;

  const html = `
    <div style="${FONT}color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px 16px;">
      <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#b42318;margin:0 0 10px;">Live now</p>
      <h1 style="font-size:24px;line-height:1.25;margin:0 0 12px;">${esc(opts.live.title)}</h1>
      <p style="font-size:15px;line-height:1.65;color:#444;margin:0 0 20px;">${esc(excerpt)}${truncated ? "..." : ""}</p>
      <p style="margin:0 0 24px;">
        <a href="${url}" style="background:#b42318;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:700;">Watch live on RealRyanNichols.com -&gt;</a>
      </p>
      <p style="font-size:13px;line-height:1.6;color:#666;margin:0 0 12px;">
        No platform feed. No algorithm. The video is on Ryan's site.
      </p>
      ${footerHtml(unsubUrl)}
    </div>
  `;

  return { subject, html, text, headers: listUnsubscribeHeaders(unsubUrl) };
}

// Confirmation for the book email list. Single opt-in (consent checkbox), so
// there is no double-opt-in link. Includes a plain-language opt-out instead of
// the tokenized unsubscribe machinery used by the newsletter.
export function buildBookSignupEmail(): EmailEnvelope {
  const url = `${SITE.url}/book/updates`;
  const subject = `You are on the list — ${BOOK.title}`;

  const text = `Thanks for signing up for updates on ${BOOK.title}.

I will email you the milestones — writing, editing, printing, and the release date — and the opening chapter when it is ready.

Follow along: ${url}

You signed up at ${SITE.url}/book. If this was not you, just reply and I will remove you.

— ${SITE.author}`;

  const html = `
    <div style="${FONT}color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px 16px;">
      <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#7a271a;margin:0 0 10px;">${esc(BOOK.title)}</p>
      <h1 style="font-size:24px;line-height:1.25;margin:0 0 12px;">You are on the list.</h1>
      <p style="font-size:15px;line-height:1.65;color:#333;margin:0 0 16px;">
        Thanks for signing up. I will email you the milestones — writing, editing,
        printing, and the release date — and the opening chapter when it is ready.
      </p>
      <p style="margin:0 0 22px;">
        <a href="${url}" style="background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;font-weight:700;">See the latest updates</a>
      </p>
      <p style="font-size:13px;line-height:1.6;color:#666;margin:0;">
        You signed up at <a href="${SITE.url}/book" style="color:#666;">${SITE.url.replace(/^https?:\/\//, "")}/book</a>.
        If this was not you, just reply and I will remove you.
      </p>
      <p style="font-size:13px;line-height:1.6;color:#666;margin:14px 0 0;">— ${esc(SITE.author)}</p>
    </div>
  `;

  return { subject, html, text };
}

export function buildSupportThankYouEmail(opts: {
  displayName?: string | null;
  purpose?: string | null;
  amount?: string | null;
  message?: string | null;
}): EmailEnvelope {
  const name = opts.displayName?.trim() || "there";
  const purpose = opts.purpose?.trim() || "the work";
  const amount = opts.amount?.trim();
  const message = opts.message?.trim();
  const subject = "Thank you for supporting Ryan Nichols";

  const text = `Hi ${name},

Thank you for supporting RealRyanNichols.com.

I received your support note${amount ? ` for ${amount}` : ""} marked for: ${purpose}.

${message ? `Your message:\n${message}\n\n` : ""}I read these personally. If you also completed the payment step, thank you. If you only saved the note, the support page will take you to the payment link when you are ready.

Support page: ${SITE.url}/support

— ${SITE.author}`;

  const html = `
    <div style="${FONT}color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px 16px;">
      <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#7a271a;margin:0 0 10px;">Support received</p>
      <h1 style="font-size:24px;line-height:1.25;margin:0 0 12px;">Thank you.</h1>
      <p style="font-size:15px;line-height:1.65;color:#333;margin:0 0 14px;">
        Hi ${esc(name)}, thank you for supporting RealRyanNichols.com.
      </p>
      <p style="font-size:15px;line-height:1.65;color:#444;margin:0 0 14px;">
        I received your support note${amount ? ` for <strong>${esc(amount)}</strong>` : ""} marked for <strong>${esc(purpose)}</strong>.
      </p>
      ${
        message
          ? `<blockquote style="border-left:4px solid #d0a24a;margin:18px 0;padding:8px 0 8px 14px;color:#444;font-size:14px;line-height:1.6;">${esc(message)}</blockquote>`
          : ""
      }
      <p style="font-size:14px;line-height:1.6;color:#555;margin:0 0 20px;">
        I read these personally. If you also completed the payment step, thank you. If you only saved the note, the support page will take you to the payment link when you are ready.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${SITE.url}/support" style="background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;font-weight:700;">Open support page</a>
      </p>
    </div>
  `;

  return { subject, html, text };
}

// Transactional notices for the J6 free-claim path (not marketing — no
// unsubscribe footer). Returns the admin notice + the claimant confirmation.
export function buildJ6ClaimEmails(opts: {
  productName: string;
  claimantEmail: string;
  orderId: string;
  shipping?: unknown;
  notes?: string | null;
}): { admin: EmailEnvelope; user: EmailEnvelope } {
  const admin: EmailEnvelope = {
    subject: `[J6 Free Claim] ${opts.productName} — ${opts.claimantEmail}`,
    text: `A verified J6 defendant claimed a free product.

Product: ${opts.productName}
Claimant: ${opts.claimantEmail}
Order: ${opts.orderId}
Notes/shipping: stored in admin order record

Review: ${SITE.url}/admin/orders
Deliver, then mark the order fulfilled in /admin/orders.`,
    html: `
      <div style="${FONT}color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px 16px;">
        <h1 style="font-size:20px;margin:0 0 12px;">New J6 free claim</h1>
        <p style="font-size:14px;color:#333;margin:0 0 6px;"><strong>Product:</strong> ${esc(opts.productName)}</p>
        <p style="font-size:14px;color:#333;margin:0 0 6px;"><strong>Claimant:</strong> ${esc(opts.claimantEmail)}</p>
        <p style="font-size:14px;color:#333;margin:0 0 6px;"><strong>Order:</strong> ${esc(opts.orderId)}</p>
        <p style="font-size:14px;color:#333;margin:0 0 14px;">Notes and shipping stay in the admin order record instead of email storage.</p>
        <p style="margin:0 0 16px;"><a href="${SITE.url}/admin/orders" style="background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;display:inline-block;font-weight:700;">Open orders</a></p>
        <p style="font-size:13px;color:#666;">Deliver, then mark fulfilled in /admin/orders.</p>
      </div>`,
  };

  const user: EmailEnvelope = {
    subject: `Your free claim is in — ${opts.productName}`,
    text: `Thank you.

Your claim for "${opts.productName}" came through as a verified January 6 defendant — at no charge. Ryan will follow up personally with delivery details within 48 hours.

— ${SITE.author}
${SITE.url}`,
    html: `
      <div style="${FONT}color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px 16px;">
        <h1 style="font-size:22px;margin:0 0 16px;">Your free claim is in.</h1>
        <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 16px;">
          Your claim for <strong>${esc(opts.productName)}</strong> came through as a verified
          January 6 defendant — at no charge. I'll follow up personally with delivery
          details within 48 hours.
        </p>
        <p style="font-size:15px;line-height:1.6;color:#333;margin:0;">— ${esc(SITE.author)}</p>
      </div>`,
  };

  return { admin, user };
}
