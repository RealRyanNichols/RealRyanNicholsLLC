import { checkRateLimit } from "@/lib/rate-limit";
import { SITE } from "@/lib/site";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { createWaterIncidentHandler } from "@/lib/water-incident";

export const runtime = "nodejs";

export const POST = createWaterIncidentHandler({
  publicOrigin: SITE.url,
  isConfigured: isSupabaseServiceConfigured,
  rateLimit: (request) =>
    checkRateLimit({
      request,
      bucket: "water_incident_report",
      windowMinutes: 60,
      maxRequests: 5,
    }),
  submit: async (input, ipHash) => {
    const { website, ...report } = input;
    if (website) return "failed";
    const { error } = await getSupabaseServiceClient().rpc(
      "submit_water_incident_report",
      { p_report: report, p_ip_hash: ipHash },
    );
    if (error?.message === "WATER_REPORT_RATE_LIMITED") return "rate_limited";
    return error ? "failed" : "saved";
  },
});
