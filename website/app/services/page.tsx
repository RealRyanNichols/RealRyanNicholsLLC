import type { Metadata } from "next";
import { ServicesHub } from "@/components/ServicesHub";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services — turn attention into action",
  description:
    "Hire Ryan Nichols to audit, sharpen, or build an owned website that turns attention into proof, services, support, and checkout.",
  alternates: { canonical: `${SITE.url}/services` },
  openGraph: {
    title: "Services — turn attention into action",
    description:
      "Business services for owned websites, attention systems, site audits, service ladders, and domain-first builds.",
    images: ["/social-cards/map-room.jpg"],
  },
};

export default function ServicesPage() {
  return <ServicesHub />;
}
