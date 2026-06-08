import type { Metadata } from "next";
import { BuildSpecial } from "@/components/BuildSpecial";

export const metadata: Metadata = {
  title: "Get a Website Like This — Built by Ryan Nichols",
  description:
    "I'll build you a fast, fully-owned custom website on the same stack as RealRyanNichols.com. Founder rate $250 (standard $997), secure card checkout — your domain, your audience, no algorithm in the middle.",
  alternates: { canonical: "/build" },
  openGraph: {
    title: "Get a Website Like This — Built by Ryan Nichols",
    description:
      "A custom, fully-owned website on the same stack as RealRyanNichols.com. Founder rate $250 (standard $997). Secure checkout.",
    type: "website",
    images: [
      {
        url: "/uploads/today-only-build-og.png",
        width: 1200,
        height: 630,
        alt: "I'll build you a website like this one.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Get a Website Like This — Built by Ryan Nichols",
    description:
      "A custom, fully-owned website on the same stack as RealRyanNichols.com. Founder rate $250 (standard $997).",
    images: ["/uploads/today-only-build-og.png"],
  },
};

export default function BuildPage() {
  return <BuildSpecial />;
}
