import assert from "node:assert/strict";
import test from "node:test";
import { getDocumentPreview } from "../lib/case-document-preview";
import { filterArchive } from "../components/case/archive";
import { formatCaseDate } from "../lib/case-date";

test("case dates keep their recorded calendar day in different server timezones", () => {
  const previous = process.env.TZ;
  try {
    for (const zone of ["America/Chicago", "America/Los_Angeles", "UTC", "Pacific/Kiritimati"]) {
      process.env.TZ = zone;
      assert.equal(formatCaseDate("2021-10-26"), "October 26, 2021");
      assert.equal(formatCaseDate("2023-07-28", "MMM d, yyyy"), "Jul 28, 2023");
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test("Sibick DOJ pages and the WKBW interview remain webpages, not court PDFs", () => {
  for (const external_url of [
    "https://www.justice.gov/usao-dc/pr/new-york-man-sentenced-assaulting-law-enforcement-officer-during-jan-6-capitol-breach",
    "https://www.justice.gov/pardon/freedom-information-act-foia-release-pardon-certificate-recipients",
    "https://www.wkbw.com/news/local-news/western-new-yorker-sentenced-for-assaulting-officer-in-january-6th-attack-speaks-out",
  ]) {
    assert.equal(getDocumentPreview({ file_url: null, external_url }).kind, "external");
    assert.equal(getDocumentPreview({ file_url: null, external_url, file_mime: "text/html; charset=UTF-8" }).kind, "external");
  }
});

test("PDF records work with MIME metadata or a PDF path, including signed URLs", () => {
  assert.equal(getDocumentPreview({ file_url: null, external_url: "https://example.org/download/123", file_mime: "application/pdf" }).kind, "pdf");
  assert.equal(getDocumentPreview({ file_url: null, external_url: "https://example.org/Order.PDF?download=1#page=2" }).kind, "pdf");
  assert.equal(getDocumentPreview({ file_url: "https://example.org/upload.pdf", external_url: "https://example.org/article" }).url, "https://example.org/upload.pdf");
  assert.equal(getDocumentPreview({ file_url: null, external_url: "https://example.org/article?file=record.pdf" }).kind, "external");
  assert.equal(getDocumentPreview({ file_url: null, external_url: "https://example.org/record.pdf", file_mime: "text/html" }).kind, "external");
});

test("existing scans retain previews and missing sources do not create a broken image", () => {
  assert.equal(getDocumentPreview({ file_url: "https://example.org/j6s1-054.jpg", external_url: null, file_mime: "image/jpeg" }).kind, "image");
  assert.equal(getDocumentPreview({ file_url: "https://example.org/legacy-scan", external_url: null }).kind, "image");
  assert.deepEqual(getDocumentPreview({ file_url: null, external_url: null }), { kind: "unavailable", url: null });
});

test("Sibick's sentencing event is searchable even if its name appears only in the slug", () => {
  const event = {
    id: "sentencing",
    slug: "thomas-sibick-sentenced-2023-07-28",
    title: "Judge Jackson imposes a 50-month sentence",
    description: "The sentence included 50 months' imprisonment.",
    event_date: "2023-07-28",
    location: "District of Columbia",
    views_count: 0,
    shares_count: 0,
  };
  for (const q of ["Sibick", "thomas sibick", "thomas-sibick"]) {
    const result = filterArchive({ q, j6Filter: "all", grievances: [], people: [], events: [event], documents: [], peopleNamed: 0 });
    assert.deepEqual(result.filteredEvents, [event]);
    assert.equal(result.totalHits, 1);
  }
  assert.equal(filterArchive({ q: "unrelated", j6Filter: "all", grievances: [], people: [], events: [event], documents: [], peopleNamed: 0 }).filteredEvents.length, 0);
});
