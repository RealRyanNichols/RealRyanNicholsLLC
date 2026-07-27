import { SITE } from "@/lib/site";
import { makeToken } from "@/lib/biglie/token";

/**
 * Table-based, inline-styled HTML shell for The BIG Lie daily emails. Built to
 * survive Gmail, Outlook, and Apple Mail: no <style> blocks that matter, no
 * flexbox, no external CSS. Dark navy on gold, matching realryannichols.com.
 */

const NAVY = "#071126";
const NAVY2 = "#0b1830";
const LINE = "#203a64";
const GOLD = "#e1bd5b";
const CREAM = "#fdf8ea";
const MUTE = "#9fb2d0";
const GREEN = "#4cc38a";
const BLUE = "#8a93f8";

export type EmailButton = { label: string; href: string; kind?: "gold" | "ghost" };

export type PollOption = { key: string; label: string };
export type Poll = {
  questionKey: string;
  prompt: string;
  options: PollOption[];
};

export type DayBlock =
  | { type: "p"; text: string }
  | { type: "lead"; text: string }
  | { type: "h"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "then_now"; then: string; now: string; tag: string }
  | { type: "stat"; value: string; label: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: EmailButton[] }
  | { type: "callout"; kicker: string; text: string; color?: "gold" | "green" | "blue" }
  | { type: "poll"; poll: Poll };

export type EmailDay = {
  day: number;
  subject: string;
  preview: string;
  kicker: string;
  title: string;
  blocks: DayBlock[];
};

