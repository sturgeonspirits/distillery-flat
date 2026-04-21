create table if not exists public.guest_portal_content (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null,
  section_key text not null,
  title text not null,
  body text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists guest_portal_content_unit_key_idx
  on public.guest_portal_content (unit_id, section_key);

create table if not exists public.guest_portal_sessions (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  access_token text not null unique,
  expires_at timestamptz null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz null
);

create unique index if not exists guest_portal_sessions_one_active_per_reservation_idx
  on public.guest_portal_sessions (reservation_id)
  where revoked_at is null;

create index if not exists guest_portal_sessions_token_idx
  on public.guest_portal_sessions (access_token);

create table if not exists public.guest_portal_message_requests (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  session_id uuid not null references public.guest_portal_sessions(id) on delete cascade,
  guest_name text not null,
  guest_email text null,
  guest_phone text null,
  message text not null,
  status text not null default 'new'
    check (status in ('new', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create index if not exists guest_portal_message_requests_unit_status_idx
  on public.guest_portal_message_requests (unit_id, status, created_at desc);

alter table public.guest_portal_content enable row level security;
alter table public.guest_portal_sessions enable row level security;
alter table public.guest_portal_message_requests enable row level security;

drop policy if exists guest_portal_content_authenticated_unit
  on public.guest_portal_content;

create policy guest_portal_content_authenticated_unit
on public.guest_portal_content
for all
to authenticated
using (unit_id = 'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid)
with check (unit_id = 'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid);

drop policy if exists guest_portal_sessions_authenticated_unit
  on public.guest_portal_sessions;

create policy guest_portal_sessions_authenticated_unit
on public.guest_portal_sessions
for all
to authenticated
using (unit_id = 'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid)
with check (unit_id = 'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid);

drop policy if exists guest_portal_message_requests_authenticated_unit
  on public.guest_portal_message_requests;

create policy guest_portal_message_requests_authenticated_unit
on public.guest_portal_message_requests
for all
to authenticated
using (unit_id = 'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid)
with check (unit_id = 'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid);

insert into public.guest_portal_content (
  unit_id,
  section_key,
  title,
  body,
  sort_order,
  is_active
)
values
  (
    'cdd0a039-ef0a-44b5-a68d-339866029d42',
    'welcome',
    'Welcome',
    'Welcome to the Distillery Flat at Sturgeon Spirits. We are glad to host you and want your stay to feel smooth from arrival through checkout.

Use this portal for stay details, access information, and questions during your visit.',
    10,
    true
  ),
  (
    'cdd0a039-ef0a-44b5-a68d-339866029d42',
    'arrival',
    'Arrival & Parking',
    'Arrival instructions, parking notes, and property access details can live here.

Update this section with any EAA-week guidance, special parking instructions, or arrival reminders.',
    20,
    true
  ),
  (
    'cdd0a039-ef0a-44b5-a68d-339866029d42',
    'house-rules',
    'House Rules',
    'Add the essentials guests should know during the stay: quiet hours, occupancy expectations, smoking policy, pet policy, and anything specific to the distillery property.',
    30,
    true
  ),
  (
    'cdd0a039-ef0a-44b5-a68d-339866029d42',
    'checkout',
    'Checkout',
    'Use this section for departure reminders such as checkout time, dishes, trash, towels, and locking up before leaving.',
    40,
    true
  ),
  (
    'cdd0a039-ef0a-44b5-a68d-339866029d42',
    'distillery',
    'Distillery Experience',
    'Use this section to highlight tasting-room hours, event details, bottle shopping, or any guest-specific on-property offers.',
    50,
    true
  )
on conflict (unit_id, section_key) do nothing;
