---
title: "NotebookLM Is Now Gemini Notebook: What Its Secure Cloud Computer Can—and Cannot—Do"
subtitle: "Google has renamed NotebookLM, upgraded it to Gemini 3.5 and Antigravity, and begun giving notebooks a cloud computer that can run code. Here is who has access, what it costs, what remains unclear, and one useful test."
author: "Real Ryan Nichols Editorial Team"
date: "2026-07-23T20:28:00Z"
category: "AI & Technology"
slug: "gemini-notebook-secure-cloud-computer-code-execution-2026"
status: "published"
pinned: false
seo_title: "Gemini Notebook Adds Secure Cloud Code Execution"
seo_description: "Google renamed NotebookLM to Gemini Notebook and added cloud code execution, Gemini 3.5 and new exports. See access, price, risks and one practical test."
tags: "Gemini Notebook, NotebookLM, Google AI, Gemini 3.5, Antigravity, cloud code execution, AI research tools, Google AI Pro, AI agents, artificial intelligence 2026"
---

*By the Real Ryan Nichols Editorial Team*

Google has renamed NotebookLM to **Gemini Notebook**, but the new name is not the development people should watch.

The consequential change is that Google is turning a source-grounded research notebook into an active computing workspace. A notebook can now receive a managed cloud computer, write and execute code, analyze material, and create files such as charts, spreadsheets, documents, images, and presentations.

That can shorten the distance between “read these sources” and “build something useful from them.” It can also make a mistaken analysis look more authoritative because the answer arrives with code, charts, and a polished file.

The right response is neither panic nor blind adoption. It is to understand what Google has actually released, where access remains limited, and how to test the system with data whose correct answer you can independently verify.

## The verified product record

Google [announced the Gemini Notebook name on July 16, 2026](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/). The company says the product remains a standalone application while becoming more closely connected to the Gemini app and, in a future rollout, AI Mode in Google Search.

