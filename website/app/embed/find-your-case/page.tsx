import type { Metadata } from "next";
import { FindYourCase } from "@/components/FindYourCase";
import { getJ6DefendantCount } from "@/lib/case";

// Iframe-embeddable defendant lookup. Other sites drop this into a page and
// their readers can search the archive without leaving — every result links
// back here. Framing is allowed by the /embed/* header set in next.config.
export const metadata: Metadata = {
  title: "Find Your Case — J6 defendant lookup",
  robots: { index: false, follow: false },
};

export const revalidate = 3600;

export default async function FindYourCaseEmbedPage() {
  const defendants = await getJ6DefendantCount();
  return <FindYourCase embed defendants={defendants} />;
}
