create extension if not exists pgcrypto;

create table if not exists public.artist_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  genre text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists artist_profiles_name_lower_key
  on public.artist_profiles (lower(name));

alter table public.artist_profiles enable row level security;

create or replace function public.set_artist_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_artist_profiles_updated_at on public.artist_profiles;
create trigger set_artist_profiles_updated_at
before update on public.artist_profiles
for each row
execute function public.set_artist_profiles_updated_at();

insert into public.artist_profiles (name)
select distinct btrim(part)
from public.songs
cross join lateral regexp_split_to_table(coalesce(public.songs.artist, ''), '\s*,\s*') as part
where coalesce(btrim(part), '') <> ''
  and not exists (
    select 1
    from public.artist_profiles
    where lower(public.artist_profiles.name) = lower(btrim(part))
  );

drop policy if exists "Anyone can read artist profiles" on public.artist_profiles;
create policy "Anyone can read artist profiles"
on public.artist_profiles
for select
using (true);

drop policy if exists "Admins can insert artist profiles" on public.artist_profiles;
create policy "Admins can insert artist profiles"
on public.artist_profiles
for insert
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update artist profiles" on public.artist_profiles;
create policy "Admins can update artist profiles"
on public.artist_profiles
for update
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete artist profiles" on public.artist_profiles;
create policy "Admins can delete artist profiles"
on public.artist_profiles
for delete
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create or replace function public.sync_artist_profile_from_song()
returns trigger
language plpgsql
as $$
declare
  artist_name text;
begin
  for artist_name in
    select distinct btrim(part)
    from regexp_split_to_table(coalesce(new.artist, ''), '\s*,\s*') as part
  loop
    if artist_name <> '' then
      insert into public.artist_profiles (name)
      values (artist_name)
      on conflict do nothing;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists sync_artist_profile_from_song on public.songs;
create trigger sync_artist_profile_from_song
after insert or update of artist on public.songs
for each row
execute function public.sync_artist_profile_from_song();

insert into storage.buckets (id, name, public)
values ('artist-images', 'artist-images', true)
on conflict (id)
do update set
  name = excluded.name,
  public = true;

drop policy if exists "Public read artist images" on storage.objects;
create policy "Public read artist images"
on storage.objects
for select
using (bucket_id = 'artist-images');

drop policy if exists "Admins can upload artist images" on storage.objects;
create policy "Admins can upload artist images"
on storage.objects
for insert
with check (
  bucket_id = 'artist-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update artist images" on storage.objects;
create policy "Admins can update artist images"
on storage.objects
for update
using (
  bucket_id = 'artist-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  bucket_id = 'artist-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete artist images" on storage.objects;
create policy "Admins can delete artist images"
on storage.objects
for delete
using (
  bucket_id = 'artist-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);