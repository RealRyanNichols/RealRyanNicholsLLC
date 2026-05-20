// Shared video-platform URL detection. Used by EvidenceGrid and the case-doc
// detail page so a video evidence URL renders as an embedded player instead
// of a broken <img>.

export type VideoEmbed = {
  kind: "tiktok" | "youtube" | "x";
  id: string;
  embedUrl: string;
  watchUrl: string;
  platformLabel: string;
};

export function detectVideo(url: string | null | undefined): VideoEmbed | null {
  if (!url) return null;

  // TikTok: https://www.tiktok.com/@username/video/12345
  const tt = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (tt) {
    return {
      kind: "tiktok",
      id: tt[1],
      embedUrl: `https://www.tiktok.com/embed/v2/${tt[1]}`,
      watchUrl: url,
      platformLabel: "TikTok",
    };
  }

  // YouTube: watch?v=ID, youtu.be/ID, embed/ID, shorts/ID
  const yt = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,})/,
  );
  if (yt) {
    return {
      kind: "youtube",
      id: yt[1],
      embedUrl: `https://www.youtube.com/embed/${yt[1]}`,
      watchUrl: url,
      platformLabel: "YouTube",
    };
  }

  // X / Twitter: twitter.com/USER/status/ID or x.com/USER/status/ID
  const xt = url.match(/(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/);
  if (xt) {
    return {
      kind: "x",
      id: xt[1],
      embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${xt[1]}`,
      watchUrl: url,
      platformLabel: "X (Twitter)",
    };
  }

  return null;
}
