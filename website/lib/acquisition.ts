export type AcquisitionAttribution = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  clickId: string | null;
  landingPath: string;
  referrerHost: string | null;
};

const STORAGE_KEY = "rrn_first_touch_attribution";
const MAX_VALUE = 180;

function clean(value: string | null | undefined, max = MAX_VALUE): string | null {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, max) : null;
}

function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    return clean(new URL(referrer).hostname.replace(/^www\./, ""));
  } catch {
    return null;
  }
}

function currentAttribution(): AcquisitionAttribution | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const clickId =
    params.get("twclid") ?? params.get("fbclid") ?? params.get("gclid");
  const source = params.get("utm_source");
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");
  const content = params.get("utm_content");
  const term = params.get("utm_term");
  const hasCampaign = Boolean(
    source || medium || campaign || content || term || clickId,
  );
  if (!hasCampaign && !document.referrer) return null;

  return {
    source: clean(source),
    medium: clean(medium),
    campaign: clean(campaign),
    content: clean(content),
    term: clean(term),
    clickId: clean(clickId),
    landingPath: `${window.location.pathname}${window.location.search}`.slice(
      0,
      360,
    ),
    referrerHost: referrerHost(document.referrer),
  };
}

function isAttribution(value: unknown): value is AcquisitionAttribution {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as AcquisitionAttribution).landingPath === "string",
  );
}

/** Save the first campaign touch for later pages in the same browser. */
export function captureFirstTouchAttribution(): AcquisitionAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    if (existing) {
      const parsed: unknown = JSON.parse(existing);
      if (isAttribution(parsed)) return parsed;
    }
    const attribution = currentAttribution();
    if (attribution) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    }
    return attribution;
  } catch {
    return currentAttribution();
  }
}

/** Return the persisted first touch, capturing the current URL if needed. */
export function getFirstTouchAttribution(): AcquisitionAttribution | null {
  return captureFirstTouchAttribution();
}
