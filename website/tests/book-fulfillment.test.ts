import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFulfillmentKeys,
  editionForProduct,
  FIGHTING_SHADOWS_PRODUCT_SLUGS,
  isPhysicalBookProduct,
  isValidIsbn13,
  mapStripeShippingToBookvault,
} from "../lib/book-fulfillment";
import {
  assertBookvaultReleaseAllowed,
  BookvaultError,
  localStatusForBookvault,
} from "../lib/bookvault";

test("only paid print product slugs are classified as physical", () => {
  assert.equal(isPhysicalBookProduct(FIGHTING_SHADOWS_PRODUCT_SLUGS.paperback), true);
  assert.equal(isPhysicalBookProduct(FIGHTING_SHADOWS_PRODUCT_SLUGS.founding), true);
  assert.equal(isPhysicalBookProduct(FIGHTING_SHADOWS_PRODUCT_SLUGS.digital), false);
  assert.equal(editionForProduct(FIGHTING_SHADOWS_PRODUCT_SLUGS.paperback), "paperback");
  assert.equal(editionForProduct(FIGHTING_SHADOWS_PRODUCT_SLUGS.founding), "unresolved");
});

test("fulfillment references are deterministic and do not expose the Stripe session id", () => {
  const sessionId = "cs_live_private_value";
  const first = buildFulfillmentKeys(sessionId);
  const second = buildFulfillmentKeys(sessionId);
  assert.deepEqual(first, second);
  assert.equal(first.docRef.startsWith("FS-"), true);
  assert.equal(first.docRef.includes(sessionId), false);
  assert.equal(first.idempotencyKey.includes(sessionId), false);
});

test("ISBN-13 validation catches malformed and invalid check digits", () => {
  assert.equal(isValidIsbn13("9780306406157"), true);
  assert.equal(isValidIsbn13("978-0-306-40615-7"), true);
  assert.equal(isValidIsbn13("9780306406158"), false);
  assert.equal(isValidIsbn13("123"), false);
});

test("shipping details are mapped only in memory for a provider request", () => {
  const address = mapStripeShippingToBookvault({
    name: "Test Reader",
    email: "reader@example.test",
    phone: null,
    address: {
      line1: "100 Test Street",
      line2: null,
      city: "Longview",
      state: "TX",
      postal_code: "75601",
      country: "US",
    },
  });
  assert.deepEqual(address.Country, { ISO_Code: "US" });
  assert.equal(address.Town, "Longview");
});

test("live release requires confirmation, an enable switch, and a non-draft payment method", () => {
  assert.throws(
    () => assertBookvaultReleaseAllowed({ releaseConfirmed: false, env: {} }),
    BookvaultError,
  );
  assert.throws(
    () =>
      assertBookvaultReleaseAllowed({
        releaseConfirmed: true,
        env: { BOOKVAULT_FULFILLMENT_ENABLED: "false" },
      }),
    BookvaultError,
  );
  assert.doesNotThrow(() =>
    assertBookvaultReleaseAllowed({
      releaseConfirmed: true,
      env: {
        BOOKVAULT_FULFILLMENT_ENABLED: "true",
        BOOKVAULT_PAYMENT_METHOD: "Saved",
      },
    }),
  );
});

test("Bookvault production states normalize to private queue states", () => {
  assert.equal(localStatusForBookvault("Created"), "submitted");
  assert.equal(localStatusForBookvault("SentToPrint"), "sent_to_print");
  assert.equal(localStatusForBookvault("Dispatched"), "dispatched");
});
