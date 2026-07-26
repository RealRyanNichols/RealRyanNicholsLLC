const CLEARED_RIGHTS = new Set([
  "owner-approved",
  "verified-public-domain",
  "licensed",
]);

export function isClearedJ6Portrait(person: {
  photo_url: string | null;
  photo_is_placeholder: boolean;
  photo_identity_status: string | null;
  photo_rights_status: string | null;
  photo_verified_at: string | null;
}): boolean {
  return Boolean(
    person.photo_url &&
      !person.photo_is_placeholder &&
      person.photo_identity_status === "verified" &&
      person.photo_verified_at &&
      person.photo_rights_status &&
      CLEARED_RIGHTS.has(person.photo_rights_status),
  );
}
