# Monetization Lane: Crypto Rails

Status: draft for Claude implementation planning
Research date: 2026-05-31
Scope: payment-rail research and implementation notes only. No tradable token, no return promise, no investment language.

## Recommendation

Use Stripe stablecoin payments first because the site already creates Stripe Checkout Sessions for store orders. If Stripe approves the Crypto payment method, the current checkout path can likely show crypto through Stripe dynamic payment methods without adding a second checkout system.

Treat Coinbase Commerce as a fallback only through its current successor path, Coinbase Business. Coinbase's public migration docs say Coinbase Commerce was unified into Coinbase Business and that the old Commerce portal became inaccessible after 2026-03-31. Do not build a new integration against the legacy Commerce portal.

## Stripe stablecoin payments

### Current availability

Stripe's stablecoin payment docs say:

- Customers can pay with stablecoins globally, but currently only US businesses can accept stablecoin payments.
- The business must have an active Stripe account.
- Stripe requires business verification/KYC before processing payments. Its support docs say Stripe verifies business identification, website ownership, bank account information, business supportability, and overall risk.
- Stripe may request additional information or documents during review.

Sources:

- Stripe, "Accept stablecoin payments," accessed 2026-05-31: https://docs.stripe.com/payments/accept-stablecoin-payments?payment-ui=direct-api
- Stripe, "Stablecoin payments," accessed 2026-05-31: https://docs.stripe.com/payments/stablecoin-payments
- Stripe Support, "Business information requirements to use Stripe," accessed 2026-05-31: https://support.stripe.com/questions/business-information-requirements-to-use-stripe
- Stripe Support, "What do I need to do to verify my Stripe account?", accessed 2026-05-31: https://support.stripe.com/questions/what-do-i-need-to-do-to-verify-my-stripe-account

### Supported checkout surfaces

Stripe's docs list these supported surfaces:

| Surface | Use for RealRyanNichols.com? | Notes |
| --- | --- | --- |
| Payment Links | Later/manual fallback | Useful for one-off invoices or manually shared payment links. |
| Stripe Checkout | Yes | Current `/store/[slug]` checkout uses Checkout Sessions. |
| Elements / Payment Element | Not first | Useful if Claude later builds embedded checkout. |
| Payment Intents API | Not first | Use only if a custom checkout flow needs direct API control. |
| Billing invoices/subscriptions | Not for launch | Some Stripe docs describe invoice/subscription support through invoice collection methods, but this store is one-time service/digital/physical checkout first. Confirm recurring details in Dashboard before selling subscriptions. |

Source:

- Stripe, "Accept stablecoin payments," accessed 2026-05-31: https://docs.stripe.com/payments/accept-stablecoin-payments?payment-ui=direct-api

### Settlement, fees, and payment behavior

| Topic | Current source-backed note |
| --- | --- |
| Settlement | Stablecoin payments settle in the Stripe balance in USD. |
| Merchant crypto custody | Ryan does not have to hold or convert crypto for the Stripe path. |
| Fee | Stripe's public-preview crypto docs list 1.5% of the transaction amount in USD. Reconfirm in the Dashboard before publishing any fee statement because payment-method pricing can change. |
| Customer flow | Customer selects Crypto, gets redirected to `crypto.stripe.com`, connects a wallet, completes payment, and returns to the site. |
| Refunds | Stripe docs say refunds/partial refunds are supported; preview docs say crypto refunds go back as stablecoins to the customer's original wallet. |
| Disputes | Stripe's stablecoin payment method page says dispute support is not available. |
| Manual capture | Not supported. |
| Presentment / local currency | Stripe docs state USD is the default local currency for crypto. The current store products are USD Stripe prices. |

Sources:

- Stripe, "Stablecoin payments," accessed 2026-05-31: https://docs.stripe.com/payments/stablecoin-payments
- Stripe, "Stablecoin payments / Pay with Crypto," accessed 2026-05-31: https://docs.stripe.com/crypto/pay-with-crypto
- Stripe legal, "Stablecoin Payments," accessed 2026-05-31: https://stripe.com/legal/stablecoin-payments

### Exact Stripe enablement steps

1. Confirm the live Stripe account is active and not blocked by outstanding verification.
2. Confirm the public site has clear service/product descriptions, customer support contact, refund/fulfillment terms, and privacy/terms pages. Stripe can review the business URL and fulfillment policies.
3. In Stripe Dashboard, go to `Settings -> Payments -> Payment methods`.
4. Request or enable the `Crypto` / `Stablecoin and Crypto` payment method.
5. Fill in any requested business information and accept Stripe's stablecoin/crypto payment terms.
6. Wait for Stripe review. If the payment method shows `Pending`, answer any Stripe follow-up.
7. After approval, keep dynamic payment methods enabled.
8. Run a low-dollar live test product if Stripe allows a real checkout test; otherwise use Stripe test mode to confirm the existing store checkout still works.
9. Confirm the resulting payment lands as USD in Stripe Dashboard.
10. Confirm order fulfillment still relies on webhooks/server verification, not only the browser redirect.

