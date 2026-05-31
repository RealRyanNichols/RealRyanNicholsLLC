import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TweetEmbed } from "./TweetEmbed";
import { DonateBox } from "./DonateBox";
import { FundAllocator } from "./FundAllocator";
import { ReactionBar } from "./ReactionBar";
import { InlineReportForm } from "./InlineReportForm";
import { DemandAction } from "./DemandAction";

const TWEET_RE = /^https?:\/\/(x\.com|twitter\.com)\/[^/]+\/status\/\d+/i;
// A paragraph that is only {{donate}} / {{report}} / {{poll: prompt}} /
// {{demand}} becomes a live interactive block. Authors (and Codex) drop these
// tokens into the markdown; they render as real components on the article page,
// and are hidden in non-interactive contexts (feed cards / previews).
const SHORTCODE_RE = /^\{\{\s*(\w+)\s*(?::\s*([\s\S]+?))?\s*\}\}$/;

type HastNode = {
  tagName?: string;
  value?: string;
  properties?: { href?: unknown };
  children?: HastNode[];
};

function soleTweetHref(node: HastNode | undefined): string | null {
  const kids = node?.children ?? [];
  if (kids.length !== 1) return null;
  const only = kids[0];
  if (only?.tagName !== "a") return null;
  const href = only.properties?.href;
  return typeof href === "string" && TWEET_RE.test(href) ? href : null;
}

function nodeText(node: HastNode | undefined): string {
  if (!node) return "";
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(nodeText).join("");
}

type Ctx = { postId?: string; slug?: string; title?: string };

function Shortcode({ kind, arg, ctx }: { kind: string; arg?: string; ctx: Ctx }) {
  switch (kind) {
    case "donate":
      return (
        <div className="not-prose my-7">
          <DonateBox />
        </div>
      );
    case "fund":
      return (
        <div className="not-prose my-7">
          <FundAllocator />
        </div>
      );
    case "report":
      return (
        <div className="not-prose my-7">
          <InlineReportForm subject={arg || ctx.title} />
        </div>
      );
    case "poll":
    case "react":
      return ctx.postId ? (
        <div className="not-prose my-7">
          <ReactionBar
            targetType="post"
            targetId={ctx.postId}
            prompt={arg ?? "How does this hit you? Tap — no signup."}
          />
        </div>
      ) : null;
    case "demand":
      return (
        <div className="not-prose my-7">
          <DemandAction slug={ctx.slug} />
        </div>
      );
    default:
      return null;
  }
}

export function PostBody({
  body,
  interactive = false,
  postId,
  slug,
  title,
}: {
  body: string;
  interactive?: boolean;
  postId?: string;
  slug?: string;
  title?: string;
}) {
  const ctx: Ctx = { postId, slug, title };
  return (
    <div className="prose-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ node, children }) {
            const n = node as HastNode | undefined;
            const href = soleTweetHref(n);
            if (href) return <TweetEmbed url={href} />;
            const m = nodeText(n).trim().match(SHORTCODE_RE);
            if (m) {
              // Hide the token entirely in feed cards / previews.
              if (!interactive) return null;
              return <Shortcode kind={m[1].toLowerCase()} arg={m[2]?.trim()} ctx={ctx} />;
            }
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
