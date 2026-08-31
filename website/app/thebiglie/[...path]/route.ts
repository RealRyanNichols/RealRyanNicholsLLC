import { retiredPrivateContentResponse } from "@/lib/retired-private-content";

export const dynamic = "force-dynamic";

export function GET() {
  return retiredPrivateContentResponse();
}

export function HEAD() {
  return retiredPrivateContentResponse({ head: true });
}
