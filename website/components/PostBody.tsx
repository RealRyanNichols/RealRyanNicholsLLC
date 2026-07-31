import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import { TweetEmbed } from "./TweetEmbed";
import { FacebookEmbed } from "./FacebookEmbed";
import { BookCtaBand } from "./BookCtaBand";
import { ReactionBar } from "./ReactionBar";
import { PollCard } from "./PollCard";
import { InlineReportForm } from "./InlineReportForm";
import { DemandAction } from "./DemandAction";
import { ShareRow } from "./ShareRow";
import { Receipt } from "./article/Receipt";
import { ArticleChart } from "./article/ArticleChart";
import { ArticleFigure } from "./article/ArticleFigure";
import { ArticleEmbed } from "./article/ArticleEmbed";
import { Callout } from "./article/Callout";
import { RelatedPosts } from "./article/RelatedPosts";
import { parseBodySegments, type ShortcodeBlock } from "@/lib/shortcodes";
import { linkFirstMentions } from "@/lib/entity-links";

const TWEET_RE = /^https?:\/\/(x\.com|twitter\.com)\/[^/]+\/status\/\d+/i;
const FB_POST_RE =
  /^https?:\/\/(?:www\.|m\.|web\.)?facebook\.com\/(?:[^/?#]+\/posts\/[\w.-]+|share\/p\/[\w-]+|permalink\.php\?\S+|story\.php\?\S+)/i;
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

function soleFacebookHref(node: HastNode | undefined): string | null {
  const kids = node?.children ?? [];
  if (kids.length !== 1) return null;
  const only = kids[0];
  if (only?.tagName !== "a") return null;
  const href = only.properties?.href;
  return typeof href === "string" && FB_POST_RE.test(href) ? href : null;
}

function nodeText(node: HastNode | undefined): string {
  if (!node) return "";
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(nodeText).join("");
}

type Ctx = { postId?: string; slug?: string; title?: string };

type ReceiptGridItem = {
  src: string;
  title: string;
  caption?: string;
  tag?: string;
};

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
    .map<ReceiptGridItem | null>((raw) => {
      const [src, title, caption, tag] = raw.split("::").map((part) => part.trim());
      if (!src || !title || !isSafeMediaSrc(src)) return null;
      const item: ReceiptGridItem = { src, title };
      if (caption) item.caption = caption;
      if (tag) item.tag = tag;
      return item;
    })
    .filter((item): item is ReceiptGridItem => item !== null);
}

function renderLinkedText(text: string) {
  const parts: ReactNode[] = [];
  const urlRe = /https?:\/\/\S+/g;
  let lastIndex = 0;
  let index = 0;

  for (const match of text.matchAll(urlRe)) {
    const matchIndex = match.index ?? 0;
    let url = match[0];
    let trailing = "";
    while (/[.,;:!?)]$/.test(url)) {
      trailing = `${url.slice(-1)}${trailing}`;
      url = url.slice(0, -1);
    }

    if (matchIndex > lastIndex) parts.push(text.slice(lastIndex, matchIndex));
    parts.push(
      <a
        key={`${url}-${index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-[var(--color-accent)] underline underline-offset-2"
      >
        source
      </a>,
    );
    if (trailing) parts.push(trailing);
    lastIndex = matchIndex + match[0].length;
    index += 1;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

function CaseBanner({ arg }: { arg?: string }) {
  const banner = parseCaseBannerArg(arg);
  if (!banner) return null;
  return (
    <section className="not-prose my-8 overflow-hidden rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-blue-strong)] text-[#fdf8ea] shadow-sm">
      <div className="border-b border-white/15 bg-black/25 px-5 py-3 text-xs font-black uppercase tracking-normal text-white/80">
        Public Evidence Wall
      </div>
      <div className="px-5 py-6 sm:px-7 sm:py-8">
        <h2 className="font-display text-4xl font-black leading-none tracking-normal text-[#fdf8ea] sm:text-6xl">
          {banner.title}
        </h2>
        <p className="mt-5 max-w-3xl text-base font-medium leading-relaxed text-white/85 sm:text-lg">
          {banner.subtitle}
        </p>
        {banner.stats.length > 0 ? (
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {banner.stats.map((stat) => (
              <div key={stat} className="rounded-md border border-white/20 bg-white/10 px-4 py-3">
                <p className="text-sm font-black leading-snug text-[#fdf8ea]">{stat}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="h-2 bg-[var(--color-accent)]" aria-hidden />
    </section>
  );
}

function ReceiptFigure({
  receipt,
  imageClassName,
}: {
  receipt: ReceiptGridItem;
  imageClassName: string;
}) {
  return (
    <figure className="overflow-hidden rounded-lg border-2 border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm">
      <div className="bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={receipt.src}
          alt={receipt.title}
          className={imageClassName}
          loading="lazy"
        />
      </div>
      <figcaption className="space-y-2 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-black leading-snug text-[var(--color-ink)]">{receipt.title}</p>
          {receipt.tag ? (
            <span className="shrink-0 rounded-full bg-[var(--color-blue-soft)] px-2 py-0.5 text-[0.68rem] font-black uppercase tracking-normal text-[var(--color-blue)]">
              {receipt.tag}
            </span>
          ) : null}
        </div>
        {receipt.caption ? (
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {renderLinkedText(receipt.caption)}
          </p>
        ) : null}
      </figcaption>
    </figure>
  );
}

function ReceiptGrid({ arg }: { arg?: string }) {
  const receipts = parseReceiptGridArg(arg);
  if (receipts.length === 0) return null;
  return (
    <section className="not-prose my-9 grid gap-5 md:grid-cols-2">
      {receipts.map((receipt) => (
        <ReceiptFigure
          key={`${receipt.src}-${receipt.title}`}
          receipt={receipt}
          imageClassName="h-auto max-h-[520px] w-full object-contain"
        />
      ))}
    </section>
  );
}

function ReceiptStack({ arg }: { arg?: string }) {
  const receipts = parseReceiptGridArg(arg);
  if (receipts.length === 0) return null;
  return (
    <section className="not-prose my-9 space-y-6">
      {receipts.map((receipt) => (
        <ReceiptFigure
          key={`${receipt.src}-${receipt.title}`}
          receipt={receipt}
          imageClassName="h-auto w-full object-contain"
        />
      ))}
    </section>
  );
}

function Shortcode({
  kind,
  arg,
  json,
  ctx,
}: {
  kind: string;
  arg?: string;
  json?: Record<string, unknown>;
  ctx: Ctx;
}) {
  switch (kind) {
    // ---- The article-richness vocabulary (JSON or pipe payloads). ----
    case "receipt":
      return json ? <Receipt value={json} /> : null;
    case "chart":
      return json ? <ArticleChart value={json} /> : null;
    case "figure":
      return json ? <ArticleFigure value={json} /> : null;
    case "embed":
      return json ? <ArticleEmbed value={json} /> : null;
    case "callout": {
      const args = (arg ?? "").split("|").map((s) => s.trim());
      return <Callout args={args} />;
    }
    case "related": {
      const slugs = (arg ?? "").split("|").map((s) => s.trim()).filter(Boolean);
      return <RelatedPosts slugs={slugs} />;
    }
    case "casebanner":
      return <CaseBanner arg={arg} />;
    case "receiptgrid":
      return <ReceiptGrid arg={arg} />;
    case "receiptstack":
      return <ReceiptStack arg={arg} />;
    // Donations are retired — legacy {{donate}}, {{fund}}, and {{impact}}
    // tokens in old articles now sell the book instead of asking for gifts.
    case "donate":
    case "book":
    case "preorder":
    case "fund":
    case "impact":
      return (
        <div className="not-prose my-7">
          <BookCtaBand />
        </div>
      );
    case "share":
      return (
        <div className="not-prose my-7">
          <ShareRow />
        </div>
      );
    case "report": {
      // {{report}} → defaults. Optional pipe-delimited overrides:
      // {{report: subject | kicker | heading | blurb | placeholder | button }}
      const [rSubject, rKicker, rHeading, rBlurb, rPlaceholder, rButton] = (arg ?? "")
        .split("|")
        .map((s) => s.trim());
      return (
        <div className="not-prose my-7">
          <InlineReportForm
            subject={rSubject || ctx.title}
            kicker={rKicker || undefined}
            heading={rHeading || undefined}
            blurb={rBlurb || undefined}
            placeholder={rPlaceholder || undefined}
            buttonLabel={rButton || undefined}
          />
        </div>
      );
    }
    case "poll": {
      // {{poll: Question? | Option A | Option B | ...}} → a real one-tap poll
      // with email-gated results. A bare {{poll}} (or {{poll: prompt}} with no
      // options) keeps the legacy behavior and renders the reaction bar.
      const parts = (arg ?? "").split("|").map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 3 && ctx.postId) {
        const [pollQuestion, ...pollOptions] = parts;
        const qSlug = pollQuestion
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 60);
        return (
          <div className="not-prose my-7">
            <PollCard
              pollKey={`post:${ctx.postId}:${qSlug}`}
              question={pollQuestion}
              options={pollOptions.slice(0, 6)}
            />
          </div>
        );
      }
      return ctx.postId ? (
        <div className="not-prose my-7">
          <ReactionBar
            targetType="post"
            targetId={ctx.postId}
            prompt={arg ?? "How does this hit you? Tap — no signup."}
          />
        </div>
      ) : null;
    }
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

const KNOWN_SHORTCODES = new Set([
  "receipt",
  "chart",
  "figure",
  "embed",
  "callout",
  "related",
  "casebanner",
  "receiptgrid",
  "receiptstack",
  "donate",
  "book",
  "preorder",
  "fund",
  "impact",
  "share",
  "report",
  "poll",
  "react",
  "demand",
  "video",
]);

// One shortcode block from the pre-markdown parser. Unknown names and broken
// JSON render as literal text so a typo is VISIBLE in the admin preview and
// never crashes or silently vanishes on the article page.
function BlockSegment({
  block,
  interactive,
  ctx,
}: {
  block: ShortcodeBlock;
  interactive: boolean;
  ctx: Ctx;
}) {
  const known = KNOWN_SHORTCODES.has(block.name);
  const broken = block.parsed.type === "invalid";
  if (!known || broken) {
    if (!interactive) return null; // feed cards hide tokens entirely
    return (
      <p className="my-4 whitespace-pre-wrap break-words rounded-md border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 font-mono text-xs text-[var(--color-ink-soft)]">
        {block.raw}
      </p>
    );
  }
  if (!interactive) return null;
  return (
    <Shortcode
      kind={block.name}
      arg={block.payload}
      json={block.parsed.type === "json" ? block.parsed.value : undefined}
      ctx={ctx}
    />
  );
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

  // 1. Split the body into markdown chunks and shortcode blocks BEFORE
  //    markdown rendering, so JSON payloads can span lines and fenced code
  //    can show a shortcode without running it.
  const segments = parseBodySegments(body);

  // 2. Auto-link the first mention of known entities (article view only —
  //    feed cards are already links themselves).
  const mdChunks = segments.filter((s) => s.kind === "markdown").map((s) => s.text);
  const linkedChunks = interactive ? linkFirstMentions(mdChunks).chunks : mdChunks;
  let mdIndex = -1;

  const markdownComponents = {
    p({ node, children }: { node?: unknown; children?: ReactNode }) {
      const n = node as HastNode | undefined;
      const href = soleTweetHref(n);
      if (href) return <TweetEmbed url={href} />;
      const fbHref = soleFacebookHref(n);
      if (fbHref) return interactive ? <FacebookEmbed url={fbHref} /> : null;
      // Fallback for legacy inline/indented tokens the block parser skipped.
      const m = nodeText(n).trim().match(SHORTCODE_RE);
      if (m) {
        if (!interactive) return null;
        return <Shortcode kind={m[1].toLowerCase()} arg={m[2]?.trim()} ctx={ctx} />;
      }
      return <p>{children}</p>;
    },
    a({ href, children }: { href?: string; children?: ReactNode }) {
      const url = typeof href === "string" ? href : "";
      const internal = url.startsWith("/") || url.startsWith("#");
      return (
        <a
          href={url}
          {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div className="prose-body">
      {segments.map((seg, i) => {
        if (seg.kind === "block") {
          return (
            <BlockSegment key={i} block={seg} interactive={interactive} ctx={ctx} />
          );
        }
        mdIndex += 1;
        const text = linkedChunks[mdIndex] ?? seg.text;
        if (!text.trim()) return null;
        return (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {text}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
