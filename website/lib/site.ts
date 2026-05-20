export const SITE = {
  name: "Ryan Nichols",
  tagline: "Husband, father, builder. Healing in public.",
  description:
    "The personal feed of Ryan Nichols. Faith, family, building, and the long road of healing in public — written from his own front porch, on a domain he owns.",
  url: process.env.SITE_URL ?? "https://realryannichols.com",
  author: "Ryan Nichols",
  avatarPath: "" as string,
  verseSidebar: {
    text: "As for you, you meant evil against me, but God meant it for good, to bring it about that many people should be kept alive, as they are today.",
    citation: "Genesis 50:20",
  },
  footerLine: "Posted from my own front porch.",
  year: new Date().getFullYear(),
  // CAN-SPAM requires a physical postal address in every commercial email.
  // Set SITE_MAILING_ADDRESS in your environment (a PO box is fine).
  mailingAddress: process.env.SITE_MAILING_ADDRESS ?? "",
};
