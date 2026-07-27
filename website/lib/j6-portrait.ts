const CLEARED_RIGHTS = new Set([
  "owner-approved",
  "verified-public-domain",
  "licensed",
]);

const DOCUMENTED_EDITORIAL_RIGHTS = "documented-editorial-use";

export type J6PortraitKind = "cleared" | "editorial" | "placeholder";

type J6PortraitRecord = {
  photo_url: string | null;
  photo_is_placeholder: boolean;
  photo_identity_status: string | null;
  photo_rights_status: string | null;
  photo_verified_at: string | null;
};

function hasVerifiedPortraitIdentity(person: J6PortraitRecord): boolean {
  return Boolean(
    person.photo_url &&
      !person.photo_is_placeholder &&
      person.photo_identity_status === "verified" &&
      person.photo_verified_at,
  );
}

export function getJ6PortraitKind(
  person: J6PortraitRecord,
): J6PortraitKind {
  if (!hasVerifiedPortraitIdentity(person)) return "placeholder";

  if (
    person.photo_rights_status &&
    CLEARED_RIGHTS.has(person.photo_rights_status)
  ) {
    return "cleared";
  }

  if (person.photo_rights_status === DOCUMENTED_EDITORIAL_RIGHTS) {
    return "editorial";
  }

  return "placeholder";
}

export function isClearedJ6Portrait(person: J6PortraitRecord): boolean {
  return getJ6PortraitKind(person) === "cleared";
}

export function isDocumentedEditorialJ6Portrait(
  person: J6PortraitRecord,
): boolean {
  return getJ6PortraitKind(person) === "editorial";
}

export function hasDisplayableJ6Portrait(
  person: J6PortraitRecord,
): boolean {
  return getJ6PortraitKind(person) !== "placeholder";
}
