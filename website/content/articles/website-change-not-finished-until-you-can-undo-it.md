---
title: "A Website Change Is Not Finished Until You Can Undo It"
subtitle: "A rollback note turns a good intention into a recovery plan when the new version breaks something nobody tested."
author: "Real Ryan Nichols Editorial Team"
date: "2026-09-19T16:00:00-05:00"
category: "Behind the scenes"
slug: "website-change-not-finished-until-you-can-undo-it"
status: "published"
pinned: false
canonical: "https://realryannichols.com/posts/website-change-not-finished-until-you-can-undo-it"
seo_title: "Every Website Change Needs a Rollback Note"
seo_description: "A website change is not finished until someone can undo it. Use this five-line rollback note before the next release breaks forms, prices, or pages."
og_image: "https://realryannichols.com/social-cards/2026-09-19/website-change-not-finished-until-you-can-undo-it.jpg"
tags: "website rollback, deployment checklist, small business website, change log, business systems"
---

Most website changes are tested in one direction.

Does the new page load? Does the new button work? Did the new price replace the old one?

If the answer is yes, somebody publishes it and moves on.

That is half a test.

The other half is the question nobody wants to ask while the change still looks good:

How do we put it back?

## A rollback is not an admission of failure

A rollback is a controlled way to restore the last known working version when a new release causes a problem.

The concept is normal in software. Git has a [revert command](https://git-scm.com/docs/git-revert) that records a new change designed to reverse an earlier one. Hosting platforms preserve deployments so a team can point production back to a prior build.

Vercel’s [Instant Rollback documentation](https://vercel.com/docs/instant-rollback) describes the feature as a way to recover quickly from production incidents such as breaking changes or bugs. It also warns that a rollback does not automatically reverse everything outside the deployment, including changed databases, external APIs, content systems, and some environment settings.

That warning is the business lesson.

Putting the old website code back may not put the old business state back.

{{receipt: {"label": "FACT", "claim": "Vercel says an Instant Rollback points production domains back to a selected prior deployment, while external APIs, databases, CMS content, and environment changes may require separate recovery steps.", "source": "Vercel Instant Rollback documentation, updated July 7, 2026", "url": "https://vercel.com/docs/instant-rollback", "exhibit_id": "EX-01"}}}

## The damage usually lives beside the code

Imagine a local service business updates its quote form.

The new version looks cleaner. It also sends submissions to the wrong email address.

The developer can restore yesterday’s page in two minutes. That does not recover the leads submitted during the broken window. It does not tell the office which customers need an apology. It does not prove whether the notification problem began with the page, the automation, or the inbox.

Or imagine a restaurant changes a price in its website database. Rolling back the website files may restore the old layout while leaving the new price in the database.

Or a nonprofit replaces a donation link. The old page comes back, but the payment account, QR code, and scheduled social posts still point somewhere else.

The screen is only one layer of the change.

## The five-line rollback note

Before a meaningful website change goes live, write five lines.

### 1. What is changing?

Name the page, field, form, price, integration, or automation. “Website update” is not a useful description.

### 2. What should still work afterward?

List the behavior you are protecting. The quote form submits. The confirmation email arrives. The old URL redirects. The phone number remains clickable on mobile.

### 3. What is the last known good version?

Write the deployment ID, commit, backup date, exported configuration, or saved copy. “We can probably find it” is not a recovery plan.

### 4. What cannot be rolled back automatically?

Name database writes, form submissions, payment records, customer messages, DNS changes, and outside services.

### 5. Who makes the call?

Put one person’s name beside the decision to roll back. A room full of people watching a broken page is not ownership.

{{callout: key | If the recovery plan begins with “find the person who built it,” the recovery plan does not exist.}}

## Test the exit before you need it

Do not wait for the incident to discover whether the backup is real.

Use a preview or staging environment. Make a harmless change. Deploy it. Restore the previous version. Then test the page from a phone that is not logged into the admin account.

Check the pieces a customer touches:

- homepage
- top service page
- quote or contact form
- confirmation message
- email or CRM receipt
- payment or booking link
- important redirects

The point is not to prove that every tool has a rollback button.

The point is to know which parts do not.

## Rollback and repair are different jobs

A rollback stops new damage.

A repair handles what happened before the stop.

If leads were missed, export the affected submissions and contact them. If prices were wrong, identify the transactions. If links broke, restore the redirects. If private information was exposed, preserve the incident record and follow the legal and security process that applies.

Do not let a restored green status light convince you that every human consequence disappeared with the bad deployment.

## Small businesses need this more, not less

Large teams have incident managers, release systems, and people on call.

A small business may have one owner, one contractor, and a password somebody saved in the wrong browser.

That makes a short rollback note more valuable.

It is the handoff between the calm version of you and the version of you trying to repair a broken form while customers are already arriving.

Keep the note with the change. Keep credentials in the system that owns them. Keep the last known good version available. Then let one named person decide.

{{related: a-url-is-a-promise-you-already-made | every-automation-needs-a-failure-receipt | a-rule-nobody-checks-is-just-a-preference}}

## Run the audit

Open the last three website changes your business made.

Can you identify what changed, what was supposed to remain true, the last known good version, the parts outside the rollback, and the person authorized to act?

If not, write the notes now while the changes are still fresh.

If your website, forms, CRM, and follow-up tools have grown into a system nobody can safely change, map the handoffs before you add another tool. The Lead Flow Pro diagnostic is designed to find those ownership gaps.

A release is not complete because the new version is live.

It is complete when you know how to recover the business if the new version is wrong.

Which change on your website would be hardest to undo today?

