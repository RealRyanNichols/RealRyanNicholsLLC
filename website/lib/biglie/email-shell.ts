import { SITE } from "@/lib/site";
import { makeToken } from "@/lib/biglie/token";

/**
 * Table-based, inline-styled HTML shell for The BIG Lie daily emails. Built to
 * survive Gmail, Outlook, and Apple Mail: no <style> blocks that matter, no
 * flexbox, no external CSS.
 *
 * The 30 days run in eight chapters, and each chapter carries its own accent
 * colour and cover treatment, so a month of mail never reads as the same email
 * thirty times.
 */

const NAVY = "#071126";
const NAVY2 = "#0b1830";
const LINE = "#203a64";
const CREAM = "#fdf8ea";
const MUTE = "#9fb2d0";
const GOLD = "#e1bd5b";

export type Chapter = {
  num: number;
  name: string;
  accent: string;
  /** deep tint used behind cover blocks in this chapter */
  wash: string;
  days: [number, number];
};

export const CHAPTERS: Chapter[] = [
  { num: 1, name: "Where this came from", accent: "#e1bd5b", wash: "#1a1608", days: [1, 3] },
  { num: 2, name: "The tunnel", accent: "#e0533f", wash: "#210f0c", days: [4, 7] },
  { num: 3, name: "The playbook", accent: "#8a93f8", wash: "#111433", days: [8, 10] },
  { num: 4, name: "It came true", accent: "#4cc38a", wash: "#0b1f1a", days: [11, 13] },
  { num: 5, name: "The record", accent: "#e0913f", wash: "#20150a", days: [14, 19] },
  { num: 6, name: "The man", accent: "#c9a7f5", wash: "#1a1226", days: [20, 22] },
  { num: 7, name: "The tools", accent: "#3fbfc0", wash: "#08201f", days: [23, 24] },
  { num: 8, name: "Your turn", accent: "#e1bd5b", wash: "#1a1608", days: [25, 30] },
];

export function chapterFor(day: number): Chapter {
  return CHAPTERS.find((c) => day >= c.days[0] && day <= c.days[1]) ?? CHAPTERS[0];
}

export type EmailButton = { label: string; href: string; kind?: "solid" | "ghost" };
export type PollOption = { key: string; label: string };
export type Poll = { questionKey: string; prompt: string; options: PollOption[] };

export type DayBlock =
  | { type: "p"; text: string }
  | { type: "lead"; text: string }
  | { type: "h"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "then_now"; then: string; now: string; tag: string }
  | { type: "stat"; value: string; label: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: EmailButton[] }
  | { type: "callout"; kicker: string; text: string }
  | { type: "poll"; poll: Poll }
  /** A chart from the report, hosted on the site. `src` is a filename slug. */
  | { type: "chart"; src: string; alt: string; caption?: string; href?: string }
  /** Full-bleed colour band for a single hard line. */
  | { type: "band"; text: string }
  /** Numbered list, used for inventories and steps. */
  | { type: "numbers"; items: { n: string; t: string; d: string }[] };

export type EmailDay = {
  day: number;
  subject: string;
  preview: string;
  kicker: string;
  title: string;
  blocks: DayBlock[];
};

const CHART_BASE = `${SITE.url}/thebiglie/charts`;

