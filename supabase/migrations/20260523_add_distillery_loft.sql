-- Add the second rental space: 1BR Distillery Loft.

insert into public.pricing_settings (
  unit_id,
  base_weekday_rate,
  base_weekend_rate,
  distillery_premium,
  eaa_weekly_target,
  cleaning_fee,
  benchmark_monthly_rent
)
values (
  'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76',
  125,
  155,
  20,
  2800,
  85,
  900
)
on conflict (unit_id) do nothing;

drop policy if exists pricing_settings_authenticated_unit on public.pricing_settings;

create policy pricing_settings_authenticated_unit
on public.pricing_settings
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

drop policy if exists guest_portal_content_authenticated_unit
  on public.guest_portal_content;

create policy guest_portal_content_authenticated_unit
on public.guest_portal_content
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

drop policy if exists guest_portal_sessions_authenticated_unit
  on public.guest_portal_sessions;

create policy guest_portal_sessions_authenticated_unit
on public.guest_portal_sessions
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

drop policy if exists guest_portal_message_requests_authenticated_unit
  on public.guest_portal_message_requests;

create policy guest_portal_message_requests_authenticated_unit
on public.guest_portal_message_requests
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
    'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76',
    'welcome',
    'Welcome',
    'Welcome to the Distillery Loft at Sturgeon Spirits. Use this portal for stay details, access information, and questions during your visit.',
    10,
    true
  ),
  (
    'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76',
    'arrival',
    'Arrival & Parking',
    'Add loft-specific arrival instructions, parking notes, and property access details here.',
    20,
    true
  ),
  (
    'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76',
    'house-rules',
    'House Rules',
    'Add the essentials guests should know during the stay, including quiet hours, smoking policy, pet policy, and anything specific to the loft.',
    30,
    true
  ),
  (
    'f7b8e2a1-6c4d-4f2a-9a3b-2c1d0e9f8a76',
    'checkout',
    'Checkout',
    'Use this section for loft departure reminders such as checkout time, dishes, trash, towels, and locking up before leaving.',
    40,
    true
  )
on conflict (unit_id, section_key) do nothing;
