import { SITE } from "./site";

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

${excerpt}${truncated ? "…" : ""}

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
