-- Skema TernakKu. Sama dengan migrasi yang diterapkan ke project Supabase.

-- Profil pengguna (consent AI, kontak dokter hewan)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  consent_answered boolean not null default false,
  ai_enabled boolean not null default true,
  vet_phone text,
  created_at timestamptz not null default now()
);

-- Ternak dan silsilah. Kunci: (owner_id, id) supaya nomor tag unik per peternak.
create table public.livestock (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 32),
  name text,
  species text not null default 'sapi',
  sex text check (sex in ('J', 'B')),
  sire_id text,
  dam_id text,
  created_at timestamptz not null default now(),
  primary key (owner_id, id),
  foreign key (owner_id, sire_id) references public.livestock (owner_id, id) on delete set null (sire_id),
  foreign key (owner_id, dam_id) references public.livestock (owner_id, id) on delete set null (dam_id),
  check (id is distinct from sire_id and id is distinct from dam_id)
);

-- Catatan kesehatan (riwayat; yang terbaru dipakai untuk skor)
create table public.health_records (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  livestock_id text not null,
  age_months numeric not null check (age_months between 0 and 400),
  parity int not null check (parity between 0 and 15),
  lactation_stage text not null check (lactation_stage in ('Early', 'Mid', 'Late')),
  days_in_milk int not null check (days_in_milk between 0 and 700),
  body_condition_score numeric not null check (body_condition_score between 1 and 5),
  milk_yield_l numeric not null check (milk_yield_l between 0 and 80),
  previous_week_avg_yield numeric not null check (previous_week_avg_yield between 0 and 80),
  vaccine_count int not null check (vaccine_count between 0 and 8),
  recorded_at timestamptz not null default now(),
  foreign key (owner_id, livestock_id) references public.livestock (owner_id, id) on delete cascade
);

-- Hasil skor risiko
create table public.risk_results (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  livestock_id text not null,
  risk_level text not null check (risk_level in ('Rendah', 'Sedang', 'Tinggi')),
  confidence numeric not null check (confidence between 0 and 1),
  prob_sakit numeric not null check (prob_sakit between 0 and 1),
  top_factors jsonb not null default '[]'::jsonb,
  recommended_actions text not null,
  disclaimer text not null,
  model_version text not null,
  created_at timestamptz not null default now(),
  foreign key (owner_id, livestock_id) references public.livestock (owner_id, id) on delete cascade
);

-- Riwayat perkawinan
create table public.matings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sire_id text not null,
  dam_id text not null,
  mating_date date not null default current_date,
  related boolean not null default false,
  relation text not null default '',
  kinship numeric not null default 0,
  note text not null default '',
  created_at timestamptz not null default now(),
  foreign key (owner_id, sire_id) references public.livestock (owner_id, id) on delete cascade,
  foreign key (owner_id, dam_id) references public.livestock (owner_id, id) on delete cascade
);

-- Laporan "hasil tidak sesuai"
create table public.risk_feedback (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  livestock_id text not null,
  risk_result_id bigint references public.risk_results (id) on delete set null,
  comment text not null default '',
  created_at timestamptz not null default now(),
  foreign key (owner_id, livestock_id) references public.livestock (owner_id, id) on delete cascade
);

create index on public.health_records (owner_id, livestock_id, recorded_at desc);
create index on public.risk_results (owner_id, livestock_id, created_at desc);
create index on public.matings (owner_id, sire_id);
create index on public.matings (owner_id, dam_id);
create index on public.risk_feedback (owner_id, livestock_id);
create index on public.risk_feedback (risk_result_id);
create index on public.livestock (owner_id, sire_id);
create index on public.livestock (owner_id, dam_id);

-- Row Level Security: setiap peternak hanya melihat dan mengubah datanya sendiri
alter table public.profiles enable row level security;
alter table public.livestock enable row level security;
alter table public.health_records enable row level security;
alter table public.risk_results enable row level security;
alter table public.matings enable row level security;
alter table public.risk_feedback enable row level security;

create policy "profil sendiri" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "ternak sendiri" on public.livestock for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "catatan kesehatan sendiri" on public.health_records for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "skor risiko sendiri" on public.risk_results for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "perkawinan sendiri" on public.matings for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "laporan sendiri" on public.risk_feedback for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

-- Profil dibuat otomatis saat pengguna mendaftar
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
