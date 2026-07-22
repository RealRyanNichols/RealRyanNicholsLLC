---
title: "GPT-5.6 Sol Is Here: What OpenAI's New Model Family Costs—and What Ultra Really Means"
subtitle: "OpenAI has split GPT-5.6 into Sol, Terra, and Luna and added max and multi-agent ultra modes. Here is the verified price, access, opportunity, risk, and one practical test."
author: "Real Ryan Nichols Editorial Team"
date: "2026-07-22T20:30:00Z"
category: "AI & Technology"
slug: "gpt-5-6-sol-terra-luna-pricing-ultra-multi-agent"
status: "draft"
pinned: false
seo_title: "GPT-5.6 Sol, Terra and Luna: Price, Access and Risks"
seo_description: "OpenAI's GPT-5.6 family explained: Sol, Terra and Luna pricing, ChatGPT access, max and ultra modes, multi-agent risks, and one practical test."
tags: "OpenAI, GPT-5.6, GPT-5.6 Sol, GPT-5.6 Terra, GPT-5.6 Luna, ChatGPT, Codex, multi-agent AI, AI pricing, AI safety, artificial intelligence 2026"
---

*By the Real Ryan Nichols Editorial Team*

The most important part of OpenAI's GPT-5.6 launch is not a single benchmark score. It is the new menu of tradeoffs.

OpenAI now offers one model generation in three durable tiers—**Sol, Terra, and Luna**—then lets some users spend more reasoning time through **max** or coordinate several agents through **ultra**. The practical question is no longer just, “Which model is smartest?” It is, “How much capability, speed, cost, and review does this job actually require?”

That is a useful change for developers and businesses. It is also a warning: more agents and more compute can produce a stronger-looking result without turning uncertainty into truth.

## What OpenAI actually launched

