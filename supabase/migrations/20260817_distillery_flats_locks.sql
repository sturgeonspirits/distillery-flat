-- Rename the two rental spaces in app content and add the standard
-- Distillery Flats Schlage Engage lock setup.

do $$
begin
  if to_regclass('public.smart_locks') is not null then
    alter table public.smart_locks
      add column if not exists applies_to_all_units boolean not null default false;

    alter table public.smart_locks
      drop constraint if exists smart_locks_provider_check;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.smart_locks'::regclass
        and conname = 'smart_locks_provider_check'
    ) then
      alter table public.smart_locks
        add constraint smart_locks_provider_check
        check (
          provider in (
            'schlage_engage',
            'schlage',
            'yale',
            'august',
            'remoteLock',
            'other'
          )
        );
    end if;

    update public.smart_locks
    set provider = 'schlage_engage'
    where provider = 'schlage';

    insert into public.smart_locks (
      unit_id,
      name,
      provider,
      external_lock_id,
      applies_to_all_units,
      is_active
    )
    select
      'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid,
      'Shared Exterior Door',
      'schlage_engage',
      null,
      true,
      true
    where not exists (
      select 1
      from public.smart_locks
      where lower(name) = lower('Shared Exterior Door')
        and applies_to_all_units is true
    );

    insert into public.smart_locks (
      unit_id,
      name,
      provider,
      external_lock_id,
      applies_to_all_units,
      is_active
    )
    select
      'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid,
      'The Rickhouse Apartment Door',
      'schlage_engage',
      null,
      false,
      true
    where not exists (
      select 1
      from public.smart_locks
      where unit_id = 'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid
        and lower(name) = lower('The Rickhouse Apartment Door')
        and applies_to_all_units is false
    );

    insert into public.smart_locks (
      unit_id,
      name,
      provider,
      external_lock_id,
      applies_to_all_units,
      is_active
    )
    select
      'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid,
      'Angel''s Share Apartment Door',
      'schlage_engage',
      null,
      false,
      true
    where not exists (
      select 1
      from public.smart_locks
      where unit_id = 'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid
        and lower(name) = lower('Angel''s Share Apartment Door')
        and applies_to_all_units is false
    );
  end if;
end $$;

update public.guest_portal_content
set body = 'Welcome to The Rickhouse at Sturgeon Spirits Distillery Flats. Use this portal for stay details, shared exterior-door access, apartment-door access, and questions during your visit.'
where unit_id = 'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid
  and section_key = 'welcome';

update public.guest_portal_content
set body = 'Welcome to Angel''s Share at Sturgeon Spirits Distillery Flats. Use this portal for stay details, shared exterior-door access, apartment-door access, and questions during your visit.'
where unit_id = 'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76'::uuid
  and section_key = 'welcome';
