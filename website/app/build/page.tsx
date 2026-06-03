import type { Metadata } from "next";
import { BuildSpecial } from "@/components/BuildSpecial";

export const metadata: Metadata = {
  title: "Today Only — A Website Like Mine for $250",
  description:
    "The site you're on, I built it. Today only — the next 6 people get one like it for $250 (normally $997). Pay by Venmo or Cash App.",
  openGraph: {
    title: "Today Only — A Website Like Mine for $250",
    description:
      "The next 6 people get a website like RealRyanNichols.com for $250 (normally $997). Today only — Venmo or Cash App.",
    type: "website",
    images: [
      {
        url: "/uploads/today-only-build-og.png",
        width: 1200,
        height: 630,
        alt: "Today only — I'll build you a website like this for $250",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Today Only — A Website Like Mine for $250",
    description:
      "The next 6 people get a website like RealRyanNichols.com for $250 (normally $997). Today only.",
    images: ["/uploads/today-only-build-og.png"],
  },
};

export default function BuildPage() {
  return <BuildSpecial />;
}
