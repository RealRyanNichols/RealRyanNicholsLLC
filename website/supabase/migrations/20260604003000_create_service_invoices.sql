-- Admin receivables: private service invoices backed by Stripe-hosted invoices.
-- Public users never read this table directly; Stripe hosts the payment page.

create table if not exists public.service_invoices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  client_name text not null,
  client_email text,
  client_phone text,
  title text not null default 'Real Ryan Nichols LLC service invoice',
  description text not null,
  memo text,
  amount_cents integer not null check (amount_cents > 0),
  amount_paid_cents integer not null default 0 check (amount_paid_cents >= 0),
  currency text not null default 'usd',
  status text not null default 'draft'
    check (status in ('draft','open','paid','void','uncollectible','failed')),
  due_at timestamptz,
  sent_at timestamptz,
  paid_at timestamptz,
  stripe_customer_id text,
  stripe_invoice_id text unique,
  stripe_hosted_invoice_url text,
  stripe_invoice_pdf text,
  stripe_last_error text
);

alter table public.service_invoices enable row level security;

drop policy if exists service_invoices_admin_all on public.service_invoices;
create policy service_invoices_admin_all
on public.service_invoices
for all
using (public.is_admin((select auth.uid())))
with check (public.is_admin((select auth.uid())));

create index if not exists service_invoices_status_idx
  on public.service_invoices (status, created_at desc);

create index if not exists service_invoices_due_at_idx
  on public.service_invoices (due_at)
  where status in ('draft','open','failed');
