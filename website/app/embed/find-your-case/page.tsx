import type { Metadata } from "next";
import { FindYourCase } from "@/components/FindYourCase";

// Iframe-embeddable defendant lookup. Other sites drop this into a page and
// their readers can search the archive without leaving — every result links
// back here. Framing is allowed by the /embed/* header set in next.config.
export const metadata: Metadata = {
  title: "Find Your Case — J6 defendant lookup",
  robots: { index: false, follow: false },
};

export default function FindYourCaseEmbedPage() {
  return <FindYourCase embed />;
}