### What Claude changes in code for Stripe

Current code observation: `website/app/api/checkout/order/route.ts` creates a Stripe Checkout Session and does not pass a hard-coded `payment_method_types` array. That is good for dynamic payment methods.

Recommended Claude code checklist:

- No new Stripe env vars should be required if Stripe is already live.
- Keep required existing env vars:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - site URL env/config already used by `SITE.url`
- Do not hard-code `payment_method_types: ["card"]`.
- Prefer leaving payment methods dynamic so Stripe can show Crypto only to eligible customers.
- Confirm every Stripe Price used by store rows is USD.
- Make sure order creation/fulfillment listens to `checkout.session.completed` and/or payment-status webhooks, not only success-page redirects.
- Add admin copy only after approval: "Crypto checkout is available through Stripe stablecoin payments where Stripe shows it."
- Do not say "pay with Bitcoin" for the Stripe route unless Stripe's dashboard actually supports it for this account. Public docs center the payment method on stablecoins.

## Coinbase Commerce fallback - current successor is Coinbase Business

### Current availability

Coinbase's migration docs say Coinbase Commerce is being unified with Coinbase Business and that merchants had to transition by 2026-03-31. The old Commerce portal is described as inaccessible after that date.

For a US LLC, the practical fallback is Coinbase Business, not legacy Coinbase Commerce.

Sources:

- Coinbase Help, "Transitioning from Coinbase Commerce to Coinbase Business," accessed 2026-05-31: https://help.coinbase.com/en/transitioning-from-coinbase-commerce-to-coinbase-business
- Coinbase Help, "Coinbase Business," accessed 2026-05-31: https://help.coinbase.com/en/coinbase/other-topics/business/business-overview

### Eligibility and KYC/KYB

Coinbase Business public docs say:

- Coinbase Business is currently available to US and Singapore C Corporations and LLCs, with more countries coming later.
- Application requires business details, ownership information, and compliance documentation.
- Coinbase verifies both the business (KYB) and beneficial owners/control persons (KYC).
- Application materials may include government ID, business formation documents, business bank statements, tax identification, and a business description.

Sources:

- Coinbase Help, "Coinbase Business application requirements," accessed 2026-05-31: https://help.coinbase.com/en/coinbase/other-topics/business/application-requirements
- Coinbase Help, "Applying for a Coinbase business account," accessed 2026-05-31: https://help.coinbase.com/en/pro/getting-started/other/applying-for-a-coinbase-business-account
- Coinbase Help, "Coinbase Business," accessed 2026-05-31: https://help.coinbase.com/en/coinbase/other-topics/business/business-overview

### Supported payment surfaces

| Surface | Use for RealRyanNichols.com? | Notes |
| --- | --- | --- |
| Coinbase Business Payment Links | Yes as manual fallback | Create one-time links from Coinbase Business dashboard or API. |
| Coinbase Business Invoices | Yes for custom/manual work | Good for higher-ticket work, custom story packages, or manual quotes. |
| Payment Link API | Later | Can create payment links from the website after Claude adds a separate integration. |
| Checkout API | Later | Current docs expose a checkout endpoint, but Stripe remains the cleaner first rail. |
| Payment Acceptance API | Not first | More relevant for platforms/PSPs/enterprise payment acceptance. |

Sources:

- Coinbase Help, "Create Payment Links and Invoices for Coinbase Business," accessed 2026-05-31: https://help.coinbase.com/en/coinbase/other-topics/business/payment-links-invoices
- Coinbase Developer, "Create Payment Link," accessed 2026-05-31: https://docs.cdp.coinbase.com/api-reference/business-api/rest-api/payment-links/create-payment-link
- Coinbase Developer, "Create Checkout," accessed 2026-05-31: https://docs.cdp.coinbase.com/api-reference/business-api/rest-api/checkouts/create-checkout
- Coinbase Developer, "Payment Acceptance overview," accessed 2026-05-31: https://docs.cdp.coinbase.com/payments/payment-acceptance/overview

### Settlement, fees, and payment behavior

