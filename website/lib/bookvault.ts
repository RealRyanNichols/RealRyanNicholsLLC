import type { BookvaultOrderAddress } from "./book-fulfillment";

const DEFAULT_API_BASE_URL = "https://api.bookvault.app/v3";
const REQUEST_TIMEOUT_MS = 20_000;

export type BookvaultPaymentMethod = "Credit" | "Upfront" | "Draft" | "Saved";
export type BookvaultProductionStatus =
  | "Created"
  | "Acknowledged"
  | "SentToPrint"
  | "Batched"
  | "Printed"
  | "Dispatched"
  | "Invoiced";

export type BookvaultOrderRequest = {
  DocRef: string;
  DispatchRequest: {
    RequestedService:
      | "Quickest"
      | "Cheapest"
      | "Specified"
      | "Tracked"
      | "NotSpecified"
      | "CheapestTracked";
    RequestedServID?: number[];
  };
  Address: BookvaultOrderAddress;
  OrderLines: Array<{
    LineNumber: number;
    ISBN: string;
    Quantity: number;
    TempID?: string;
  }>;
  PartnerID?: number;
  ProductionLevel?: "Standard" | "Express" | "Priority" | "Bespoke";
  CharityRoundup?: boolean;
};

export type BookvaultOrderResponse = BookvaultOrderRequest & {
  PodRef?: number;
  CriticalError?: boolean;
  Progress?: {
    Status?: BookvaultProductionStatus;
    Created?: string;
    Acknowledged?: string;
    PrintSent?: string;
    Batched?: string;
    Printed?: string;
    Dispatched?: string;
    Invoiced?: string;
  };
  OrderCost?: {
    ProductionCost?: number;
    DispatchCost?: number;
    Surcharges?: number;
    ExtrasCost?: number;
    Discount?: number;
    GrandTotal?: number;
    Tax?: number;
  };
  Tracking?: {
    Tracked?: boolean;
    TrackingNumber?: string;
    CombinedURL?: string;
    ServName?: string;
    ServDetail?: string;
  };
  Messages?: Array<Record<string, unknown>>;
};

export type LocalBookvaultStatus =
  | "submitted"
  | "acknowledged"
  | "sent_to_print"
  | "batched"
  | "printed"
  | "dispatched"
  | "invoiced";

export class BookvaultError extends Error {
  constructor(
    message: string,
    public readonly status: number | null = null,
  ) {
    super(message);
    this.name = "BookvaultError";
  }
}

export function isBookvaultConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.BOOKVAULT_API_KEY);
}

export function isBookvaultReleaseEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.BOOKVAULT_FULFILLMENT_ENABLED === "true";
}

export function configuredBookvaultPaymentMethod(
  env: NodeJS.ProcessEnv = process.env,
): Exclude<BookvaultPaymentMethod, "Draft"> | null {
  const value = env.BOOKVAULT_PAYMENT_METHOD;
  if (value === "Credit" || value === "Upfront" || value === "Saved") {
    return value;
  }
  return null;
}

export function assertBookvaultReleaseAllowed(options: {
  releaseConfirmed: boolean;
  env?: NodeJS.ProcessEnv;
}): void {
  const env = options.env ?? process.env;
  if (!options.releaseConfirmed) {
    throw new BookvaultError("Bookvault release confirmation is required.");
  }
  if (!isBookvaultReleaseEnabled(env)) {
    throw new BookvaultError("Bookvault fulfillment is locked by configuration.");
  }
  if (!configuredBookvaultPaymentMethod(env)) {
    throw new BookvaultError(
      "A non-draft Bookvault payment method must be configured before release.",
    );
  }
}

export function localStatusForBookvault(
  status: BookvaultProductionStatus | undefined,
): LocalBookvaultStatus {
  switch (status) {
    case "Acknowledged":
      return "acknowledged";
    case "SentToPrint":
      return "sent_to_print";
    case "Batched":
      return "batched";
    case "Printed":
      return "printed";
    case "Dispatched":
      return "dispatched";
    case "Invoiced":
      return "invoiced";
    default:
      return "submitted";
  }
}

async function bookvaultRequest<T>(
  path: string,
  init: RequestInit = {},
  env: NodeJS.ProcessEnv = process.env,
): Promise<T> {
  const apiKey = env.BOOKVAULT_API_KEY;
  if (!apiKey) throw new BookvaultError("BOOKVAULT_API_KEY is not configured.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const baseUrl = (env.BOOKVAULT_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        Authorization: `basic ${apiKey}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });

    if (response.status === 404) {
      throw new BookvaultError("Bookvault order not found.", 404);
    }
    if (!response.ok) {
      throw new BookvaultError(`Bookvault request failed with status ${response.status}.`, response.status);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof BookvaultError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new BookvaultError("Bookvault request timed out.");
    }
    throw new BookvaultError("Bookvault request failed before a response was received.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function getBookvaultOrderByDocRef(
  docRef: string,
): Promise<BookvaultOrderResponse | null> {
  try {
    return await bookvaultRequest<BookvaultOrderResponse>(
      `/Order?DocRef=${encodeURIComponent(docRef)}`,
    );
  } catch (error) {
    if (error instanceof BookvaultError && error.status === 404) return null;
    throw error;
  }
}

export function validateBookvaultOrder(
  order: BookvaultOrderRequest,
): Promise<BookvaultOrderResponse> {
  return bookvaultRequest<BookvaultOrderResponse>(
    "/ValidateOrder?type=FullButPayment",
    { method: "POST", body: JSON.stringify(order) },
  );
}

export function createBookvaultOrder(
  order: BookvaultOrderRequest,
  options: { releaseConfirmed: boolean },
): Promise<BookvaultOrderResponse> {
  assertBookvaultReleaseAllowed(options);
  const payMethod = configuredBookvaultPaymentMethod();
  if (!payMethod) {
    throw new BookvaultError("Bookvault payment method is not configured.");
  }
  return bookvaultRequest<BookvaultOrderResponse>(
    `/Order?payMethod=${encodeURIComponent(payMethod)}`,
    { method: "POST", body: JSON.stringify(order) },
  );
}
