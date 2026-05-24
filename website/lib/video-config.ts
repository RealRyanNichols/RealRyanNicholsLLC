import { isMuxConfigured } from "@/lib/mux";
import { isSupabaseServiceConfigured } from "@/lib/supabase/service";

export type VideoConfigStatus = {
  muxConfigured: boolean;
  webhookConfigured: boolean;
  serviceRoleConfigured: boolean;
  siteUrl: string;
  webhookUrl: string;
  missing: string[];
  readyForLargeUploads: boolean;
  readyForProcessingUpdates: boolean;
};

export function getVideoConfigStatus(): VideoConfigStatus {
  const siteUrl =
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://realryannichols.com");
  const muxConfigured = isMuxConfigured();
  const webhookConfigured = !!process.env.MUX_WEBHOOK_SECRET;
  const serviceRoleConfigured = isSupabaseServiceConfigured();
  const missing = [
    !process.env.MUX_TOKEN_ID ? "MUX_TOKEN_ID" : null,
    !process.env.MUX_TOKEN_SECRET ? "MUX_TOKEN_SECRET" : null,
    !process.env.MUX_WEBHOOK_SECRET ? "MUX_WEBHOOK_SECRET" : null,
    !process.env.SUPABASE_SERVICE_ROLE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    muxConfigured,
    webhookConfigured,
    serviceRoleConfigured,
    siteUrl,
    webhookUrl: `${siteUrl.replace(/\/$/, "")}/api/mux-webhook`,
    missing,
    readyForLargeUploads: muxConfigured,
    readyForProcessingUpdates: muxConfigured && webhookConfigured && serviceRoleConfigured,
  };
}
