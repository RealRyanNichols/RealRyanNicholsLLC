# Usage receipts, September 2026

Gathered by Claude Cowork on 2026-09-07 (evening, CDT) for Ryan Nichols, on ryans-macbook-pro-local.

Read-only. Nothing was bought, no plan was changed, no setting was toggled.

---

## READ THIS FIRST: what the ask actually is

Ryan corrected the premise mid-gathering, and it changes the whole page. In his words:

> "It's not the $200 per month. I'm already paying the $200 per month for Claude, $200 per month for ChatGPT, $40 a month for X. I'll pay that out of my pocket. I'm asking them that when I run out, because I usually run out of that usage in half a week, I want them to buy my overage usage, my extra tokens, where I can turn that on and just have a steady drip or faucet of tokens that I can pull from."

So the /fuel page is **not** asking anyone to cover a subscription. It is asking them to fund **overage usage credits** that sit in his account and get spent when the included weekly allowance runs dry.

**The single most important finding in this whole report: the faucet is currently closed.**

On claude.ai right now: usage credits are toggled **OFF**, the current balance is **$0.00**, auto-reload is **Off**, and the monthly spend limit is set to **$40.00**. If a supporter sent money today, there is nothing on the account for it to flow into, and even once switched on it would stop at $40 for the month.

Three things have to be true before /fuel can honestly take a dollar:
1. Usage credits enabled on claude.ai.
2. The monthly spend limit raised from $40 to something matching the ask.
3. A stated, checkable mapping from dollars to work, which section "What a dollar buys" below now provides.

---

## Summary table