The company separately says the upgraded product uses **Gemini 3.5 and Antigravity** and gives each eligible notebook a secure cloud computer capable of writing and running code. Google describes more than 100 curated software skills and new output formats for analysis and creation. Those details appear in its [Gemini Notebook research upgrade announcement](https://blog.google/innovation-and-ai/products/notebooklm/better-research-notebooklm/), originally published June 8 and updated July 16.

Google reports more than 30 million Gemini Notebook users and more than 600,000 organizations using the product. Those are Google's own adoption figures; this article did not independently audit them.

### Current access as of July 23, 2026

The code-execution capability is **not yet equally available to every account**.

Google says the secure cloud computer is available now to:

- Google AI Ultra subscribers;
- Workspace business customers with AI Ultra Access; and
- Workspace business customers with AI Expanded Access.

Google says it will roll out to Google AI Pro users on the web over the coming weeks. That is a future phased rollout, not proof that every Pro subscriber already has it. Account type, administrator settings, country, age eligibility, usage limits, and rollout timing can all affect what an individual user sees.

Gemini Notebook itself still has free and paid access levels. On the U.S. [Google One plans page](https://one.google.com/about/plans), Google AI Pro is shown at **$19.99 per month** with 5 TB of storage, while Google AI Plus is shown at **$9.99 per month** with 2 TB. Taxes, introductory offers, country pricing, and included features can differ.

This is a subscription product, not a separately priced Gemini API model in the sources reviewed here. Google does not publish a per-token Gemini Notebook charge on these product pages. Businesses should verify the plan and Workspace add-on available to their own account before budgeting.

{{poll: Which Gemini Notebook capability would you test first? | Source-grounded data analysis | Research timelines | Charts and spreadsheet exports | Reports and slide decks}}

## What the cloud computer changes

NotebookLM was built around a useful constraint: give the system selected sources and ask questions grounded in that collection. Gemini Notebook keeps that source-centered idea but expands what the notebook can do with the material.

Google lists supported outputs that include:

- charts in PNG or SVG;
- documents in PDF, DOCX, Markdown, or plain text;
- images in PNG, JPG, or GIF;
- structured data in CSV or JSON;
- spreadsheets in XLSX; and
- presentations in PPTX.

That means a researcher can move from a collection of reports and a small dataset to an analysis, chart, spreadsheet, and briefing deck without manually transferring every intermediate result between applications.

Google also says a notebook can begin with a loose idea or question and help guide the creation of a source repository. Cross-application syncing allows a notebook created in the Gemini app to appear in the standalone Gemini Notebook product and vice versa.

The opportunity is practical:

- A small business could analyze a sanitized sales export and turn the findings into a chart and weekly briefing.
- A journalist could organize public records, build a dated timeline, and identify where the source record is incomplete.
- A nonprofit could compare public program reports and produce a spreadsheet of stated outcomes.
- A student could gather assigned material, test a calculation, and export a study guide.
- A developer could use source documentation and sample data to prototype a low-risk analysis.

The important word is **could**. Code execution automates steps; it does not guarantee that the steps are correct.

## What Google's evaluations do—and do not—show

Google reports that the upgraded system achieved an average win rate above 65% in its internal evaluation set, including 69.9% on large-document analysis and 78.2% on web research and source discovery compared with the prior baseline.

Those are company-reported evaluation results. They support the narrower conclusion that Google measured an improvement against its previous system under its test conditions. They do not prove that every notebook, language, dataset, or professional task will improve by the same amount.

Real work has complications that a benchmark may not capture:

- missing or contradictory sources;
- malformed spreadsheets;
- definitions that change across documents;
- inaccessible webpages;
- confidential material that should not be uploaded;
- charts whose scale exaggerates a small difference; and
- code that runs successfully while answering the wrong question.

A generated file can be technically valid and substantively wrong. A spreadsheet can open. A chart can look polished. A Python cell can execute without an error. None of those facts establishes that the underlying reasoning, units, filters, or source selection are correct.

## What “secure cloud computer” does not yet tell us

Google calls the execution environment secure and describes it as a cloud computer attached to the notebook. The public announcements reviewed for this article do not provide a complete technical security specification.

They do not, on their own, answer every operational question a security or compliance team may ask, including:

- the precise isolation architecture;
- what outbound network access executed code can use;
- how long generated code, logs, and temporary files persist;
- which libraries and versions are installed;
- how secrets are prevented from entering notebook context;
- what administrators can audit;
- how regional data-processing requirements apply; or
- how the environment behaves when a source contains malicious instructions.

That absence is not proof that the system is insecure. It means the product announcement should not be treated as a substitute for the applicable terms, privacy notice, Workspace documentation, administrator controls, and a security review for the intended data.

Do not test a new analysis feature with passwords, private keys, payment-card numbers, private medical information, privileged legal material, unreleased client records, confidential personnel files, or information about minors.

## Product limits still matter

Google's [Gemini Notebook usage-limits page](https://support.google.com/gemininotebook/answer/16213268) describes limits by plan and warns that they can change.

The standard tier is currently listed with up to 100 notebooks per user, 50 sources per notebook, and 50 chat queries per day. Google AI Pro is listed with up to 500 notebooks, 300 sources per notebook, and 500 chat queries per day, along with higher daily limits for audio, video, and report generation.

Those quotas do not establish code-execution availability. A Pro account may have the higher Notebook limits while the new cloud-computer feature is still moving through its separate rollout.

Other limitations are less visible than a quota:

### The named model is not a permanent contract

Google identifies Gemini 3.5 and Antigravity in its current announcement. It does not promise that every internal component, routing decision, or future notebook run will remain unchanged. Users who need repeatable production results should preserve inputs, outputs, dates, and verification notes.

### Source grounding reduces one risk, not every risk

A notebook can cite a supplied source and still misunderstand it. A citation may support one sentence but not the conclusion built around it. Open the source, inspect the relevant passage, and verify calculations from the raw data.

### Generated code can inherit a bad premise

If the prompt asks for revenue but the CSV records refunds as positive values, the code may calculate a clean but misleading total. The human must define fields, signs, exclusions, units, and time periods.

### Exports can hide the reasoning trail

A polished PDF or presentation may omit the code, discarded records, transformation steps, and uncertainty behind its conclusion. For consequential work, retain an audit package—not just the final slide.

### A cloud computer expands the blast radius

An assistant that only summarizes text can produce a wrong answer. An assistant that executes code can also transform files, combine data, and create artifacts at speed. Keep inputs low-risk, restrict permissions, and require human review before any generated work is published or used to make a consequential decision.

## How this fits the wider AI race

OpenAI, Anthropic, and Google are all moving beyond a simple chat box toward workspaces that combine models, sources, tools, code, and finished artifacts.

That does not make the products interchangeable. The meaningful comparison is not which company uses the strongest slogan. It is which system can repeatedly complete a defined job with:

1. accurate source use;
2. transparent calculations;
3. acceptable cost and speed;
4. appropriate data controls;
5. useful export formats; and
6. a review trail a human can understand.

The recent [GPT-5.6 Sol, Terra, and Luna overview](/posts/gpt-5-6-sol-terra-luna-pricing-ultra-multi-agent) explains OpenAI's model tiers, multi-agent modes, and tool risks. Gemini Notebook represents a different product choice: organize a bounded research space first, then let the system analyze and build from it.

Neither approach removes the need to check the work.

## One useful test to run

Wait until the cloud-computer capability appears in your account. Then use a small, sanitized dataset whose answer you can calculate independently.

Create a notebook with:

- one official product or policy document;
- one CSV containing 30 to 100 non-sensitive rows;
- a short data dictionary defining every column; and
- a one-paragraph statement of the question you want answered.

Use a prompt like this:

> Use only the attached sources. Calculate monthly totals, create one clearly labeled chart, list possible anomalies, and export the analysis as a spreadsheet. Show the code or formulas used. State every assumption. Cite the source rows or document sections supporting each factual conclusion. Do not infer missing values. Do not access or change any external system.

Then verify:

1. the grand total with a normal spreadsheet formula;
2. at least five randomly selected source rows;
3. the treatment of blanks, refunds, duplicates, and dates;
4. the chart axis, units, and time range;
5. every factual citation; and
6. whether the exported file preserves assumptions and limitations.

Score the result from 1 to 5 for calculation accuracy, source support, transparency, usefulness, and review time. A successful test is not “the file looked impressive.” It is “another person could reproduce the result from the same sources.”

{{poll: What would stop you from using cloud code execution today? | I do not have access yet | Security or privacy questions | I need better accuracy evidence | Nothing—I would test it with safe data}}

## Editorial analysis

The rename makes Google's AI products easier to place under one umbrella. The cloud computer makes the notebook materially more powerful.

The best use of that power is not to give an AI every file a person owns. It is to create a controlled workspace: selected sources, a narrowly defined question, sanitized data, visible calculations, and an explicit review standard.

That is how Gemini Notebook can become more than a convenient report generator. It can become a useful research instrument.

But the instrument still needs calibration. A notebook that cites sources and runs code can be wrong in two ways at once: it can misunderstand the record and calculate the misunderstanding perfectly.

## Sources and what to watch next

Primary Google sources used for this article:

- [NotebookLM becomes Gemini Notebook, July 16, 2026](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/)
- [Gemini Notebook research and cloud-computer upgrade](https://blog.google/innovation-and-ai/products/notebooklm/better-research-notebooklm/)
- [Google One AI plans and U.S. prices](https://one.google.com/about/plans)
- [Gemini Notebook usage limits](https://support.google.com/gemininotebook/answer/16213268)

Readers should watch the Pro rollout, Workspace eligibility, administrator controls, security documentation, supported software skills, usage limits, and any change in subscription pricing. Google can change access and limits, so verify the current product page before paying for a plan or moving a workflow into production.

For a practical system-building perspective, read [One Thing I Write Turns Into Ten](/posts/one-thing-i-write-turns-into-ten-that-is-not-talent-that-is-a-system), explore [AI and website services](/services), or browse the site's [tools and resources](/tools).

Join the optional email and text list at the bottom of this page for future ChatGPT, Claude, Gemini, AI-agent, and emerging-technology updates. Consent is optional, and you can unsubscribe at any time.

{{report: Gemini Notebook test result or correction | Share a verified rollout update, test result, or correction | What became available, worked, failed, or needs correction? | Include your plan, country, account type, test method, and an official source when possible. Do not submit passwords, private keys, confidential records, or private personal information. | Describe your update or test... | Send report}}

{{share}}
