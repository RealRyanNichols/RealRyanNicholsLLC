import crypto from "node:crypto";

function constantTimeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

/**
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
 * The schedule header identifies a cron invocation; it is not authentication.
 */
export function isAuthorizedDeadmanCron(
  request: Request,
  secret = process.env.DEADMAN_CRON_SECRET || process.env.CRON_SECRET,
): boolean {
  const configured = secret?.trim();
  if (!configured) return false;
  const authorization = request.headers.get("authorization") ?? "";
  return constantTimeEqual(authorization, `Bearer ${configured}`);
}

export function deadmanCronSecretConfigured(
  secret = process.env.DEADMAN_CRON_SECRET || process.env.CRON_SECRET,
): boolean {
  return (secret?.trim().length ?? 0) >= 16;
}