| # | Question | Answer | Source and date | Grade |
|---|---|---|---|---|
| 1 | Claude plan and monthly price | **Max plan, 20x more usage than Pro.** $200.00 plus $10.00 Texas tax = **$210.00** invoiced monthly. Auto-renews Sep 23, 2026. | claude.ai Settings > Billing, and the price/tax tooltip on the Aug 23 invoice. 2026-09-07 | FACT |
| 2 | Claude usage panel | Current session **21% used**, resets in 2 hr 34 min. Weekly **All models 61% used**, weekly **Fable 73% used**, both reset **Wed 1:00 PM**. Banner: "Your limits are temporarily boosted. Your weekly Claude Code limit is 50% higher through September 13." | claude.ai Settings > Usage. 2026-09-07 | FACT |
| 2b | Does Fable have its own weekly line | **Yes.** Fable is a separate weekly bar from All models, and it is the one running hotter (73% vs 61%). | Same screen | FACT |
| 3 | Usage credits on or off, cap, month-to-date | **OFF.** Month-to-date spend **$0.00** (0% used, resets Oct 1). Monthly spend limit **$40.00**. Current balance **$0.00**. Auto-reload **Off**. | claude.ai Settings > Usage. 2026-09-07 | FACT |
| 4 | Anthropic charges Jun to Sep 2026 | **Jun 13** $18.95 usage credits · **Jun 23** $210.00 subscription · **Jul 23** $210.00 subscription · **Aug 23** $210.00 subscription · **September: none yet**, next renewal Sep 23. | claude.ai Settings > Billing invoice list; Stripe invoice E2WKSL39-0007 opened for the Jun 13 line. 2026-09-07 | FACT |
| 4b | What the $18.95 was | Line item reads **"Auto recharge extra usage, Individual plan"**, $18.05 plus $0.90 Texas tax (6.25%). This is the exact overage-credit mechanism the /fuel page is meant to fund, and it has already worked once on this account. | Stripe invoice E2WKSL39-0007 | FACT |
| 5 | Credit pricing and daily cap, quoted | Pricing: **"Usage credits are billed at standard API rates; see our pricing page for details."** Daily cap: **"Note: There is a daily redemption limit of $2000."** | support.claude.com, "Manage usage credits for paid Claude plans", article 12429409. 2026-09-07 | FACT |
| 6 | ccusage totals Aug 1 to today | See the token table below. Headline: **$3,567.73** at API list rates, **20 active days**, avg **$178.39** per active day. **All of it is Codex and Hermes. Claude Code recorded zero.** | `npx ccusage@latest daily --since 20260801` on the Mac. 2026-09-07 | FACT |
| 6b | Why there is no Claude Code number | `npx ccusage@latest claude daily --since 20260801` returns **0 active days, 0 tokens, $0.00**. `~/.claude/projects` was last written **Jul 18**. Ryan's Claude work runs in Cowork and claude.ai, which do not write local usage logs, so ccusage cannot see it. | Same run, plus `ls -la ~/.claude` | FACT |
| 7 | Project folders in ~/.claude/projects | **8 folders**, 138 .jsonl files, none newer than Jul 18 2026. Stale. Names not reproduced here, several contain the account email. | `ls ~/.claude/projects` on the Mac. 2026-09-07 | FACT |
| 8 | ChatGPT plan and price | **ChatGPT Pro 20x.** Charged **$212.80** monthly (that is $200 plus Texas tax). Auto-renews **Sep 25, 2026**. Wallet balance **$0.00**. | chatgpt.com Settings > Billing. 2026-09-07 | FACT |
| 9 | ChatGPT and Codex usage panel | **Weekly limit: 99% left, resets in 6d 23h.** Panel states the limit is "Shared across Codex, Work, Workspace Agents, and ChatGPT for Excel. Chat conversations are not included." **Credits: 0 credits left.** | chatgpt.com Settings > Usage. 2026-09-07 | FACT |
| 9b | The 5-hour percent | **Not displayed.** That panel shows only a weekly bar. No 5-hour figure appears anywhere in Settings > Usage. | Same screen | NEEDS AUTHENTICATION |
| 10 | Has Ryan ever bought a rate-limit reset or Codex credits | **No.** Full transaction history shows six charges, all subscription. Wallet $0.00, credits 0. The panel currently reads **"No usage limit resets available at this time."** | chatgpt.com Settings > Billing > View all, and Settings > Usage. 2026-09-07 | FACT |
| 10b | Quoted price of a credit pack for Plus and Pro | **Not published on the page.** learn.chatgpt.com/docs/pricing mentions users "can purchase additional credits to continue working" but states no dollar figure for a credit pack. | learn.chatgpt.com/docs/pricing, fetched 2026-09-07 | NEEDS AUTHENTICATION |
| 11 | OpenAI receipts Jun to Sep 2026 | **Jun 25** $212.80 · **Jul 25** $212.80 · **Aug 25** $212.80 · **September: none yet**, next renewal Sep 25. Earlier for context: May 25 $212.80, Apr 25 $121.10 (Pro 20x, prorated), Apr 20 $106.40 (Pro 5x). | chatgpt.com Settings > Billing > Transaction history. 2026-09-07 | FACT |
| 12 | Grok / X plan and receipts | **X Premium Plus, $40.00 per month, Active.** Next billing Sep 16, 2026. Invoices: **Jun 16** $20.00 · **Jul 16** $40.00 · **Aug 16** $40.00 · **September: none yet.** Subscription sits on the @TheLeadFlowPro account. | x.com Settings > Manage Subscription, then the Stripe billing portal. 2026-09-07 | FACT |
| 12b | Separate SuperGrok subscription | **None found.** Grok access appears to come through Premium Plus. No separate xAI charge in the invoice history. | Same screens | FACT |
| 13 | Scheduled tasks that spend tokens | **6 active.** 5 on the Claude account, 1 on ChatGPT. Full list below. 17 more Claude tasks exist but are disabled or merged. **No cron job in the site repo spends tokens.** | Account scheduled-task list, chatgpt.com/scheduled, and repo grep. 2026-09-07 | FACT |
| 14 | Ryan's target | **8 hours a day, 5 days a week** on Claude Code, Fable 5.1, High effort. | Ryan, 2026-09-07 | RYAN STATEMENT |
| 15 | Tier promises | **Not approved yet.** Ryan asked that the tiers be rebuilt around what a dollar actually buys, gamified, starting at $5 and $10, and that he see the unit math first. Draft in "What a dollar buys" below, awaiting his yes. | Ryan, 2026-09-07 | AWAITING RYAN APPROVAL |
| 16 | Change the ledger AI lines | **Restructured, not just renumbered.** The old $600 / $500 / $200 = $1,300 lines describe subscriptions Ryan pays himself and is not asking for. The ledger should show subscriptions as paid-by-Ryan context and put the actual ask on overage credits. See "The ledger" below. | Ryan, 2026-09-07 | RYAN STATEMENT |
| 17 | The four pending items | **All four approved**, plus a standing yes to comparable user-experience fixes. | Ryan, 2026-09-07 | RYAN STATEMENT |
| 18 | Test payment | **Not performed.** Requires Ryan's own hand on the card, and the credit faucet is off, so a test now would prove the checkout but not the fulfilment. | This session | NOT DONE |

