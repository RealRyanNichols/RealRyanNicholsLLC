import { createHash } from "node:crypto";

export const FIGHTING_SHADOWS_PRODUCT_SLUGS = {
  digital: "early_release_digital",
  founding: "founding_supporter_edition",
  paperback: "signed_paperback_preorder",
} as const;

export type BookEdition = "paperback" | "hardcover" | "unresolved";

export type FulfillmentKeys = {
  docRef: string;
  idempotencyKey: string;
};

export type StripeShippingDetails = {
  name: string | null;
  email: string | null;
  phone: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
  } | null;
};

export type BookvaultOrderAddress = {
  Addressee: string;
  Address1: string;
  Address2?: string;
  Town: string;
  County: string;
  Postcode?: string;
  Country: { ISO_Code: string };
  TelNumber?: string;
  Email?: string;
};

export function isPhysicalBookProduct(productSlug: string): boolean {
  return (
    productSlug === FIGHTING_SHADOWS_PRODUCT_SLUGS.paperback ||
    productSlug === FIGHTING_SHADOWS_PRODUCT_SLUGS.founding
  );
}

export function editionForProduct(productSlug: string): BookEdition | null {
  if (productSlug === FIGHTING_SHADOWS_PRODUCT_SLUGS.paperback) {
    return "paperback";
  }
  if (productSlug === FIGHTING_SHADOWS_PRODUCT_SLUGS.founding) {
    return "unresolved";
  }
  return null;
}

export function buildFulfillmentKeys(stripeCheckoutSessionId: string): FulfillmentKeys {
  const digest = createHash("sha256")
    .update(`fighting-shadows:${stripeCheckoutSessionId}`)
    .digest("hex");

  return {
    docRef: `FS-${digest.slice(0, 24).toUpperCase()}`,
    idempotencyKey: `bookvault_${digest}`,
  };
}

export function isValidIsbn13(value: string): boolean {
  const isbn = value.replace(/[-\s]/g, "");
  if (!/^\d{13}$/.test(isbn)) return false;

  const weighted = isbn
    .slice(0, 12)
    .split("")
    .reduce((sum, digit, index) => {
      return sum + Number(digit) * (index % 2 === 0 ? 1 : 3);
    }, 0);
  const expectedCheckDigit = (10 - (weighted % 10)) % 10;
  return expectedCheckDigit === Number(isbn[12]);
}

export function isbnForEdition(
  edition: BookEdition,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const value =
    edition === "paperback"
      ? env.BOOKVAULT_PAPERBACK_ISBN
      : edition === "hardcover"
        ? env.BOOKVAULT_HARDCOVER_ISBN
        : null;
  if (!value) return null;

  const normalized = value.replace(/[-\s]/g, "");
  return isValidIsbn13(normalized) ? normalized : null;
}

export function mapStripeShippingToBookvault(
  shipping: StripeShippingDetails,
): BookvaultOrderAddress {
  const address = shipping.address;
  if (
    !shipping.name ||
    !address?.line1 ||
    !address.city ||
    !address.state ||
    !address.country
  ) {
    throw new Error("The paid order is missing a complete shipping address.");
  }

  const mapped: BookvaultOrderAddress = {
    Addressee: shipping.name,
    Address1: address.line1,
    Town: address.city,
    County: address.state,
    Country: { ISO_Code: address.country.toUpperCase() },
  };

  if (address.line2) mapped.Address2 = address.line2;
  if (address.postal_code) mapped.Postcode = address.postal_code;
  if (shipping.phone) mapped.TelNumber = shipping.phone;
  if (shipping.email) mapped.Email = shipping.email;

  return mapped;
}