function btn(b: EmailButton, accent: string): string {
  const solid = (b.kind ?? "solid") === "solid";
  const bg = solid ? accent : "transparent";
  const color = solid ? NAVY : CREAM;
  const border = solid ? accent : LINE;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 8px 6px 0;display:inline-block"><tr><td style="border-radius:8px;background:${bg};border:2px solid ${border}">
<a href="${b.href}" style="display:inline-block;padding:13px 26px;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${color};text-decoration:none">${b.label}</a>
</td></tr></table>`;
}

function pollBlock(p: Poll, email: string, accent: string): string {
  const base = `${SITE.url}/api/biglie/answer`;
  const tok = makeToken(email);
  const rows = p.options
    .map((o) => {
      const href = `${base}?t=${encodeURIComponent(tok)}&q=${encodeURIComponent(p.questionKey)}&a=${encodeURIComponent(o.key)}`;
      return `<tr><td style="padding:5px 0">
<a href="${href}" style="display:block;padding:13px 18px;border:1.5px solid ${LINE};border-radius:9px;background:${NAVY};color:${CREAM};font-family:Georgia,serif;font-size:15px;font-weight:bold;text-decoration:none">${o.label}</a>
</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;border:2px solid ${accent};border-radius:12px;background:${NAVY2}"><tr><td style="padding:20px 22px">
<div style="font-family:Georgia,serif;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${accent};padding-bottom:10px">One question</div>
<div style="font-family:Georgia,serif;font-size:18px;font-weight:bold;color:${CREAM};line-height:1.4;padding-bottom:12px">${p.prompt}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
<div style="font-family:Georgia,serif;font-size:12px;color:${MUTE};padding-top:8px">One tap. It helps me build what comes next.</div>
</td></tr></table>`;
}

function renderBlock(b: DayBlock, email: string, ch: Chapter): string {
  const A = ch.accent;
  switch (b.type) {
    case "p":
      return `<p style="margin:0 0 16px;font-family:Georgia,serif;font-size:16px;line-height:1.72;color:${CREAM}">${b.text}</p>`;
    case "lead":
      return `<p style="margin:0 0 16px;font-family:Georgia,serif;font-size:19px;font-weight:bold;line-height:1.5;color:${A}">${b.text}</p>`;
    case "h":
      return `<div style="margin:26px 0 12px;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:${CREAM}">${b.text}</div>`;
    case "quote":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;border-left:4px solid ${A};background:${NAVY2}"><tr><td style="padding:16px 20px">
<div style="font-family:Georgia,serif;font-size:18px;font-weight:bold;line-height:1.5;color:${CREAM}">${b.text}</div>
${b.cite ? `<div style="font-family:Georgia,serif;font-size:13px;color:${MUTE};padding-top:8px">${b.cite}</div>` : ""}
</td></tr></table>`;
    case "then_now":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 14px;border:1px solid ${LINE};border-radius:12px;overflow:hidden"><tr>
<td width="50%" valign="top" style="padding:16px 18px;background:${NAVY2};border-right:1px solid ${LINE}">
<div style="font-family:Georgia,serif;font-size:10px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:#8a93f8;padding-bottom:8px">What I wrote, in the cell</div>
<div style="font-family:Georgia,serif;font-size:14px;font-weight:bold;line-height:1.5;color:${CREAM}">${b.then}</div></td>
<td width="50%" valign="top" style="padding:16px 18px;background:#0b1f1a">
<div style="font-family:Georgia,serif;font-size:10px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:#4cc38a;padding-bottom:8px">${b.tag}</div>
<div style="font-family:Georgia,serif;font-size:14px;line-height:1.5;color:#cfe3d8">${b.now}</div></td>
</tr></table>`;
    case "stat":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 14px;border:2px solid ${A};border-radius:12px;background:${ch.wash}"><tr><td align="center" style="padding:26px 20px">
<div style="font-family:Georgia,serif;font-size:46px;font-weight:bold;color:${A};line-height:1">${b.value}</div>
<div style="font-family:Georgia,serif;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${MUTE};padding-top:10px">${b.label}</div>
</td></tr></table>`;
    case "divider":
      return `<div style="height:1px;background:${LINE};margin:22px 0"></div>`;
    case "buttons":
      return `<div style="margin:6px 0 12px">${b.buttons.map((x) => btn(x, A)).join("")}</div>`;
    case "callout":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;border:1px solid ${A};border-radius:12px;background:${ch.wash}"><tr><td style="padding:18px 20px">
<div style="font-family:Georgia,serif;font-size:11px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:${A};padding-bottom:8px">${b.kicker}</div>
<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:${CREAM}">${b.text}</div>
</td></tr></table>`;
    case "band":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0"><tr><td align="center" style="padding:24px 22px;background:${A};border-radius:12px">
<div style="font-family:Georgia,serif;font-size:21px;font-weight:bold;line-height:1.35;color:${NAVY}">${b.text}</div>
</td></tr></table>`;
    case "numbers":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 14px">${b.items
        .map(
          (it) => `<tr><td style="padding:5px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};border-radius:10px;background:${NAVY2}"><tr>
<td width="52" valign="top" style="padding:15px 0 15px 18px;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:${A}">${it.n}</td>
<td valign="top" style="padding:15px 18px 15px 0">
<div style="font-family:Georgia,serif;font-size:16px;font-weight:bold;color:${CREAM}">${it.t}</div>
<div style="font-family:Georgia,serif;font-size:14px;line-height:1.55;color:${MUTE};padding-top:3px">${it.d}</div>
</td></tr></table></td></tr>`,
        )
        .join("")}</table>`;
    case "chart": {
      const img = `<img src="${CHART_BASE}/${b.src}.png" alt="${b.alt}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border-radius:10px;border:1px solid ${LINE}">`;
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 16px"><tr><td align="center">
${b.href ? `<a href="${b.href}" style="text-decoration:none">${img}</a>` : img}
${b.caption ? `<div style="font-family:Georgia,serif;font-size:12px;color:${MUTE};padding-top:9px;text-align:left">${b.caption}</div>` : ""}
</td></tr></table>`;
    }
    case "poll":
      return pollBlock(b.poll, email, A);
  }
}