---

## Real monthly AI spend, June to September 2026

Every figure below is off an invoice.

| Month | Anthropic | OpenAI | Grok / X | Total |
|---|---|---|---|---|
| June 2026 | $228.95 ($210.00 subscription + $18.95 credits) | $212.80 | $20.00 | **$461.75** |
| July 2026 | $210.00 | $212.80 | $40.00 | **$462.80** |
| August 2026 | $210.00 | $212.80 | $40.00 | **$462.80** |
| September 2026 to date | $0.00 (renews Sep 23) | $0.00 (renews Sep 25) | $0.00 (renews Sep 16) | **$0.00 so far** |
| September 2026 once all three renew | $210.00 | $212.80 | $40.00 | **$462.80 expected** |

**Recurring subscription floor: $462.80 a month.** Ryan pays this himself and is not asking anyone to cover it.

**Overage credits purchased in the whole period: $18.95, once, in June.** That is the entire history of the thing /fuel is meant to fund. There is no established monthly overage number to put on the page, because he has been hitting the wall and stopping instead of buying through it.

---

## Claude Code tokens, August 1 to today

| Metric | Value |
|---|---|
| Tool actually measured | **Codex and Hermes. Not Claude.** |
| Claude Code local usage | **0 active days, 0 tokens, $0.00** |
| First day with any data | 2026-08-19 (nothing exists for Aug 1 to 18) |
| Active days | **20** |
| Input tokens | 176,039,710 |
| Output tokens | 11,098,402 |
| Cache write tokens | 0 |
| Cache read tokens | 3,234,480,928 |
| Total tokens | 3,422,414,592 |
| Cost at API list rates | **$3,567.73** |
| Average per active day | **$178.39** |
| Codex share | 16 active days, 110,061,901 in / 9,816,237 out / 3,144,126,080 cache read |
| Hermes share | 19 active days, 65,977,809 in / 1,282,165 out / 90,354,848 cache read, $27.71 |

**Five heaviest days:** Sep 1 $932.51 · Sep 6 $479.22 · Sep 4 $382.54 · Aug 24 $378.39 · Sep 7 $275.28.

**By month, all agents, from `ccusage monthly`:** Feb $4.70 · Apr $3,994.50 · May $3,574.55 · Jun $8,145.68 · Jul $1,962.66 · Aug $1,294.85 · Sep to date $2,272.88. Lifetime total $21,249.82.

### The caveat that has to go on the page in bold

**$3,567.73 is not a bill. Nobody sent it. Nobody paid it.** It is what that volume of tokens would have cost at published API list rates. Codex runs inside the $212.80 ChatGPT Pro subscription, so the marginal cost of those tokens to Ryan was zero.

It is still the most honest number available for "what this work is worth," and it is the right anchor for a credits page, as long as it is labeled as a list-rate valuation and never as an expense. Do not put it in the ledger as money spent.

---

## The rate card the tiers are built on

Anthropic published prices, per million tokens, fetched 2026-09-07 from platform.claude.com/docs/en/about-claude/pricing:

| Model | Input | Cache write (5m) | Cache read | Output |
|---|---|---|---|---|
| **Claude Fable 5.1** | $10 | $12.50 | $0.25 | $50 |
| Claude Opus 5 | $5 | $6.25 | $0.50 | $25 |
| Claude Sonnet 5 | $2 | $2.50 | $0.20 | $10 |
| Claude Haiku 4.5 | $1 | $1.25 | $0.10 | $5 |

Usage credits are billed at exactly these rates, per the support article quoted in item 5. So a dollar on /fuel converts to tokens by arithmetic, not by guesswork.

---

