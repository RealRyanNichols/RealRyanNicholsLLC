export const SITE = {
  name: "Ryan Nichols",
  tagline: "Marine Veteran, Founder & January 6 Advocate. Healing in public.",
  description:
    "Ryan Nichols — U.S. Marine Corps veteran, search-and-rescue operator, founder of Wholesale Universe, and January 6 defendant pardoned January 20, 2025. Charges dismissed with prejudice. Building in public from East Texas.",
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
  // Show the email field in signup forms and CAPTURE emails now — stored as
  // unconfirmed leads. SENDING confirmations still requires mailingAddress +
  // Resend (gated server-side); this only controls whether we collect the
  // address. Always on so we never lose a lead while sending is being set up.
  emailCaptureEnabled: true,
};
