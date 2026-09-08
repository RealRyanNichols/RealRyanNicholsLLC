-- The Token Fund ledger, restated from docs/usage-receipts-2026-09.md.
--
-- The three old AI lines ($600 build tools, $500 ChatGPT and Codex, $200
-- extra credits) described subscriptions Ryan pays himself and was never
-- asking for. They are retired (kept, inactive) and replaced by:
--   * three 'subscription' rows, off the vendors' invoices, context only;
--   * one 'overage' row, the actual ask: usage credits at published API rates
--     when the week's included usage runs dry. Its amount is an estimate
--     (2.5 uncovered days a week x the measured average day, $156.20 of
--     Claude Fable 5.1 tokens, about $1,692 a month, rounded) until a month
--     runs on credits and the real number replaces it. Editable at
--     /admin/donations like every other line.
-- Idempotent: fixed ids on the inserts, a guarded update on the retirement.
update public.funding_line_items
   set is_active = false,
       updated_at = now()
 where fuel_role is null
   and cadence = 'monthly'
   and is_active
   and label ~* '(claude|chatgpt|codex|grok|credits|ai tool)';

insert into public.funding_line_items
  (id, label, blurb, amount_cents, cadence, sort_order, is_active, fuel_role)
values
  ('a1f5c2e0-4b6d-4e8f-9a01-20260908a001',
   'Claude Max 20x',
   'Paid by Ryan. $200 plus Texas tax, billed by Anthropic on the 23rd. Not the ask.',
   21000, 'monthly', 6, true, 'subscription'),
  ('a1f5c2e0-4b6d-4e8f-9a01-20260908a002',
   'ChatGPT Pro 20x',
   'Paid by Ryan. $200 plus tax, billed by OpenAI on the 25th. Not the ask.',
   21280, 'monthly', 7, true, 'subscription'),
  ('a1f5c2e0-4b6d-4e8f-9a01-20260908a003',
   'X Premium Plus (Grok)',
   'Paid by Ryan. Billed by X on the 16th. Not the ask.',
   4000, 'monthly', 8, true, 'subscription'),
  ('a1f5c2e0-4b6d-4e8f-9a01-20260908a004',
   'Overage usage credits',
   'The ask. The subscriptions run dry by the middle of most weeks, and then the machine stops unless there are credits on the account, billed by the token at published API rates. This target is an estimate: two and a half uncovered days a week at my measured average day ($156.20 of Claude Fable 5.1 tokens). The first month that runs on credits, the real number replaces it.',
   170000, 'monthly', 9, true, 'overage')
on conflict (id) do nothing;
