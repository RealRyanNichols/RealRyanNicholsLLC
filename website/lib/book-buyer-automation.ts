import { Resend } from "resend";

export const BOOK_PURCHASE_EVENT = "fighting_shadows.purchased";

export type BookPurchaseEventInput = {
  email: string | null | undefined;
  edition: string | null | undefined;
  orderId: string;
  amountCents: number | null | undefined;
};

export type BookPurchaseEventPayload = {
  event: typeof BOOK_PURCHASE_EVENT;
  email: string;
  payload: {
    edition: string;
    order_id: string;
    order_value: number;
  };
};

export type BookBuyerAutomationResult =
  | { sent: true }
  | { sent: false; reason: "missing_email" | "not_configured" }
  | { sent: false; reason: "send_failed"; error: string };

export function buildBookPurchaseEvent(
  input: BookPurchaseEventInput,
): BookPurchaseEventPayload | null {
  const email = input.email?.trim().toLowerCase();
  if (!email) return null;

  return {
    event: BOOK_PURCHASE_EVENT,
    email,
    payload: {
      edition: input.edition?.trim() || "unknown",
      order_id: input.orderId,
      order_value: Math.max(0, Math.round(input.amountCents ?? 0)) / 100,
    },
  };
}

function errorText(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Resend returned an event error.";
}

/**
 * Best-effort bridge from the canonical paid Stripe event into Resend.
 * Resend creates the contact when needed and starts every enabled Automation
 * whose trigger matches BOOK_PURCHASE_EVENT. Email delivery must never block
 * the paid order from being recorded in Supabase.
 */
export async function triggerBookBuyerAutomation(
  input: BookPurchaseEventInput,
): Promise<BookBuyerAutomationResult> {
  const event = buildBookPurchaseEvent(input);
  if (!event) return { sent: false, reason: "missing_email" };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey?.trim()) return { sent: false, reason: "not_configured" };

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.events.send(event);
    if (error) {
      return { sent: false, reason: "send_failed", error: errorText(error) };
    }
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: "send_failed", error: errorText(error) };
  }
}
