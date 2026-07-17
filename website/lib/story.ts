import { OPERATIONS, type Operation } from "@/lib/bio";

// The Story system: every operation in Ryan's rescue record gets its own
// full page at /story/<slug>. This registry ENRICHES lib/bio's OPERATIONS
// (the single source of truth, Exhibit 288) — it never restates the record,
// it builds around it: public context for the event, his involvement told
// fully, why it matters in the arc, recognition, and media slots that fill
// as photos/footage land in /public/uploads/story/<slug>/.
//
// Classification discipline: `context` is public-record framing of the
// event itself; `involvement` expands HIS account from the filed biography.

export type StoryMedia = { src: string; alt: string; caption?: string };

export type StoryChapter = Operation & {
  slug: string;
  context: string;
  involvement: string;
  significance: string;
  recognition?: { outlet: string; note: string }[];
  media: StoryMedia[];
};

function slugify(title: string, year: string): string {
  return (
    title
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    year
  );
}

type Enrichment = Omit<StoryChapter, keyof Operation | "slug" | "media"> & {
  media?: StoryMedia[];
};

const ENRICHMENT: Record<string, Enrichment> = {
  "hurricane-katrina-2005": {
    context:
      "August 2005. Hurricane Katrina drowned the Gulf Coast — one of the deadliest and costliest storms in American history, with whole neighborhoods underwater from Louisiana to Mississippi.",
    involvement:
      "Ryan was fourteen years old. This is where the record starts: his first rescue, years before the Marine Corps, decades before the case. The kid who went toward the water instead of away from it.",
    significance:
      "Everything that follows — the Marine, the boat captain, the man wading into floodwater for strangers — traces back to this storm.",
  },
  "okinawa-typhoons-2012": {
    context:
      "2012, Okinawa, Japan. The Pacific typhoon season battered the island chain — most notably Super Typhoon Jelawat, one of the strongest storms on Earth that year, which struck Okinawa directly.",
    involvement:
      "Ryan was on the ground for four typhoons while serving with the 9th Communications Battalion, U.S. Marine Corps — storm response as duty, not volunteering. Jelawat was the one nobody stationed there forgot.",
    significance:
      "The military chapter of the rescue record: where disaster response became training, not just instinct.",
  },
  "hurricane-harvey-2017": {
    context:
      "August 2017. Hurricane Harvey stalled over southeast Texas and dropped historic rainfall — tens of thousands of water rescues, entire cities flooded, one of the worst rainfall disasters in U.S. history.",
    involvement:
      "His first hurricane as a civilian. Ryan raised more than $30,000 in supplies — a boat, a motor, diapers, food, formula, water — and put it directly into the hands of families in dire straits.",
    significance:
      "The turn: from a Marine who responded when ordered to a civilian who deployed himself. Harvey is where Rescue the Universe begins in practice.",
  },
  "hurricane-florence-2018": {
    context:
      "September 2018. Hurricane Florence flooded the Carolinas for days — rivers cresting long after landfall, communities cut off, thousands stranded by rising water.",
    involvement:
      "Ryan drove more than 2,000 miles and led water rescues for dozens of people — women, infants, the elderly, the disabled — and their animals. Boat work, door to door, day after day.",
    significance:
      "The deployment the country noticed. Ellen DeGeneres put his Florence rescues on national television, sponsored Rescue the Universe with a new rescue boat, and donated $25,000 to the Animal Humane Society in his honor.",
    recognition: [
      {
        outlet: "The Ellen Show",
        note: "Recognized his Florence rescues on air — a new rescue boat for Rescue the Universe and $25,000 to the Animal Humane Society in his honor.",
      },
    ],
  },
  "hurricane-michael-2018": {
    context:
      "October 2018. Hurricane Michael hit the Florida Panhandle at Category 5 — near-total destruction in Mexico Beach and Panama City, one of the strongest landfalls ever recorded in the United States.",
    involvement:
      "Ryan worked alongside the U.S. Coast Guard on Med-Evac helicopter rescues in Panama City, and ran search-and-rescue for an eight-months-pregnant woman whose home had collapsed on top of her.",
    significance:
      "The record's proof of range: not just boats and floodwater — helicopter medical evacuation alongside the Coast Guard in catastrophic wind damage.",
  },
  "hurricane-barry-2019": {
    context:
      "July 2019. Hurricane Barry pushed slow-moving Gulf water into south Louisiana, flooding low-lying parishes.",
    involvement:
      "Ryan teamed with Cajun Navy 2016 in Jeanerette, Louisiana — volunteer rescue networks working side by side.",
    significance:
      "The rescue world runs on trust between crews. Barry is where the record shows Ryan inside that network, not alongside it.",
  },
  "hurricane-dorian-2019": {
    context:
      "September 2019. After devastating the Bahamas, Hurricane Dorian raked the Carolina coast with wind, surge, and downed trees across whole counties.",
    involvement:
      "Ryan cleared roads for first responders across the Carolinas — the unglamorous work that decides whether ambulances and utility crews can move at all.",
    significance:
      "Not every deployment is a boat rescue on video. The record includes the chainsaw work that never trends.",
  },
  "tropical-storm-imelda-2019": {
    context:
      "September 2019. Tropical Storm Imelda dumped feet of rain on southeast Texas with almost no warning — flash flooding on a Harvey scale in some towns.",
    involvement:
      "In Vidor, Texas: a high-water horse rescue, and the rescue of an elderly bedridden man and his disabled family from rising water.",
    significance:
      "Animals and the people other plans forget — the bedridden, the disabled. The record shows who gets carried out when Ryan is on scene.",
  },
  "tropical-storm-cristobal-2020": {
    context:
      "June 2020. Tropical Storm Cristobal drove Gulf water into Louisiana and coastal Mississippi, cutting off roads and stranding drivers.",
    involvement:
      "Louisiana and Biloxi. Ryan was among the first on scene when a missing couple was found after 24 hours, and pulled 20 to 30-plus people from flooded roads.",
    significance:
      "Speed matters in the record: first on scene is a habit, not a coincidence.",
  },
  "hurricanes-arthur-and-hanna-2020": {
    context:
      "2020. Arthur brushed the Carolinas early in the season; Hanna hit south Texas in July as the year's first hurricane — high wind and water on the roads while the storms were still overhead.",
    involvement:
      "Ryan pulled people and vehicles from ditches as the eyewall hit — working the storm during the storm, not after it.",
    significance:
      "Most crews stage and wait. The record shows the riskier choice, made twice in one season.",
  },
  "hurricane-laura-2020": {
    context:
      "August 2020. Hurricane Laura hit southwest Louisiana at Category 4 — among the strongest landfalls in the state's history, with entire communities unlivable overnight.",
    involvement:
      "Welfare checks and cleanup, house by house — and reconnecting distraught mothers with their stranded children.",
    significance:
      "After the wind, the record is about people finding each other. Laura is the reunification chapter.",
  },
  "hurricane-sally-2020": {
    context:
      "September 2020. Hurricane Sally crawled ashore near Gulf Shores, Alabama, flooding coastal Alabama and the Florida Panhandle with feet of rain.",
    involvement:
      "Foley, Alabama: Ryan rescued more than 50 people in a single day — much of it on video. Babies, children, the elderly. He removed a near-death man from a collapsed building.",
    significance:
      "The single biggest day in the rescue record, and one of its best-documented — the footage exists.",
  },
};

export const STORY_CHAPTERS: StoryChapter[] = OPERATIONS.map((op) => {
  const slug = slugify(op.title, op.year);
  const extra = ENRICHMENT[slug];
  return {
    ...op,
    slug,
    context: extra?.context ?? "",
    involvement: extra?.involvement ?? op.detail,
    significance: extra?.significance ?? "",
    recognition: extra?.recognition,
    media: extra?.media ?? [],
  };
});

export function getStoryChapter(slug: string): StoryChapter | undefined {
  return STORY_CHAPTERS.find((c) => c.slug === slug);
}

export function storySlugFor(op: Operation): string {
  return slugify(op.title, op.year);
}
