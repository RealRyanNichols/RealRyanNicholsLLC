import assert from "node:assert/strict";
import test from "node:test";
import {
  BOOK_PURCHASE_EVENT,
  buildBookPurchaseEvent,
} from "../lib/book-buyer-automation";

test("buildBookPurchaseEvent matches the Resend event schema", () => {
  assert.deepEqual(
    buildBookPurchaseEvent({
      email: "  Reader@Example.com ",
      edition: "signed_paperback_preorder",
      orderId: "cs_live_123",
      amountCents: 7900,
    }),
    {
      event: BOOK_PURCHASE_EVENT,
      email: "reader@example.com",
      payload: {
        edition: "signed_paperback_preorder",
        order_id: "cs_live_123",
        order_value: 79,
      },
    },
  );
});

test("buildBookPurchaseEvent safely normalizes fallback values", () => {
  assert.deepEqual(
    buildBookPurchaseEvent({
      email: "reader@example.com",
      edition: null,
      orderId: "cs_live_456",
      amountCents: -50,
    })?.payload,
    {
      edition: "unknown",
      order_id: "cs_live_456",
      order_value: 0,
    },
  );
});

test("buildBookPurchaseEvent refuses to emit without a buyer email", () => {
  assert.equal(
    buildBookPurchaseEvent({
      email: " ",
      edition: "early_release_digital",
      orderId: "cs_live_789",
      amountCents: 1776,
    }),
    null,
  );
});
