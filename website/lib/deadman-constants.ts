export const DEADMAN_QUEUE_CATEGORY = "deadman-release";
export const DEADMAN_STATE_SLUG = "system-deadman-switch-state";
export const DEADMAN_RELEASE_INTERVAL_MINUTES = 60;
export const DEADMAN_RELEASE_BATCH_SIZE = 1;

export const DEADMAN_CONFIRMATION_TYPES = [
  "official_booking_record",
  "filed_court_order",
  "attorney_or_designated_contact",
  "authenticated_contact_from_custody",
  "custodial_agency_confirmation",
  "credible_current_reporting",
  "authenticated_admin_confirmation",
] as const;

export type DeadmanConfirmationType =
  (typeof DEADMAN_CONFIRMATION_TYPES)[number];

export const DEADMAN_CONFIRMATION_LABELS: Record<
  DeadmanConfirmationType,
  string
> = {
  official_booking_record: "official booking or custody record",
  filed_court_order: "filed court order or docket record",
  attorney_or_designated_contact:
    "confirmation from counsel or a designated family contact",
  authenticated_contact_from_custody:
    "direct authenticated communication from custody",
  custodial_agency_confirmation: "direct confirmation from the custodial agency",
  credible_current_reporting:
    "corroborated current reporting from established news outlets",
  authenticated_admin_confirmation:
    "authenticated administrator confirmation",
};
