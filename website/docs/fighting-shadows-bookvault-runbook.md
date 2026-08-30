# Fighting Shadows Bookvault Fulfillment Runbook

This runbook covers paid physical orders for *Fighting Shadows*. It does not authorize a print order, a Bookvault charge, an ISBN purchase, a production migration, or a live deployment.

## Current release state

- Global fulfillment hold: on.
- Approved print-ready interior PDF: missing.
- Approved paperback cover PDF: missing.
- Approved hardcover cover PDF: missing.
- Paperback ISBN: not assigned.
- Hardcover ISBN: not assigned.
- Bookvault API credential: not created.
- Paperback proof: not ordered or approved.
- Hardcover proof: not ordered or approved.
- Founding Supporter binding: unresolved.

No existing paid order should be released while any of these gates remains open.

## Private order baseline

The private `book_orders` ledger is the source of truth for payment status. Current paid commitments are:

- 28 Early Release digital orders: no POD fulfillment.
- 15 Signed Paperback preorders: paperback fulfillment after proof approval.
- 3 Founding Supporter Edition orders: physical, but the binding must be confirmed before fulfillment.

Customer names, email addresses, phone numbers, and shipping addresses must not appear in logs, queue events, Bookvault references, GitHub, Vercel build output, or public pages.

## Data boundary

Supabase stores only the fulfillment state, edition, ISBN, quantity, hashed idempotency key, non-identifying Bookvault reference, costs, provider status, and tracking result. Stripe remains the source for the customer shipping address. At release time, the server retrieves that address from the paid Stripe Checkout Session and sends it directly to Bookvault in memory.

## Environment variables

Set these only in server-side Vercel environment settings. Never use a `NEXT_PUBLIC_` prefix.

```text
BOOKVAULT_API_KEY=
BOOKVAULT_PAPERBACK_ISBN=
BOOKVAULT_HARDCOVER_ISBN=
BOOKVAULT_PAYMENT_METHOD=
BOOKVAULT_FULFILLMENT_ENABLED=false
BOOKVAULT_CRON_SECRET=
```

Optional for a controlled test double only:

```text
BOOKVAULT_API_BASE_URL=https://api.bookvault.app/v3
```

`BOOKVAULT_PAYMENT_METHOD` must be explicitly chosen from `Credit`, `Upfront`, or `Saved` after the Bookvault account funding behavior is verified. `Draft` is intentionally rejected for automatic release because it does not prove a print order will proceed.

The Vercel worker is scheduled every 15 minutes. Each run reconciles the paid ledger, releases no more than one ready physical order, and polls existing provider orders for production and tracking updates. It remains inert while any release gate is locked. `BOOKVAULT_CRON_SECRET` may be omitted when the existing server-only `CRON_SECRET` is used.

Bookvault documents its API key as a one-time-visible credential generated under Bookvault Portal → Apps. Store it directly in Vercel; do not put it in a local note or Google Drive.

## Release protocol

1. Reconcile the private paid-order ledger against Stripe.
2. Resolve the Founding Supporter binding in writing.
3. Approve the final print-ready interior and both cover PDFs.
4. Assign and verify one ISBN per physical format.
5. Upload both titles to Bookvault and approve every automated file check.
6. Order one paperback proof and one hardcover proof.
7. Record proof approval in the private operations tracker.
8. Apply the fulfillment migration in a reviewed release.
9. Prepare the queue. This creates no Bookvault order and no charge.
10. Validate one internal test request against Bookvault.
11. Confirm the live Bookvault payment method and fund the account if required.
12. Enable the database release flag and `BOOKVAULT_FULFILLMENT_ENABLED=true` only during a supervised release.
13. Release one real order with the exact server-side confirmation phrase, verify the returned Bookvault reference and status, then pause and review. The admin screen intentionally has no bulk-release button.
14. Release the remaining reconciled paid orders in a controlled batch.

## Idempotency and retry rules

- Each queue record is unique by `book_order_id`.
- The provider `DocRef` and internal idempotency key are deterministic hashes of the Stripe Checkout Session ID. They contain no customer information.
- Before a retry creates an order, query Bookvault by `DocRef`. If an order already exists, update the local status instead of creating another one.
- Retry only timeouts, connection failures, and provider 5xx responses.
- Do not automatically retry invalid addresses, invalid ISBNs, missing titles, inactive titles, file errors, payment errors, or provider 4xx responses.
- Keep automatic retries bounded and send unresolved records to the failed-order queue.
- Never log the raw Bookvault request or response because it can contain the delivery address.

## Provider status map

Bookvault publishes these production states: Created, Acknowledged, SentToPrint, Batched, Printed, Dispatched, and Invoiced. Store the normalized local equivalents and sync tracking number, tracking URL, and shipping service when Bookvault supplies them.

## Proof approval checklist

- Correct trim size and page count.
- Interior margins, gutter, bleed, pagination, and blank pages.
- Chapter starts, headers, footers, image resolution, and grayscale behavior.
- Paperback spine width, barcode placement, and back-cover copy.
- Hardcover case-wrap dimensions, hinge/gutter safety, barcode placement, and back-cover copy.
- No private client information, unsupported allegations, placeholder text, or print marks.
- Title, subtitle, author, imprint, edition, and ISBN match the metadata exactly.
- Physical proof inspected under normal light with a written approve/reject record.

## Official Bookvault references

- API setup: https://help.bookvault.app/api-setup
- API documentation: https://api.bookvault.app/v3/docs
- Portal apps and API credentials: https://portal.bookvault.app/apps
