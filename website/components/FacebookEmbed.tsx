// Renders a single Facebook post as Meta's official embedded iframe.
// Mirrors TweetEmbed: a paragraph in a post body that is ONLY a Facebook post
// link becomes this block on the article page. Self-contained iframe — no
// client JS required.
export function FacebookEmbed({ url }: { url: string }) {
  const src = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(
    url,
  )}&show_text=true&width=500`;
  return (
    <div className="not-prose my-6 flex justify-center">
      <iframe
        src={src}
        title="Facebook post"
        loading="lazy"
        className="w-full max-w-[500px]"
        style={{ height: 660, border: "none", overflow: "hidden" }}
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
