-- Lock down operational tables that predate the checked-in Supabase migrations.
-- Anonymous clients must not be able to read or mutate rental operations data.

alter table if exists public.reservations enable row level security;
alter table if exists public.owner_blocks enable row level security;
alter table if exists public.pricing_rules enable row level security;
alter table if exists public.ical_sources enable row level security;
alter table if exists public.smart_locks enable row level security;
alter table if exists public.lock_access_codes enable row level security;
alter table if exists public.turnover_checklists enable row level security;
alter table if exists public.ical_sync_runs enable row level security;
alter table if exists public.rate_limits enable row level security;

drop policy if exists reservations_authenticated_unit on public.reservations;

create policy reservations_authenticated_unit
on public.reservations
for all
to authenticated
using (
  unit_id in (
    'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid,
    'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid
  )
)
with check (
  unit_id in (
    'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid,
    'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid
  )
);

drop policy if exists owner_blocks_authenticated_unit on public.owner_blocks;

create policy owner_blocks_authenticated_unit
on public.owner_blocks
for all
to authenticated
using (
  unit_id in (
    'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid,
    'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid
  )
)
with check (
  unit_id in (
    'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid,
    'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid
  )
);

drop policy if exists pricing_rules_authenticated on public.pricing_rules;

create policy pricing_rules_authenticated
on public.pricing_rules
for all
to authenticated
using (true)
with check (true);

drop policy if exists ical_sources_authenticated_unit on public.ical_sources;

create policy ical_sources_authenticated_unit
on public.ical_sources
for all
to authenticated
using (
  unit_id in (
    'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid,
    'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid
  )
)
with check (
  unit_id in (
    'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid,
    'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid
  )
);

drop policy if exists smart_locks_authenticated_unit on public.smart_locks;

create policy smart_locks_authenticated_unit
on public.smart_locks
for all
to authenticated
using (
  unit_id in (
    'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid,
    'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid
  )
)
with check (
  unit_id in (
    'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid,
    'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid
  )
);

drop policy if exists turnover_checklists_authenticated_unit on public.turnover_checklists;

create policy turnover_checklists_authenticated_unit
on public.turnover_checklists
for all
to authenticated
using (
  unit_id in (
    'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid,
    'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid
  )
)
with check (
  unit_id in (
    'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid,
    'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid
  )
);

drop policy if exists lock_access_codes_authenticated on public.lock_access_codes;

create policy lock_access_codes_authenticated
on public.lock_access_codes
for all
to authenticated
using (
  exists (
    select 1
    from public.smart_locks
    where smart_locks.id = lock_access_codes.smart_lock_id
      and smart_locks.unit_id in (
        'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid,
        'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid
      )
  )
)
with check (
  exists (
    select 1
    from public.smart_locks
    where smart_locks.id = lock_access_codes.smart_lock_id
      and smart_locks.unit_id in (
        'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid,
        'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid
      )
  )
);
