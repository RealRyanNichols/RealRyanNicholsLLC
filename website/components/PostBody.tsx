import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TweetEmbed } from "./TweetEmbed";
import { DonateBox } from "./DonateBox";
import { FundTheTruth } from "./FundTheTruth";
import { ReactionBar } from "./ReactionBar";
import { InlineReportForm } from "./InlineReportForm";
import { DemandAction } from "./DemandAction";
import { ShareRow } from "./ShareRow";

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

function parseVideoArg(arg: string | undefined) {
  const [src, poster, caption] = (arg ?? "").split("|").map((part) => part.trim());
  if (!src || (!src.startsWith("/") && !src.startsWith("https://"))) return null;
  return {
    src,
    poster: poster || undefined,
    caption: caption || undefined,
  };
}

function isSafeMediaSrc(src: string) {
  return src.startsWith("/") || src.startsWith("https://");
}

function parseCaseBannerArg(arg: string | undefined) {
  const [title, subtitle, statOne, statTwo, statThree] = (arg ?? "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!title || !subtitle) return null;
  return {
    title,
    subtitle,
    stats: [statOne, statTwo, statThree].filter(Boolean),
  };
}

function parseReceiptGridArg(arg: string | undefined) {
  return (arg ?? "")
    .split("|")
    .map((raw) => {
      const [src, title, caption, tag] = raw.split("::").map((part) => part.trim());
      if (!src || !title || !isSafeMediaSrc(src)) return null;
      return {
        src,
        title,
        caption: caption || undefined,
        tag: tag || undefined,
      };
    })
    .filter((item): item is { src: string; title: string; caption?: string; tag?: string } => Boolean(item));
}

function CaseBanner({ arg }: { arg?: string }) {
  const banner = parseCaseBannerArg(arg);
  if (!banner) return null;
  return (
    <section className="not-prose my-8 overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-blue-strong)] text-[#fdf8ea] shadow-sm">
      <div className="border-b border-white/15 bg-black/20 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
        Public Evidence Wall
      </div>
      <div className="px-5 py-6 sm:px-7 sm:py-8">
        <h2 className="font-serif text-3xl font-black leading-[0.95] tracking-tight text-[#fdf8ea] sm:text-5xl">
          {banner.title}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
          {banner.subtitle}
        </p>
        {banner.stats.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {banner.stats.map((stat) => (
              <div key={stat} className="rounded-md border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-sm font-semibold leading-snug text-[#fdf8ea]">{stat}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="h-2 bg-[var(--color-accent)]" aria-hidden />
    </section>
  );
}

function ReceiptGrid({ arg }: { arg?: string }) {
  const receipts = parseReceiptGridArg(arg);
  if (receipts.length === 0) return null;
  return (
    <section className="not-prose my-8 grid gap-4 md:grid-cols-2">
      {receipts.map((receipt) => (
        <figure
          key={`${receipt.src}-${receipt.title}`}
          className="overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm"
        >
          <div className="bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receipt.src}
              alt={receipt.title}
              className="h-auto max-h-[440px] w-full object-contain"
              loading="lazy"
            />
          </div>
          <figcaption className="space-y-2 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold leading-snug text-[var(--color-ink)]">{receipt.title}</p>
              {receipt.tag ? (
                <span className="shrink-0 rounded-full bg-[var(--color-blue-soft)] px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-[var(--color-blue)]">
                  {receipt.tag}
                </span>
              ) : null}
            </div>
            {receipt.caption ? (
              <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">{receipt.caption}</p>
            ) : null}
          </figcaption>
        </figure>
      ))}
    </section>
  );
}

function Shortcode({ kind, arg, ctx }: { kind: string; arg?: string; ctx: Ctx }) {
  switch (kind) {
    case "casebanner":
      return <CaseBanner arg={arg} />;
    case "receiptgrid":
      return <ReceiptGrid arg={arg} />;
    case "donate":
      return (
        <div className="not-prose my-7">
          <DonateBox />
        </div>
      );
    // The unified donation tool. `impact` is kept as an alias so any stray
    // legacy token still renders the one tool instead of a broken block.
    case "fund":
    case "impact":
      return (
        <div className="not-prose my-7">
          <FundTheTruth />
        </div>
      );
    case "share":
      return (
        <div className="not-prose my-7">
          <ShareRow />
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
    case "video": {
      const video = parseVideoArg(arg);
      if (!video) return null;
      return (
        <figure className="not-prose my-7">
          <video
            controls
            playsInline
            preload="metadata"
            poster={video.poster}
            controlsList="nodownload"
            aria-label={video.caption ?? "Video receipt"}
            className="w-full max-h-[760px] rounded-lg border border-[var(--color-line)] bg-black"
          >
            <source src={video.src} type="video/mp4" />
          </video>
          {video.caption ? (
            <figcaption className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              {video.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }
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
