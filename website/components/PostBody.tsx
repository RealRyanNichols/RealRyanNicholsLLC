import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TweetEmbed } from "./TweetEmbed";

const TWEET_RE = /^https?:\/\/(x\.com|twitter\.com)\/[^/]+\/status\/\d+/i;

// A paragraph that is nothing but a single X/Twitter status link becomes
// an inline embed (video + author credit). Anything else renders normally.
type HastNode = {
  children?: Array<{
    tagName?: string;
    properties?: { href?: unknown };
  }>;
};

function soleTweetHref(node: HastNode | undefined): string | null {
  const kids = node?.children ?? [];
  if (kids.length !== 1) return null;
  const only = kids[0];
  if (only?.tagName !== "a") return null;
  const href = only.properties?.href;
  return typeof href === "string" && TWEET_RE.test(href) ? href : null;
}

export function PostBody({ body }: { body: string }) {
  return (
    <div className="prose-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ node, children }) {
            const href = soleTweetHref(node as HastNode | undefined);
            if (href) return <TweetEmbed url={href} />;
            return <p>{children}</p>;
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
