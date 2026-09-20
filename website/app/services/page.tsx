import { withMainPageOg } from "@/lib/page-metadata";
import type { Metadata } from "next";
import { ServicesHub } from "@/components/ServicesHub";
import { SITE } from "@/lib/site";

export const metadata: Metadata = withMainPageOg("/services", {
  title: "Business Growth Systems | The LeadFlow Pro",
  description:
    "Need more leads and less busywork? See the websites, ads, follow-up, automation, and proof systems Ryan builds through The LeadFlow Pro.",
  alternates: { canonical: `${SITE.url}/services` },
  openGraph: {
    title: "Build your business with The LeadFlow Pro",
    description:
      "Websites, lead generation, follow-up, and automation built in accounts your business owns.",
    images: ["/og/pages/2026-09/services.jpg"],
  },
});

export default function ServicesPage() {
  return <ServicesHub />;
}
