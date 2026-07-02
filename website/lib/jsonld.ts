import { SITE } from "@/lib/site";

// Shared JSON-LD vocabulary. The root layout declares the site-wide entity
// graph (Person / Organization / WebSite, cross-referenced by @id); every
// page-level schema block should point INTO that graph with these refs
// instead of re-declaring the entities, so search engines and AI crawlers
// read the whole site as one connected record.

export const PERSON_ID = `${SITE.url}/#person`;
export const ORG_ID = `${SITE.url}/#org`;
export const WEBSITE_ID = `${SITE.url}/#website`;

export function personRef() {
  return { "@id": PERSON_ID };
}

export function orgRef() {
  return { "@id": ORG_ID };
}

export function websiteRef() {
  return { "@id": WEBSITE_ID };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