## What a dollar buys

Ryan's measured working mix, from the 20 active days above: **for every 1 output token, 15.9 input tokens and 291.4 cache-read tokens.** Priced at the Fable 5.1 card, that mix costs **$0.000282 per output token**, all three streams included.

That gives a table where every number is arithmetic on a published price, checkable by anyone:

| Support | Output tokens it funds | Input it carries | Cache read it carries |
|---|---|---|---|
| **$5** | 17,800 | 0.28M | 5.2M |
| **$10** | 35,500 | 0.56M | 10.4M |
| **$25** | 88,800 | 1.41M | 25.9M |
| **$50** | 177,600 | 2.82M | 51.8M |
| **$100** | 355,300 | 5.64M | 103.5M |
| **$500** | 1,776,300 | 28.18M | 517.7M |

And the same mix, priced by day, so the page can say what a day of work costs:

| Day | Tokens that day | Cost if it ran on Fable 5.1 credits |
|---|---|---|
| Sep 5 (light) | 43.2M | **$47.13** |
| Sep 2 | 94.2M | **$106.91** |
| Sep 7 | 198.3M | **$227.04** |
| Sep 6 (heavy) | 340.4M | **$277.42** |
| Sep 1 (heaviest) | 883.5M | **$611.00** |
| **Average active day** | 171.1M | **$156.20** |

### The gap between tokens and "one article", stated honestly

**Nobody has measured how many tokens one RealRyanNichols article costs.** Not in this repo, not in any log on the Mac. Anyone who writes "$25 buys one article" on that page today is making it up.

The number is ten minutes away, and here is the exact procedure:

1. Turn usage credits ON at claude.ai Settings > Usage and raise the monthly limit above $40.
2. Note the month-to-date credit spend, which is $0.00 right now.
3. Run out the weekly allowance, then build one article end to end on credits.
4. Read the month-to-date spend again. The difference is the measured cost of one article.
5. Repeat for a website build and for a two-hour Codex session.

Until those three numbers exist, every tier on /fuel must carry a visible **ESTIMATE** chip, and the page must say the estimate is derived from published API rates and Ryan's measured token mix, not from a metered article.

### Draft tiers for Ryan's yes or no

Gamified, starting where he said to start, every line tied to the table above. **AWAITING RYAN APPROVAL, none of this ships as written.**

- **$5, a spark.** About 18,000 words of finished output. Name on the Fuel wall.
- **$10, a shift.** About 35,000 words. Name on the wall plus a thank you in writing.
- **$25, a research run.** Enough credits to pull and read a stack of records.
- **$50, a build day.** About a third of a heavy working day at the measured rate.
- **$100, a full day.** Covers an average active day of agent work with room to spare.
- **$500, commission the work.** Ryan picks up the topic, pulls the records, and it publishes with the supporter named if they want to be.

Every one of those needs a measured article cost behind it before the words "one article" appear anywhere on the page.

---

## The ledger

Item 16, restructured rather than renumbered, because the old lines answer a question nobody is asking.

**Retire these three funding_line_items:** $600 build tools, $500 ChatGPT and Codex, $200 extra credits.

**Replace with two clearly separated blocks:**

*Block one, what Ryan already pays, shown as context and explicitly not the ask:*
- Claude Max 20x, $210.00 a month, paid by Ryan
- ChatGPT Pro 20x, $212.80 a month, paid by Ryan
- X Premium Plus, $40.00 a month, paid by Ryan
- Stated total: **$462.80 a month, out of his own pocket**

*Block two, the actual ask, the only fundable line:*
- **Overage usage credits.** Funded by supporters, spent only after the included weekly allowance runs out. Live balance and month-to-date spend read from the account, never hardcoded. Target derived from the day-cost table above once Ryan sets the number.

The page must never imply a supporter is paying a subscription. He is not asking for that and it is not true.

---

## Scheduled tasks that spend tokens

**Active, on the Claude account, 5:**

