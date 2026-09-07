// The spine of /case: every stop on the story page, in order. The chapter
// nav (rail and chip row) and the chapter headers both read from here so a
// chapter cannot exist in one and not the other. `n` is the spoken number
// the page has always used ("Chapter One"); stops without one are the
// unnumbered sections after the story.
export type CaseChapter = {
  id: string;
  n?: "One" | "Two" | "Three" | "Four";
  // What the nav shows; short enough for a phone chip.
  short: string;
};

export const CASE_CHAPTERS: readonly CaseChapter[] = [
  { id: "chapter-one", n: "One", short: "Before the case" },
  { id: "chapter-two", n: "Two", short: "The case" },
  { id: "chapter-three", n: "Three", short: "The detention record" },
  { id: "chapter-four", n: "Four", short: "On the record now" },
  { id: "evidence", short: "Evidence on file" },
  { id: "attorney-briefing", short: "For counsel" },
];

export const CHAPTER_ORDINAL: Record<NonNullable<CaseChapter["n"]>, number> = {
  One: 1,
  Two: 2,
  Three: 3,
  Four: 4,
};
