export const SITE = {
  name: "Ryan Nichols",
  tagline: "Husband, father, builder. Healing in public.",
  description:
    "The personal feed of Ryan Nichols. Faith, family, building, and the long road of healing in public — written from his own front porch, on a domain he owns.",
  url: process.env.SITE_URL ?? "https://realryannichols.com",
  author: "Ryan Nichols",
  // Drop a square photo at website/public/avatar.jpg and set this to
  // "/avatar.jpg" to swap in a real headshot. Empty keeps the RN circle.
  avatarPath: "" as string,
  // Drop a wide banner (≥1600×500) at website/public/cover.jpg and set this
  // to "/cover.jpg" to add a profile banner above the hero. Empty keeps
  // the gradient-only hero.
  coverPath: "" as string,
  verseSidebar: {
    text: "As for you, you meant evil against me, but God meant it for good, to bring it about that many people should be kept alive, as they are today.",
    citation: "Genesis 50:20",
  },
  footerLine: "Posted from my own front porch.",
  year: new Date().getFullYear(),
  // CAN-SPAM requires a physical postal address in every commercial email.
  // Set SITE_MAILING_ADDRESS in your environment (a PO box is fine).
  mailingAddress: process.env.SITE_MAILING_ADDRESS ?? "",
  // Stripe-hosted $5/month Supporter Membership checkout. Optional badge,
  // doesn't gate commenting (which stays free).
  supporterUrl:
    process.env.NEXT_PUBLIC_SUPPORTER_URL ??
    "https://buy.stripe.com/dRm5kw2HCamd33z8st8k80L",
};
