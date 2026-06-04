import "server-only";

import { Resend } from "resend";

type AdminAlertResult =
  | { sent: true; to: string[] }
  | { sent: false; reason: "not_configured"; missing: string[] }
  | { sent: false; reason: "send_failed"; error: string };

function present(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function splitRecipients(value: string | undefined | null): string[] {
  if (!present(value)) return [];
  return value
    .split(/[,\s;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function textFromError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Resend returned an email error.";
}

export function adminAlertConfigStatus(): {
  ok: boolean;
  missing: string[];
  recipients: string[];
} {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const recipients = splitRecipients(process.env.ADMIN_NOTIFY_EMAIL).length
    ? splitRecipients(process.env.ADMIN_NOTIFY_EMAIL)
    : splitRecipients(from);
  const missing = [
    !present(apiKey) ? "RESEND_API_KEY" : null,
    !present(from) ? "RESEND_FROM_EMAIL" : null,
    recipients.length === 0 ? "ADMIN_NOTIFY_EMAIL or RESEND_FROM_EMAIL" : null,
  ].filter((item): item is string => Boolean(item));

  return { ok: missing.length === 0, missing, recipients };
}

export async function sendAdminAlert(opts: {
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
}): Promise<AdminAlertResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const status = adminAlertConfigStatus();

  if (!status.ok || !present(apiKey) || !present(from)) {
    return { sent: false, reason: "not_configured", missing: status.missing };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: status.recipients,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    });
    if (error) {
      return { sent: false, reason: "send_failed", error: textFromError(error) };
    }
    return { sent: true, to: status.recipients };
  } catch (error) {
    return { sent: false, reason: "send_failed", error: textFromError(error) };
  }
}
