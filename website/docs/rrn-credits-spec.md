# RRN Credits Spec

Status: draft for Claude implementation planning
Date: 2026-05-31
Scope: non-transferable prepaid service credits only. No token, no coin, no transfer market, no appreciation language.

## Executive decision

RRN Credits should launch, if at all, as prepaid account credit for RealRyanNichols.com services. They are not crypto tokens. They are not transferable. They do not trade. They do not go up in price. They do not produce returns. They are just a simple way for supporters or clients to prepay for useful work.

The safest public framing:

> RRN Credits are prepaid service credit for RealRyanNichols.com. Use them toward calls, audits, story pages, evidence organization, owned-feed builds, and future site tools. They are not cash, not crypto, not an investment, and not transferable.

## What one credit buys

Recommended accounting unit:

- `1 RRN Credit = $1.00 of prepaid service value`.
- Credits redeem only for eligible RealRyanNichols.com services, digital downloads, and manual service invoices.
- Credits do not apply to taxes, shipping, third-party filing fees, outside software costs, payment processing fees, or donations unless counsel approves that structure.
- Credits cannot be cashed out.
- Credits cannot be sold, transferred, assigned, traded, pledged, or used as collateral.

## Launch credit packs

Start simple. No bonus credits at launch. Bonus credits can create accounting, refund, tax, and gift-card-law complexity.

| Slug | Public name | Price | Credits issued | Notes |
| --- | --- | ---: | ---: | --- |
| `rrn-credits-100` | 100 RRN Credits | $100 | 100 | Entry prepay. |
| `rrn-credits-250` | 250 RRN Credits | $250 | 250 | For people planning a story/audit. |
| `rrn-credits-500` | 500 RRN Credits | $500 | 500 | For evidence/story work. |
| `rrn-credits-1000` | 1,000 RRN Credits | $1,000 | 1,000 | For bigger case-prep/site work. |

## Redemption rules

- Credits can be redeemed only by the account that purchased them unless Ryan manually gifts credits to another account.
- Credits can be applied at checkout once Claude builds the redemption flow.
- Before automation exists, credits can be redeemed manually by Ryan against an invoice or service order.
- Credits are applied before a remaining card/crypto payment.
- If a product requires Ryan approval or scheduling, credits reserve payment value but do not guarantee Ryan can accept the job.
- Ryan may decline work that is unlawful, defamatory, harassing, abusive, unsafe, outside scope, or not aligned with Real Ryan Nichols LLC service terms.
- Credits cannot be used to purchase other credits.
- Credits cannot be used to buy a future tradable token.

## Expiry policy

Recommended public launch policy:

- Purchased credits do not expire unless the law allows a different policy and counsel approves it.
- Promotional/free credits may expire after 12 months if counsel approves the promotional terms.
- Internally, stale balances older than 24 months should be flagged for outreach/accounting review, not automatically erased.

Reason: prepaid credits can be treated like stored value/gift-card obligations in some states. Do not publish an expiration rule without counsel review.

## Refund policy

Recommended public refund blurb:

> RRN Credits are prepaid service credit. Unused purchased credits may be refunded to the original payment method within 14 days of purchase if no work has started. Once credits are applied to a service, order, custom review, writing assignment, evidence organization task, or owned-feed build, the used portion is not refundable. If Ryan declines a project before work begins, the unused credit balance remains available or may be refunded to the original payment method. Credits have no cash value outside RealRyanNichols.com and cannot be transferred, sold, or traded.

Internal rules:

- Refund only to the original payment method.
- Never refund more dollars than were paid.
- If any credits were purchased through a promotion, coupon, bonus, or bundle, calculate refundable value from actual cash paid, not face value.
- If credits were purchased with crypto/stablecoin through Stripe, follow Stripe's refund rail and disclose that the provider handles refund mechanics.
- If credits were purchased through Coinbase Business, refund mechanics must be confirmed in that account before selling credits through that rail.

## Accounting model

Minimum accounting rule:

Every credit purchase maps to an order row.

Recommended future data model for Claude:

| Object | Purpose |
| --- | --- |
| `products` row | Credit pack product, type `digital`, active only after terms are reviewed. |
| `orders` row | Cash sale record from Stripe/Coinbase/manual invoice. |
| `order_items` row | Product slug and amount purchased. |
| `credit_accounts` row | One balance per user/customer email. |
| `credit_ledger_entries` rows | Immutable ledger entries for purchase, redemption, refund, adjustment, expiration if ever allowed. |
| `service_orders` or existing order notes | Links credits to the service they were redeemed against. |

Ledger entry types:

- `purchase`
- `redemption`
- `refund`
- `manual_adjustment`
- `promotional_grant`
- `promotional_expiration`

Ledger requirements:

- Store amount in credits and corresponding dollar value.
- Store source order id for purchases.
- Store redemption order/service id for redemptions.
- Store admin id for manual adjustments.
- Never update ledger rows in place except for metadata corrections; append reversals instead.

## Public product copy

### Short card copy

RRN Credits
Prepaid service credit for calls, audits, story pages, evidence organization, and owned-feed builds. Not crypto. Not transferable. Not an investment.

### Product page copy

RRN Credits are a simple way to prepay for work on RealRyanNichols.com.

Use them toward eligible services like a strategy call, site/feed audit, receipt-driven story page, evidence organization sprint, case-prep timeline pack, or owned-feed build.

They are not a coin. They are not a token. They do not trade. They do not go up in value. They are just prepaid service credit for real work.

If you want to support the work without buying a service, use the support/donate page instead. If you want Ryan to do work for you, credits give you a clean balance to apply toward that work.

### Terms checkbox copy

I understand RRN Credits are prepaid service credits for RealRyanNichols.com only. They are not cash, not crypto, not an investment, not transferable, and not redeemable for cash except where required by law or allowed by the refund policy.

## Legal questions for counsel

- Are prepaid service credits considered gift cards, stored value, or money transmission under Texas law or any other applicable state law?
- Can purchased credits legally have no expiration, and should promotional credits use a different policy?
- What refund window is safest for service credits where work may begin quickly?
- Does offering credits through stablecoin payment rails create additional disclosures or tax handling requirements?
- Can supporters buy credits to gift to someone else, or does that increase stored-value/money-transmission risk?
- Should credits be available to anonymous donors/supporters, or only logged-in users with an email?
- What abandoned-property/escheatment rules could apply to unused balances?
- What exact public terms must be linked before checkout?

## Do-not-say list

Do not say:

- "Token"
- "Coin"
- "Trade"
- "Investment"
- "Buy before it goes up"
- "Reward yield"
- "Passive income"
- "Profit share"
- "Ownership stake"
- "Community coin"
- "Backed by Ryan"
- "Guaranteed value"

Say:

- "Prepaid service credit"
- "Use credits toward eligible RealRyanNichols.com services"
- "Not cash, not crypto, not an investment"
- "No legal advice, no guaranteed outcome"
