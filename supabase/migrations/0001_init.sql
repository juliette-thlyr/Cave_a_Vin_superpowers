create table wines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  producer text,
  vintage integer,
  appellation text,
  grape_variety text,
  region text,
  drinking_window_start_year integer,
  drinking_window_end_year integer,
  food_pairing text,
  info_source text not null default 'manuelle' check (info_source in ('manuelle', 'recherche_assistee')),
  photo_url text,
  created_at timestamptz not null default now()
);

create table bottle_instances (
  id uuid primary key default gen_random_uuid(),
  wine_id uuid not null references wines(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  acquisition_mode text not null check (acquisition_mode in ('achat','cadeau','heritage','gagnee','autre')),
  acquisition_source text,
  price_paid numeric(10,2),
  acquisition_date date not null,
  status text not null default 'en_cave' check (status in ('en_cave','consommee')),
  created_at timestamptz not null default now()
);

create table tasting_records (
  id uuid primary key default gen_random_uuid(),
  bottle_instance_id uuid not null references bottle_instances(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rating integer check (rating between 0 and 100),
  notes text,
  tasted_at date not null,
  companions text,
  occasion text,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table wines enable row level security;
alter table bottle_instances enable row level security;
alter table tasting_records enable row level security;

create policy "Users manage their own wines" on wines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own bottles" on bottle_instances
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own tastings" on tasting_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
  on conflict (id) do nothing;