| Topic | Current source-backed note |
| --- | --- |
| Accepted payment currency | Coinbase Business Payment Links / Invoices docs emphasize stablecoin payments, especially USDC. |
| Networks | Coinbase's help docs list USDC across Ethereum, Base, Polygon, Optimism, and Arbitrum for payment links/invoices; another payment-link page emphasizes USDC on Base. Confirm exact network options in the live account. |
| Settlement | Funds settle to Coinbase Business in USDC. Coinbase says merchants can opt to receive incoming USDC as USD through an automations toggle in settings. |
| Bank withdrawal | Coinbase Business customers can withdraw funds to a bank account through ACH or wire where supported. |
| Fees | Coinbase public help pages are inconsistent: one current page says Coinbase Business charges a fee on each completed payment and to sign in to view current fees; another payment-link help page says no merchant fees for payment links. Treat fees as account-specific and verify in the Coinbase Business dashboard before publishing. |
| Link reuse | Payment links are one-time-use in the Coinbase Help docs. |
| Expiration | A Coinbase payment-link help page says links remain valid for one year; API-created links can include an `expiresAt` field. |

Sources:

- Coinbase Help, "Create Payment Links and Invoices for Coinbase Business," accessed 2026-05-31: https://help.coinbase.com/en/coinbase/other-topics/business/payment-links-invoices
- Coinbase Help, "Payment links for Coinbase Business," accessed 2026-05-31: https://help.coinbase.com/en/coinbase/trading-and-funding/coinbase-business/payment-links
- Coinbase Developer, "Create Payment Link," accessed 2026-05-31: https://docs.cdp.coinbase.com/api-reference/business-api/rest-api/payment-links/create-payment-link
- Coinbase Help, "Automate withdrawals and liquidation for your Coinbase Business account," accessed 2026-05-31: https://help.coinbase.com/en/coinbase/other-topics/business/automate-withdrawals-liquidation

### Exact Coinbase Business enablement steps

1. Apply for Coinbase Business using an email address not already tied to a personal Coinbase account, if Coinbase requires that for the application.
2. Prepare the LLC materials before applying:
   - valid government ID for the applicant/control person/owners as required,
   - LLC formation document,
   - EIN/tax ID,
   - business bank statement,
   - business description,
   - website URL and customer-facing service descriptions.
3. Complete Coinbase Business KYB/KYC review.
4. After approval, open Coinbase Business and go to `Payments`.
5. Use `Payment Links` for one-off store-style payments or `Invoice` for custom work.
6. In Settings, configure automations if Ryan wants incoming USDC converted/settled as USD.
7. Create one test Payment Link manually for a small amount.
8. Pay it from a wallet or Coinbase account, then confirm:
   - payment status,
   - USDC receipt,
   - USD conversion if enabled,
   - bank withdrawal path.
9. Only after manual flow works, ask Claude to add a website integration.

### What Claude changes in code for Coinbase Business

Use only if Stripe crypto approval is slow or Ryan wants a second checkout rail.

Likely env vars:

- `COINBASE_CDP_KEY_NAME`
- `COINBASE_CDP_PRIVATE_KEY`
- `COINBASE_BUSINESS_WEBHOOK_SECRET`
- `COINBASE_BUSINESS_WEBHOOK_ID` if Claude stores the subscription id

Implementation notes:

- Use CDP API keys to generate short-lived JWT bearer tokens server-side.
- Never expose the private key to the browser.
- Create a Coinbase payment link server-side from an existing order row.
- Store the Coinbase payment link id and status on the order record or a payment-attempt record.
- Redirect the buyer to the Coinbase-hosted payment URL.
- Add a Coinbase webhook endpoint and verify the webhook signature before marking an order paid.
- Map Coinbase status changes to existing order statuses carefully. Do not fulfill from the browser return URL.
- Keep Stripe as the default checkout unless the customer selects "Pay with USDC" or unless the product is manually invoiced.

Sources:

- Coinbase Developer, "Business API Key Authentication," accessed 2026-05-31: https://docs.cdp.coinbase.com/coinbase-business/authentication-authorization/api-key-authentication
- Coinbase Developer, "Payment Link webhooks," accessed 2026-05-31: https://docs.cdp.coinbase.com/coinbase-business/payment-link-apis/webhooks

## Public copy guardrails

Safe:

- "Pay by card today. Stablecoin checkout can be added once the processor approves it."
- "Crypto starts here as a payment rail, not as an investment product."
- "If you pay in stablecoin through Stripe, Ryan receives settlement through Stripe in USD."
- "If Coinbase Business is used, payments are handled through Coinbase's business payment tools."

Do not publish:

- "Invest in Ryan."
- "Buy credits before they go up."
- "This token will appreciate."
- "Passive income."
- "Profit sharing."
- "Guaranteed returns."
- "No taxes."
- "No KYC."