export function renderDayEmail(day: EmailDay, email: string): string {
  const ch = chapterFor(day.day);
  const A = ch.accent;
  const stopHref = `${SITE.url}/api/biglie/stop?t=${encodeURIComponent(makeToken(email))}`;
  const pct = Math.round((day.day / 30) * 100);
  const body = day.blocks.map((b) => renderBlock(b, email, ch)).join("\n");
  const finale = day.day === 30;

  // Chapter pips: eight dots, the current one filled.
  const pips = CHAPTERS.map((c) => {
    const on = c.num === ch.num;
    const done = c.num < ch.num;
    return `<td style="padding:0 3px"><div style="width:${on ? 22 : 8}px;height:8px;border-radius:99px;background:${on ? A : done ? "#3a4straight" : LINE}"></div></td>`;
  })
    .join("")
    .replace(/#3a4straight/g, "#46608f");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><title>${day.subject}</title></head>
<body style="margin:0;padding:0;background:#05060f">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${day.preview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05060f"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${NAVY};border:1px solid ${LINE};border-radius:16px;overflow:hidden">

<tr><td style="padding:0">
<div style="height:5px;background:${A};font-size:0;line-height:0">&nbsp;</div>
</td></tr>

<tr><td style="padding:18px 26px 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-family:Georgia,serif;font-size:13px;font-weight:bold;letter-spacing:1px;color:${CREAM}">REAL RYAN NICHOLS</td>
<td align="right" style="font-family:Georgia,serif;font-size:11px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:${A}">Day ${day.day} / 30</td>
</tr></table>
<div style="font-family:Georgia,serif;font-size:11px;font-weight:bold;letter-spacing:1.6px;text-transform:uppercase;color:${MUTE};padding-top:10px">Chapter ${ch.num} of 8 &middot; ${ch.name}</div>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:9px"><tr>${pips}</tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:11px"><tr>
<td style="height:5px;background:${LINE};border-radius:99px"><table role="presentation" width="${pct}%" cellpadding="0" cellspacing="0"><tr><td style="height:5px;background:${A};border-radius:99px;font-size:0;line-height:0">&nbsp;</td></tr></table></td>
</tr></table>
</td></tr>

<tr><td style="padding:${finale ? "26px" : "22px"} 26px 8px">
${finale ? `<div style="font-family:Georgia,serif;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${A};padding-bottom:10px">&#9733; You made it &#9733;</div>` : ""}
<div style="font-family:Georgia,serif;font-size:11px;font-weight:bold;letter-spacing:1.6px;text-transform:uppercase;color:${A}">${day.kicker}</div>
<div style="font-family:Georgia,serif;font-size:${finale ? 32 : 28}px;font-weight:bold;line-height:1.15;color:${CREAM};padding-top:8px">${day.title}</div>
</td></tr>

<tr><td style="padding:6px 26px 8px">
${body}
</td></tr>

<tr><td style="padding:14px 26px 26px;border-top:1px solid ${LINE}">
<div style="font-family:Georgia,serif;font-size:13px;font-weight:bold;color:${CREAM}">Ryan Nichols</div>
<div style="font-family:Georgia,serif;font-size:12px;color:${MUTE};padding-top:2px">realryannichols.com</div>
<div style="font-family:Georgia,serif;font-size:11px;color:#6b7ea0;padding-top:12px;line-height:1.6">
Do not threaten anyone. Do not harass anyone. Read it. Share it. Send receipts.<br>
You are on this list because you asked for The BIG Lie.
<a href="${stopHref}" style="color:${MUTE};text-decoration:underline">Stop these emails.</a><br>
${SITE.mailingAddress || "Real Ryan Nichols LLC"}
</div>
</td></tr>

</table>
<div style="font-family:Georgia,serif;font-size:11px;color:#48597a;padding-top:14px">Nothing here is legal advice. Ryan Nichols is not an attorney.</div>
</td></tr></table>
</body></html>`;
}

export function renderDayText(day: EmailDay): string {
  const ch = chapterFor(day.day);
  const lines: string[] = [
    `REAL RYAN NICHOLS — Day ${day.day} of 30`,
    `Chapter ${ch.num} of 8: ${ch.name}`,
    "",
    day.title,
    "",
  ];
  for (const b of day.blocks) {
    if (b.type === "p" || b.type === "lead" || b.type === "h" || b.type === "band")
      lines.push(strip(b.text), "");
    else if (b.type === "quote") lines.push(`"${strip(b.text)}"`, b.cite ? strip(b.cite) : "", "");
    else if (b.type === "then_now")
      lines.push(`IN THE CELL: ${strip(b.then)}`, `${b.tag.toUpperCase()}: ${strip(b.now)}`, "");
    else if (b.type === "stat") lines.push(`${b.value} — ${b.label}`, "");
    else if (b.type === "callout") lines.push(`[${b.kicker}] ${strip(b.text)}`, "");
    else if (b.type === "chart") lines.push(`[Chart: ${b.alt}]`, b.caption ? strip(b.caption) : "", "");
    else if (b.type === "numbers")
      for (const it of b.items) lines.push(`${it.n}. ${strip(it.t)} — ${strip(it.d)}`);
    else if (b.type === "buttons") for (const x of b.buttons) lines.push(`${x.label}: ${x.href}`);
    else if (b.type === "poll") {
      lines.push(strip(b.poll.prompt));
      for (const o of b.poll.options) lines.push(`  - ${o.label}`);
      lines.push("");
    }
  }
  lines.push("", "Ryan Nichols — realryannichols.com");
  return lines.join("\n");
}

function strip(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&mdash;/g, "—")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&middot;/g, "·");
}
