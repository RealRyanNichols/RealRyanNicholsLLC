-- Adds optional payment-plan terms to private service invoices.
-- Existing one-time invoices continue to work unchanged.

alter table public.service_invoices
  add column if not exists payment_mode text not null default 'full'
    check (payment_mode in ('full','plan')),
  add column if not exists down_payment_cents integer not null default 0
    check (down_payment_cents >= 0),
  add column if not exists installment_cents integer
    check (installment_cents is null or installment_cents > 0),
  add column if not exists installment_interval text
    check (installment_interval is null or installment_interval in ('week','month')),
  add column if not exists installment_count integer
    check (installment_count is null or installment_count > 0),
  add column if not exists stripe_checkout_session_id text unique,
  add column if not exists stripe_subscription_id text;

create index if not exists service_invoices_payment_mode_idx
  on public.service_invoices (payment_mode, status, created_at desc);

create index if not exists service_invoices_subscription_idx
  on public.service_invoices (stripe_subscription_id)
  where stripe_subscription_id is not null;
