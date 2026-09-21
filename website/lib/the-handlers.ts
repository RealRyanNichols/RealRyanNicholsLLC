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
  facebookUrl: "https://www.facebook.com/RealRyanNicholsSr/",
  tiktokUrl: "https://www.tiktok.com/@therealryannichols",
  instagramUrl: "https://www.instagram.com/realryannichols/",
} as const;

// Add an episode only after its public YouTube URL has been verified. The site
// intentionally uses YouTube as the primary player so every embedded watch can
// contribute to one channel's watch time and subscriber growth. The other
// platform URLs are optional until their exact live posts are verified.
export const HANDLERS_EPISODES: HandlersEpisode[] = [];