| Name | Schedule | Last run | Duration |
|---|---|---|---|
| RRN Daily Master Run | daily 12:30 UTC | Succeeded 2026-09-07 | ~16 min |
| J6 profile enrichment | daily 14:00 UTC | Succeeded 2026-09-07 | ~20 min |
| Daily trending articles | daily 11:00 UTC | Succeeded 2026-09-07 | ~1 min |
| Weekly article draft for TheLeadFlowPro | Tuesdays 14:00 UTC | never recorded | not yet run |
| AI hub decision point, is it time yet | one-shot, 2026-09-28 | never recorded | not yet run |

**Active, on ChatGPT, 1:** Publish Five Daily Articles, daily. Three more exist and are Paused: Website Offer Review, Trading Brain Watch, LeadFlow Daily 5-Channel 10.

**Model per task: NEEDS AUTHENTICATION.** The scheduled-task list does not expose which model each run uses.

**In the site repo: none.** `website/vercel.json` defines two crons, `/api/cron/deadman-release` and `/api/cron/bookvault-fulfillment`, both every 15 minutes, and neither calls an AI API. Only three routes in the site call one at all, and all three are user-triggered, not scheduled.

**17 further Claude tasks are disabled**, most marked MERGED, PAUSED, or DEAD by Ryan. None of them are spending anything.

---

## The four pending items, all approved

Ryan approved all four on 2026-09-07, plus a standing yes to comparable user-experience fixes:

1. **Turn on Vercel Web Analytics.** It is switched off on the `realryanichols-personal` project, which is why checking Vercel returns nothing.
2. **Restrict `live_visitor_session_detail` to admin only.** Any signed-in member, not just Ryan, can currently pull another visitor's city and last 20 pages.
3. **Capture the five production-only database functions into migration files.**
4. **Show city-level visitor pings publicly,** with the disclosure on the numbers page corrected in the same deploy.

---

## Screenshots saved

In `~/Desktop/usage-receipts-2026-09/`:

- `A1-A4-claude-plan-and-invoices.jpg`
- `A2-A3-claude-usage-and-credits.jpg`
- `C8-chatgpt-plan-and-billing.jpg`
- `C9-C10-chatgpt-usage-and-resets.jpg`
- `C11-openai-transaction-history.jpg`
- `D12-x-premium-plus-plan.jpg`
- `D12-x-invoice-history-CONTAINS-PII.jpg`
- `E13-chatgpt-scheduled-tasks.jpg`
- `ccusage-daily.json`, `ccusage-monthly.json`, `ccusage-tables.txt`

**Warning on one file.** `D12-x-invoice-history-CONTAINS-PII.jpg` shows the billing name, full email, and home address on the Stripe portal. It is on Ryan's own Desktop and it is not in the repo. Do not attach it to anything, and delete it once the invoice dates are confirmed.

---

## Things I could not find

- **A measured cost for one article, one website build, or one hour of Codex.** No log on the Mac or in the repo records it. Procedure to measure it is above. Looked in: ccusage output, `~/.claude`, the repo, and both billing dashboards.
- **Any Claude Code local usage at all.** `ccusage claude daily` returns zero and `~/.claude/projects` has not been written since Jul 18. Looked in: ccusage, `~/.claude/projects`, `~/.claude`.
- **The 5-hour usage percent on ChatGPT.** Settings > Usage shows a weekly bar only. Looked in: chatgpt.com Settings > Usage, Settings > Billing.
- **A published dollar price for an OpenAI credit pack.** learn.chatgpt.com/docs/pricing describes credits but prints no price. Looked in: that page, plus Settings > Usage where the "Add more" button exists without a visible price.
- **The model each scheduled task runs on.** Not exposed in the task list. Looked in: the account scheduled-task list and chatgpt.com/scheduled.
- **Anything before Aug 19 in ccusage,** despite asking for Aug 1. The data simply starts on Aug 19.
- **Whether a supporter can gift credits directly into Ryan's Anthropic account.** No such product appears in Settings > Usage, which offers only "Buy usage credits" to the account holder. ChatGPT does show a **"Redeem gift card"** button on its billing page, which is a real gifting path on the OpenAI side and worth testing before it is described on /fuel. Looked in: both billing pages.

**One more, unasked but relevant:** the local checkout at `/Users/ryannichols/Documents/repos/RealRyanNicholsLLC` is on commit `790e68f` dated **2026-08-28**. It is ten days behind. Pull before building anything from it.