OpenAI [announced general availability of the GPT-5.6 family on July 9, 2026](https://openai.com/index/gpt-5-6/) after a limited preview. The family has three tiers:

| Model | OpenAI's stated role | Best starting use |
|---|---|---|
| **GPT-5.6 Sol** | Flagship model for demanding work | Complex research, coding, design, and high-value analysis |
| **GPT-5.6 Terra** | Balanced, lower-cost model | Everyday professional work where quality and cost both matter |
| **GPT-5.6 Luna** | Fastest and most affordable tier | High-volume extraction, classification, first passes, and simpler tasks |

The names are intended to remain capability tiers even as models advance. The number identifies the generation; Sol, Terra, and Luna identify the position in the family.

OpenAI says GPT-5.6 is available across ChatGPT, ChatGPT Work, Codex, and the OpenAI API, with access depending on the product and plan.

- **Chat:** Plus, Pro, Business, and Enterprise users can access GPT-5.6 Sol through medium and higher effort settings. Pro and Enterprise users can also select Sol Pro for the most demanding results.
- **ChatGPT Work and Codex:** Free and Go users get Terra. Plus, Pro, Business, and Enterprise users can choose Sol, Terra, or Luna and select an effort level.
- **Max:** Available in Work and Codex to users who have GPT-5.6 access and enable it in settings.
- **Ultra:** Available in ChatGPT Work for Pro and Enterprise users and in Codex for Plus and higher plans.
- **API:** Developers can call Sol, Terra, and Luna. Multi-agent operation is initially a beta feature in the Responses API.

Availability can still be shaped by gradual rollout, regional restrictions, workspace settings, administrator controls, usage limits, and product-specific eligibility. A person can have a paid plan and still encounter a temporary limit or an administrator-disabled feature.

{{poll: Which GPT-5.6 tier would you test first? | Sol for the hardest work | Terra for balanced everyday work | Luna for speed and cost | I need to compare them first}}

## Verified API pricing

OpenAI prices GPT-5.6 API use per one million tokens:

| Model | Input | Output |
|---|---:|---:|
| **Sol** | $5.00 | $30.00 |
| **Terra** | $2.50 | $15.00 |
| **Luna** | $1.00 | $6.00 |

Those are API prices, not separate consumer subscription prices. ChatGPT plan access is governed by the plan's included limits and policies; API usage is separately metered.

GPT-5.6 also changes prompt caching. OpenAI says cache writes are billed at 1.25 times the uncached input rate, while cache reads receive a 90% discount from the normal input rate. The family supports explicit cache breakpoints and a minimum 30-minute cache life.

That can make repeated work cheaper when a large, stable instruction set or reference package is reused. It can also waste money if a workflow keeps rewriting the supposedly stable prefix and never benefits from cache reads.

The price table is only the start of the cost calculation. A task using Sol with longer reasoning, repeated tools, large outputs, or several parallel agents can cost much more than a short Luna request. Teams should measure the total cost of a successful reviewed result, not the cheapest token or the most impressive model name.

## What max and ultra really mean

OpenAI describes **max** as allowing more reasoning time than the previous xhigh setting. The model can explore alternatives, run checks, and revise before returning an answer.

**Ultra** changes the shape of the work. OpenAI says it coordinates four agents in parallel by default, trading higher token use for stronger results and faster completion on difficult assignments. Developers can build similar patterns through the multi-agent beta in the Responses API.

Parallel agents can be genuinely useful when a problem has separable workstreams. One agent can inspect official documentation, another can analyze data, another can challenge assumptions, and a fourth can assemble the final output.

But four agents are not four independent witnesses. They may share the same model family, context, blind spots, or mistaken premise. Agreement among them does not prove a claim. Multi-agent work still needs primary sources, explicit acceptance tests, and a human checkpoint for consequential action.

## Programmatic Tool Calling: the quieter development to watch

The GPT-5.6 launch also introduces **Programmatic Tool Calling** in the Responses API. OpenAI says the model can write and execute lightweight in-memory programs that coordinate tools, filter intermediate results, monitor progress, and decide what to do next.

That matters because tool-heavy agents often burn time and tokens passing every intermediate result back through the model. A small program can process a large result set and retain only the relevant records. OpenAI describes this feature as compatible with Zero Data Retention configurations, subject to the customer's actual account and data-control setup.

The opportunity is more efficient research, monitoring, coding, data cleanup, and operations. The risk is that generated orchestration code can make a bad decision at machine speed. Developers should limit permissions, validate tool inputs and outputs, log decisions, cap loops and spending, and require approval before publishing, sending, purchasing, deleting, or changing access.

## Where people may see real gains

OpenAI reports improvements in coding, front-end design, computer use, documents, presentations, spreadsheets, browsing, science, and cybersecurity. Those are company-reported evaluations and early-customer results—not a promise that every task will improve.

The most practical opportunities are narrower and easier to test:

### Match the tier to the job

Use Luna for a fast first pass over a large queue. Escalate ambiguous or high-value cases to Terra or Sol. A routed workflow can be more economical than sending every task to the flagship.

### Separate creation from verification

Sol can draft a report, plan, interface, or code change. A second pass should verify sources, calculations, requirements, and tests. For important work, verification should not be reduced to “ask the same model if it is sure.”

### Parallelize only work that can be reconciled

Ultra is best suited to complex assignments with clearly defined branches and a final synthesis step. If agents cannot cite their sources or explain conflicts, parallelism may create noise instead of speed.

### Build reusable context carefully

Prompt caching can lower the cost of stable instructions and reference material. Keep the reusable prefix clean, versioned, and free of secrets that do not belong in the model context.

## The limitations and risks

### 1. Vendor benchmarks are snapshots, not warranties

OpenAI reports strong results across several evaluations, but benchmark design, prompting, tools, reasoning budgets, and scoring can differ. Real workloads contain messy data, shifting requirements, unavailable sources, and organizational constraints that a leaderboard cannot reproduce.

### 2. More reasoning can mean more cost and latency

Max and ultra are not default choices for every request. More tokens and more agents can be wasteful on routine work. Start with the lowest-cost tier that can reliably pass a defined test, then escalate when the expected value justifies it.

### 3. A polished artifact can still contain a false claim

Better design and longer reasoning do not eliminate hallucinations, stale sources, arithmetic errors, or misunderstood instructions. Open every consequential citation. Recalculate important figures. Test code in an isolated environment. Review the finished file, not just the model's summary of it.

### 4. Tool access expands the blast radius

An agent connected to email, cloud storage, code, customer data, or publishing systems can do more useful work—and cause more damage if instructions, permissions, or external content are malicious. Use least privilege, separate read from write access, and place confirmation gates before irreversible actions.

### 5. Stronger cyber capability creates dual-use pressure

OpenAI says GPT-5.6 is more capable in cybersecurity and biology but remains below the company's “Critical” threshold in both categories. The company also says Sol's cyber safeguards block roughly ten times more potentially harmful activity than previous models, which may create friction for legitimate defensive work. OpenAI provides lower-capability retries for some benign requests and reserves sensitive capabilities for verified Trusted Access users.

OpenAI is explicit that perfect security does not exist and that new weaknesses and jailbreaks will be discovered. Users should treat model safeguards as one layer, not as permission to expose production credentials or remove ordinary security controls.

{{poll: What is the biggest GPT-5.6 risk for your work? | Incorrect facts | Rising usage cost | Too much tool access | Overtrusting multi-agent agreement}}

## One useful test to run

Choose one low-risk assignment you already understand well. Do not use confidential client data, passwords, private keys, medical records, payment-card data, or unreleased legal material.

Give Luna, Terra, and Sol the same compact source packet and this instruction:

> Using only the attached sources, create a one-page decision brief. Separate verified facts, assumptions, and recommendations. Cite the exact source for every factual claim. List three uncertainties and one action that requires human approval. Do not send, publish, purchase, delete, or change any external system.

Score each result from 1 to 5 on:

1. factual accuracy;
2. citation support;
3. instruction-following;
4. usefulness of the recommendation;
5. time and total cost.

If you have ultra access, run it only after the single-model comparison. Ask the parallel agents to take distinct roles—research, calculation, risk review, and synthesis—and require the final answer to preserve disagreements instead of silently averaging them away.

The winning model is not automatically Sol. It is the least expensive setup that repeatedly clears your quality threshold.

## Ryan's Take

*This section is editorial analysis, separate from the verified product record above.*

The big story is not that one more model topped one more chart. The big story is that AI buyers are being asked to manage a portfolio of intelligence.

That is healthier than treating the flagship as the answer to everything. A serious operator should know when a fast, inexpensive model is enough, when a difficult decision deserves more reasoning, and when no model should act without a person reviewing the record.

Ultra may be powerful, but accountability cannot be parallelized away. If four agents produce a wrong answer, the fifth name on the project is still the human who approved it.

{{poll: Where should a human approval gate always remain? | Before publishing | Before spending money | Before changing data or permissions | All of these}}

## Sources and what to watch next

Primary OpenAI sources used for this article:

- [GPT-5.6 launch, availability, pricing, evaluations, and safeguards](https://openai.com/index/gpt-5-6/)
- [OpenAI model release notes](https://help.openai.com/en/articles/9624314-model-release-notes)
- [OpenAI API pricing](https://openai.com/api/pricing/)
- [GPT-5.6 preview and technical background](https://openai.com/index/previewing-gpt-5-6-sol/)

Readers should watch for changes to plan limits, regional availability, multi-agent beta behavior, model identifiers, cache controls, and safety policies. OpenAI can revise product access and pricing, so confirm current terms before budgeting or deploying a production workflow.

For the broader agent shift, read [ChatGPT Work Changes the AI Job](/posts/chatgpt-work-ai-agent-scheduled-tasks-2026). See how one idea can become a repeatable publishing system in [One Thing I Write Turns Into Ten](/posts/one-thing-i-write-turns-into-ten-that-is-not-talent-that-is-a-system), explore [AI and website services](/services), or browse the site's [tools and resources](/tools).

Join the optional email and text list at the bottom of this page for future ChatGPT, Claude, AI-agent, and emerging-technology updates. Consent is optional, and you can unsubscribe at any time.

{{report: GPT-5.6 test result or correction | Share a verified result from Sol, Terra, Luna, max, or ultra | What worked, failed, cost more than expected, or needs correction? | Include the task, model tier, effort setting, result, and an official source when possible. Do not submit passwords, private keys, confidential data, or private personal information. | Describe your test or correction... | Send report}}

{{share}}
