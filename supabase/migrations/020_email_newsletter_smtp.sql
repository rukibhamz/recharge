-- Newsletter subscribers, email send log, and default SMTP settings slot.

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null,
  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed')),
  source text not null default 'results'
    check (source in ('results', 'account', 'admin', 'other')),
  session_id uuid references public.sessions (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create unique index if not exists newsletter_subscribers_email_uidx
  on public.newsletter_subscribers (lower(email));

create index if not exists newsletter_subscribers_status_idx
  on public.newsletter_subscribers (status, subscribed_at desc);

alter table public.newsletter_subscribers enable row level security;

comment on table public.newsletter_subscribers is
  'Opt-in newsletter list. Managed via API service role only.';

create table if not exists public.email_sends (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null
    check (kind in ('results', 'newsletter', 'newsletter_test', 'smtp_test')),
  to_email text not null,
  subject text not null default '',
  status text not null default 'sent'
    check (status in ('sent', 'failed')),
  error text not null default '',
  session_id uuid references public.sessions (id) on delete set null,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists email_sends_kind_created_idx
  on public.email_sends (kind, created_at desc);

alter table public.email_sends enable row level security;

comment on table public.email_sends is
  'Outbound email audit log (results + newsletters). Service role only.';

insert into public.app_settings (key, value)
values (
  'smtp',
  jsonb_build_object(
    'host', '',
    'port', 587,
    'secure', false,
    'user', '',
    'pass', '',
    'fromName', 'Recharge',
    'fromEmail', 'recharge@thedigitalerrand.com'
  )
)
on conflict (key) do nothing;
