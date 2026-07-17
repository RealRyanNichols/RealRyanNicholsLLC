// Shared biographical record for Ryan Nichols — the single source of truth for
// his service record, search-and-rescue operations, and media recognition.
// Used by both /about (the full Exhibit 288 biography page) and his case
// profile at /case/people/ryan-nichols, so the two never drift apart.
//
// Every fact here is drawn from the biography filed as Exhibit 288 in
// United States v. Nichols (reproduced verbatim on /about).

export const SUBJECT_SLUG = "ryan-nichols";

export const ROLE_LINE =
  "Pardoned January 6 defendant · U.S. Marine Corps veteran · Search-and-Rescue specialist · Independent investigative journalist";

export const DECORATIONS = [
  "Good Conduct Medal",
  "Rifle Expert · 4th Award",
  "Global War on Terrorism Medal",
  "National Defense Medal",
  "Overseas Service Ribbon",
];

export type Operation = { year: string; title: string; detail: string };

export const OPERATIONS: Operation[] = [
  { year: "2005", title: "Hurricane Katrina", detail: "His first rescue — at age 14." },
  {
    year: "2012",
    title: "Okinawa typhoons",
    detail:
      "On the ground for four typhoons while serving in the Marines — most notably Super Typhoon Jelawat.",
  },
  {
    year: "2017",
    title: "Hurricane Harvey",
    detail:
      "His first hurricane as a civilian. Raised $30,000+ in supplies — a boat, motor, diapers, food, formula, water — for families in dire straits.",
  },
  {
    year: "2018",
    title: "Hurricane Florence",
    detail:
      "Drove 2,000+ miles and led water rescues for dozens of women, infants, elderly, disabled, and animals.",
  },
  {
    year: "2018",
    title: "Hurricane Michael",
    detail:
      "Worked alongside the U.S. Coast Guard on Med-Evac helicopter rescues in Panama City; search-and-rescue for an eight-months-pregnant woman whose home had collapsed on top of her.",
  },
  {
    year: "2019",
    title: "Hurricane Barry",
    detail: "Teamed with Cajun Navy 2016 in Jeanerette, Louisiana.",
  },
  {
    year: "2019",
    title: "Hurricane Dorian",
    detail: "Cleared roads for first responders across the Carolinas.",
  },
  {
    year: "2019",
    title: "Tropical Storm Imelda",
    detail:
      "High-water horse rescue in Vidor, Texas; rescued an elderly bedridden man and his disabled family.",
  },
  {
    year: "2020",
    title: "Tropical Storm Cristobal",
    detail:
      "Louisiana & Biloxi. Among the first on scene when a missing couple was found after 24 hours; rescued 20–30+ from flooded roads.",
  },
  {
    year: "2020",
    title: "Hurricanes Arthur & Hanna",
    detail: "Pulled people and vehicles from ditches as the eyewall hit.",
  },
  {
    year: "2020",
    title: "Hurricane Laura",
    detail:
      "Welfare checks and cleanup; reconnected distraught mothers with their stranded children.",
  },
  {
    year: "2020",
    title: "Hurricane Sally",
    detail:
      "Foley, Alabama — rescued 50+ people in a single day on video. Many were babies, children, and elderly. Removed a near-death man from a collapsed building.",
  },
];

export const RECOGNITION = [
  "The Ellen Show",
  "ABC News · David Muir",
  "A&E",
  "The Weather Channel",
  "Daily Mail",
  "KLTV",
  "RUPTLY USA",
  "The Big Bid Theory",
];
