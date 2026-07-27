/**
 * Best-effort Notion sync for BIG Lie subscriber profiles.
 *
 * Supabase is the durable source of truth. If NOTION_API_KEY and
 * NOTION_BIGLIE_DB are set in the environment, each poll answer also upserts a
 * subscriber page in that Notion database so Ryan sees living profiles, and
 * appends a recommended next action. If they are not set, this is a no-op and
 * nothing breaks.
 */

const API = "https://api.notion.com/v1";

function creds() {
  const key = process.env.NOTION_API_KEY;
  const db = process.env.NOTION_BIGLIE_DB;
  if (!key || !db) return null;
  return { key, db };
}

function headers(key: string): Record<string, string> {
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28",
  };
}

/** Map an answer to a short profile signal + a recommended next action. */
export function recommend(questionKey: string, answer: string): {
  segment?: string;
  action: string;
} {
  const k = `${questionKey}:${answer}`;
  const map: Record<string, { segment?: string; action: string }> = {
    "who_are_you:j6_family": { segment: "J6 Family", action: "Offer a free J6 case profile. Send the tips link personally." },
    "who_are_you:journalist": { segment: "Journalist", action: "Grant evidence-archive access. Offer an interview or a direct source line." },
    "who_are_you:supporter": { segment: "Supporter", action: "Warm for Fighting Shadows pre-order by day 26." },
    "who_are_you:east_texan": { segment: "East Texan", action: "Local. High trust. Ask for a share and a Harrison County tip." },
    "who_are_you:curious": { segment: "Curious", action: "Keep nurturing. The came-true days (11-13) are the conversion moment." },
    "have_receipts:yes_have": { segment: "Has receipts", action: "PRIORITY. Reach out personally within 24h and route the tip." },
    "have_receipts:know_someone": { segment: "Knows a source", action: "Ask for an introduction. Send a forwardable tips link." },
    "book_interest:preorder_now": { segment: "Book buyer intent", action: "Send a direct pre-order link now while intent is hot." },
    "book_interest:when_out": { segment: "Book waitlist", action: "Add to launch-announce list." },
    "will_share_final:done": { segment: "Shared", action: "Advocate. Thank them and ask them to invite one more." },
    "will_share_final:today": { segment: "Will share", action: "Follow up in 2 days to confirm and thank." },
    "what_moves_you:justice": { action: "Lead future emails with the disparity and double-standard angle." },
    "what_moves_you:evidence": { action: "Lead with charts and sourcing." },
    "what_moves_you:faith_story": { action: "Lead with the memoir and the survival arc." },
    "what_moves_you:j6_personal": { segment: "Personally affected", action: "High care. Offer the free profile and a direct line." },
  };
  return map[k] ?? { action: "Continue the sequence." };
}

async function findPage(key: string, db: string, email: string): Promise<string | null> {
  const res = await fetch(`${API}/databases/${db}/query`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({ filter: { property: "Email", email: { equals: email } }, page_size: 1 }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: { id: string }[] };
  return json.results?.[0]?.id ?? null;
}

export async function syncAnswerToNotion(opts: {
  email: string;
  day: number;
  questionKey: string;
  answer: string;
  answerLabel: string;
}): Promise<void> {
  const c = creds();
  if (!c) return;
  const { key, db } = c;
  const rec = recommend(opts.questionKey, opts.answer);
  try {
    const existing = await findPage(key, db, opts.email);
    const note = `Day ${opts.day}: ${opts.questionKey} = ${opts.answerLabel}`;
    const props: Record<string, unknown> = {
      "Last Answer": { rich_text: [{ text: { content: note.slice(0, 1900) } }] },
      "Next Action": { rich_text: [{ text: { content: rec.action.slice(0, 1900) } }] },
      "Last Day": { number: opts.day },
    };
    if (rec.segment) props["Segment"] = { select: { name: rec.segment } };

    if (existing) {
      await fetch(`${API}/pages/${existing}`, {
        method: "PATCH",
        headers: headers(key),
        body: JSON.stringify({ properties: props }),
      });
      await fetch(`${API}/blocks/${existing}/children`, {
        method: "PATCH",
        headers: headers(key),
        body: JSON.stringify({
          children: [
            { object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: `${note} → ${rec.action}` } }] } },
          ],
        }),
      });
    } else {
      await fetch(`${API}/pages`, {
        method: "POST",
        headers: headers(key),
        body: JSON.stringify({
          parent: { database_id: db },
          properties: {
            Name: { title: [{ text: { content: opts.email } }] },
            Email: { email: opts.email },
            ...props,
          },
        }),
      });
    }
  } catch {
    // Never break the click on a Notion failure.
  }
}
