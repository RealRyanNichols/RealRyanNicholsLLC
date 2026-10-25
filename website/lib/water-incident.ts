import { z } from "zod";

export const WATER_REPORT_MAX_BYTES = 32 * 1024;

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const date = new Date(`${value}T00:00:00Z`);
  return (
    year >= 1900 &&
    year <= 2100 &&
    !Number.isNaN(date.valueOf()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function publicNoticeUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export const waterIncidentSchema = z
  .object({
    town: z
      .string()
      .trim()
      .min(2, "Enter the town or nearest community.")
      .max(100),
    county: z.string().trim().max(100).default(""),
    incident_date: z.string().refine(validDate, "Enter a valid incident date."),
    utility: z.string().trim().max(120).default(""),
    general_location: z.string().trim().max(160).default(""),
    knowledge_basis: z.enum(["firsthand", "secondhand", "mixed"]),
    observed_details: z.string().trim().max(4000).default(""),
    heard_details: z.string().trim().max(4000).default(""),
    notice_context: z.string().trim().max(2000).default(""),
    notice_url: z
      .string()
      .trim()
      .max(2048)
      .refine(
        publicNoticeUrl,
        "Use a public http or https notice URL without sign-in credentials.",
      )
      .transform((value) => (value ? new URL(value).href : ""))
      .default(""),
    contact_email: z
      .string()
      .trim()
      .max(254)
      .email("Enter a valid email, or leave it blank.")
      .or(z.literal(""))
      .default(""),
    contact_permission: z.boolean().default(false),
    private_review_consent: z.literal(true, {
      errorMap: () => ({ message: "Please consent to private review." }),
    }),
    source_post_slug: z
      .string()
      .max(120)
      .regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/)
      .default(""),
    website: z.string().max(0).default(""),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.knowledge_basis !== "secondhand" &&
      data.observed_details.length < 20
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["observed_details"],
        message:
          "Describe what you personally observed in at least 20 characters.",
      });
    }
    if (
      data.knowledge_basis !== "firsthand" &&
      data.heard_details.length < 20
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["heard_details"],
        message:
          "Separate what someone else reported in at least 20 characters.",
      });
    }
    if (data.contact_email && !data.contact_permission) {
      ctx.addIssue({
        code: "custom",
        path: ["contact_permission"],
        message: "Allow private email follow-up, or remove your email.",
      });
    }
    if (data.contact_permission && !data.contact_email) {
      ctx.addIssue({
        code: "custom",
        path: ["contact_email"],
        message:
          "Enter an email for private follow-up, or clear that permission.",
      });
    }
  });

export type WaterIncidentInput = z.infer<typeof waterIncidentSchema>;

export type WaterIncidentDependencies = {
  isConfigured: () => boolean;
  rateLimit: (
    request: Request,
  ) => Promise<
    | { ok: true; ipHash: string }
    | { ok: false; error: string; retryAfterSec: number }
  >;
  submit: (
    input: WaterIncidentInput,
    ipHash: string,
  ) => Promise<"saved" | "rate_limited" | "failed">;
};

function response(body: Record<string, unknown>, status: number, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...headers,
    },
  });
}

async function boundedJson(request: Request): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length && Number(length) > WATER_REPORT_MAX_BYTES)
    throw new Error("too_large");
  if (!request.body) throw new Error("invalid_json");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > WATER_REPORT_MAX_BYTES) {
        await reader.cancel();
        throw new Error("too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function createWaterIncidentHandler(deps: WaterIncidentDependencies) {
  return async function POST(request: Request): Promise<Response> {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      return response({ error: "Submit this form from this website." }, 403);
    }
    if (
      request.headers.get("content-type")?.split(";")[0].trim() !==
      "application/json"
    ) {
      return response({ error: "Use the website form." }, 415);
    }
    let payload: unknown;
    try {
      payload = await boundedJson(request);
    } catch (error) {
      const tooLarge = error instanceof Error && error.message === "too_large";
      return response(
        {
          error: tooLarge
            ? "Please shorten the report."
            : "Invalid report data.",
        },
        tooLarge ? 413 : 400,
      );
    }
    if (
      payload &&
      typeof payload === "object" &&
      "website" in payload &&
      payload.website
    ) {
      return response({ ok: true }, 202);
    }
    const parsed = waterIncidentSchema.safeParse(payload);
    if (!parsed.success)
      return response(
        {
          error: parsed.error.issues[0]?.message ?? "Check the report fields.",
        },
        400,
      );
    if (!deps.isConfigured())
      return response(
        {
          error:
            "Private report intake is not available. Please try again later.",
        },
        503,
      );
    try {
      const rate = await deps.rateLimit(request);
      if (!rate.ok)
        return response(
          { error: "Too many reports. Please try again later." },
          429,
          { "Retry-After": String(rate.retryAfterSec) },
        );
      const saved = await deps.submit(parsed.data, rate.ipHash);
      if (saved === "rate_limited")
        return response(
          { error: "Too many reports. Please try again later." },
          429,
          { "Retry-After": "3600" },
        );
      if (saved !== "saved") throw new Error("unavailable");
      // No narrative, contact details, public ledger URL, record ID or count is returned.
      return response({ ok: true }, 201);
    } catch {
      return response(
        {
          error:
            "Private report intake is not available. Please try again later.",
        },
        503,
      );
    }
  };
}
