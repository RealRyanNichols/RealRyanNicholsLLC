export type HandlersEpisode = {
  number: number;
  title: string;
  hook: string;
  duration: string;
  publishedAt: string;
  youtubeId: string;
  xUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  instagramUrl?: string;
};

export const HANDLERS_SERIES = {
  title: "The Handlers",
  motto: "TRUTH IS OPTIONAL. RIDICULE IS MANDATORY.",
  description:
    "Washington runs on handlers, receipts, and people hoping nobody reads the fine print. This is where the recurring cast keeps the record moving.",
  youtubeUrl: "https://www.youtube.com/@RealRyanNichols",
  xUrl: "https://x.com/RealRyanNichols",
  facebookUrl: "https://www.facebook.com/RealRyanNichols/",
  tiktokUrl: "https://www.tiktok.com/@therealryannichols",
  instagramUrl: "https://www.instagram.com/realryannichols/",
} as const;

// Add an episode only after its public YouTube URL has been verified. The site
// intentionally uses YouTube as the primary player so every embedded watch can
// contribute to one channel's watch time and subscriber growth. The other
// platform URLs are optional until their exact live posts are verified.
export const HANDLERS_EPISODES: HandlersEpisode[] = [
  {
    number: 11,
    title: "The Age Machine",
    hook: "At eighteen, Washington calls you an adult at one counter and says 'not quite' at the next. The Handler follows the wiring to the Justice Department's September 18 legal opinion.",
    duration: "PT58S",
    publishedAt: "2026-09-21",
    youtubeId: "yYC_-qdPv1Q",
    facebookUrl: "https://www.facebook.com/reel/957948036676237",
  },
  {
    number: 10,
    title: "The Maple Leaf Checkout",
    hook: "A government checkout lane seems to run in only one direction. The Handler pulls the receipt on a September 16 White House procurement memorandum.",
    duration: "PT57S",
    publishedAt: "2026-09-21",
    youtubeId: "5plkFGodIlk",
    xUrl: "https://x.com/RealRyanNichols/status/2102044004137263446",
  },
];
