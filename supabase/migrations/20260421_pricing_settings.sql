create table if not exists public.pricing_settings (
  unit_id uuid primary key,
  base_weekday_rate numeric(10,2) not null check (base_weekday_rate >= 0),
  base_weekend_rate numeric(10,2) not null check (base_weekend_rate >= 0),
  distillery_premium numeric(10,2) not null default 0 check (distillery_premium >= 0),
  eaa_weekly_target numeric(10,2) not null default 0 check (eaa_weekly_target >= 0),
  cleaning_fee numeric(10,2) not null default 0 check (cleaning_fee >= 0),
  benchmark_monthly_rent numeric(10,2) not null default 0 check (benchmark_monthly_rent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  'cdd0a039-ef0a-44b5-a68d-339866029d42',
  210,
  245,
  35,
  5400,
  140,
  1300
)
on conflict (unit_id) do nothing;

alter table public.pricing_settings enable row level security;

drop policy if exists pricing_settings_authenticated_unit on public.pricing_settings;

create policy pricing_settings_authenticated_unit
on public.pricing_settings
for all
to authenticated
using (unit_id = 'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid)
with check (unit_id = 'cdd0a039-ef0a-44b5-a68d-339866029d42'::uuid);