function btn(b: EmailButton): string {
  const gold = (b.kind ?? "gold") === "gold";
  const bg = gold ? GOLD : "transparent";
  const color = gold ? NAVY : CREAM;
  const border = gold ? GOLD : LINE;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 8px 6px 0;display:inline-block"><tr><td style="border-radius:8px;background:${bg};border:2px solid ${border}">
<a href="${b.href}" style="display:inline-block;padding:13px 26px;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${color};text-decoration:none">${b.label}</a>
</td></tr></table>`;
}

function pollBlock(p: Poll, email: string): string {
  const base = `${SITE.url}/api/biglie/answer`;
  const tok = makeToken(email);
  const rows = p.options
    .map((o) => {
      const href = `${base}?t=${encodeURIComponent(tok)}&q=${encodeURIComponent(
        p.questionKey,
      )}&a=${encodeURIComponent(o.key)}`;
      return `<tr><td style="padding:5px 0">
<a href="${href}" style="display:block;padding:13px 18px;border:1.5px solid ${LINE};border-radius:9px;background:${NAVY};color:${CREAM};font-family:Georgia,serif;font-size:15px;font-weight:bold;text-decoration:none">${o.label}</a>
</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;border:1px solid ${LINE};border-radius:12px;background:${NAVY2}"><tr><td style="padding:20px 22px">
<div style="font-family:Georgia,serif;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};padding-bottom:10px">One question</div>
<div style="font-family:Georgia,serif;font-size:18px;font-weight:bold;color:${CREAM};line-height:1.4;padding-bottom:12px">${p.prompt}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
<div style="font-family:Georgia,serif;font-size:12px;color:${MUTE};padding-top:8px">One tap. It helps me build what comes next.</div>
</td></tr></table>`;
}

function renderBlock(b: DayBlock, email: string): string {
  switch (b.type) {
    case "p":
      return `<p style="margin:0 0 16px;font-family:Georgia,serif;font-size:16px;line-height:1.72;color:${CREAM}">${b.text}</p>`;
    case "lead":
      return `<p style="margin:0 0 16px;font-family:Georgia,serif;font-size:19px;font-weight:bold;line-height:1.5;color:${GOLD}">${b.text}</p>`;
    case "h":
      return `<div style="margin:26px 0 12px;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:${CREAM}">${b.text}</div>`;
    case "quote":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;border-left:4px solid ${GOLD};background:${NAVY2}"><tr><td style="padding:16px 20px">
<div style="font-family:Georgia,serif;font-size:18px;font-weight:bold;line-height:1.5;color:${CREAM}">${b.text}</div>
${b.cite ? `<div style="font-family:Georgia,serif;font-size:13px;color:${MUTE};padding-top:8px">${b.cite}</div>` : ""}
</td></tr></table>`;
    case "then_now":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 14px;border:1px solid ${LINE};border-radius:12px;overflow:hidden"><tr>
<td width="50%" valign="top" style="padding:16px 18px;background:${NAVY2};border-right:1px solid ${LINE}">
<div style="font-family:Georgia,serif;font-size:10px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:${BLUE};padding-bottom:8px">What I wrote, in the cell</div>
<div style="font-family:Georgia,serif;font-size:14px;font-weight:bold;line-height:1.5;color:${CREAM}">${b.then}</div></td>
<td width="50%" valign="top" style="padding:16px 18px;background:#0b1f1a">
<div style="font-family:Georgia,serif;font-size:10px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:${GREEN};padding-bottom:8px">${b.tag}</div>
<div style="font-family:Georgia,serif;font-size:14px;line-height:1.5;color:#cfe3d8">${b.now}</div></td>
</tr></table>`;
    case "stat":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 14px;border:1px solid ${LINE};border-radius:12px;background:${NAVY2}"><tr><td align="center" style="padding:22px">
<div style="font-family:Georgia,serif;font-size:40px;font-weight:bold;color:${GOLD};line-height:1">${b.value}</div>
<div style="font-family:Georgia,serif;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${MUTE};padding-top:8px">${b.label}</div>
</td></tr></table>`;
    case "divider":
      return `<div style="height:1px;background:${LINE};margin:22px 0"></div>`;
    case "buttons":
      return `<div style="margin:6px 0 12px">${b.buttons.map(btn).join("")}</div>`;
    case "callout": {
      const c = b.color === "green" ? GREEN : b.color === "blue" ? BLUE : GOLD;
      const bg = b.color === "green" ? "#0b1f1a" : NAVY2;
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;border:1px solid ${c};border-radius:12px;background:${bg}"><tr><td style="padding:18px 20px">
<div style="font-family:Georgia,serif;font-size:11px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:${c};padding-bottom:8px">${b.kicker}</div>
<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:${CREAM}">${b.text}</div>
</td></tr></table>`;
    }
    case "poll":
      return pollBlock(b.poll, email);
  }
}

export function renderDayEmail(day: EmailDay, email: string): string {
  const stopHref = `${SITE.url}/api/biglie/stop?t=${encodeURIComponent(makeToken(email))}`;
  const progress = Math.round((day.day / 30) * 100);
  const body = day.blocks.map((b) => renderBlock(b, email)).join("\n");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><title>${day.subject}</title></head>
<body style="margin:0;padding:0;background:#05060f">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${day.preview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05060f"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${NAVY};border:1px solid ${LINE};border-radius:16px;overflow:hidden">

<tr><td style="padding:20px 26px 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-family:Georgia,serif;font-size:13px;font-weight:bold;letter-spacing:1px;color:${CREAM}">REAL RYAN NICHOLS</td>
<td align="right" style="font-family:Georgia,serif;font-size:11px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:${GOLD}">Day ${day.day} of 30</td>
</tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px"><tr>
<td style="height:6px;background:${LINE};border-radius:99px"><table role="presentation" width="${progress}%" cellpadding="0" cellspacing="0"><tr><td style="height:6px;background:${GOLD};border-radius:99px;font-size:0;line-height:0">&nbsp;</td></tr></table></td>
</tr></table>
</td></tr>

<tr><td style="padding:24px 26px 8px">
<div style="font-family:Georgia,serif;font-size:11px;font-weight:bold;letter-spacing:1.6px;text-transform:uppercase;color:${GOLD}">${day.kicker}</div>
<div style="font-family:Georgia,serif;font-size:28px;font-weight:bold;line-height:1.15;color:${CREAM};padding-top:8px">${day.title}</div>
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
  const lines: string[] = [`REAL RYAN NICHOLS — Day ${day.day} of 30`, "", day.title, ""];
  for (const b of day.blocks) {
    if (b.type === "p" || b.type === "lead" || b.type === "h") lines.push(strip(b.text), "");
    else if (b.type === "quote") lines.push(`"${strip(b.text)}"`, b.cite ? strip(b.cite) : "", "");
    else if (b.type === "then_now")
      lines.push(`IN THE CELL: ${strip(b.then)}`, `${b.tag.toUpperCase()}: ${strip(b.now)}`, "");
    else if (b.type === "stat") lines.push(`${b.value} — ${b.label}`, "");
    else if (b.type === "callout") lines.push(`[${b.kicker}] ${strip(b.text)}`, "");
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
  return s.replace(/<[^>]+>/g, "").replace(/&mdash;/g, "—").replace(/&ldquo;|&rdquo;/g, '"');
}
