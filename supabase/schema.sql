-- Encima Roofdeck — run this in the Supabase SQL editor (once).
-- Then run seed.sql. Then invite the three staff emails under Authentication → Users.

create extension if not exists "pgcrypto";

create table if not exists public.staff_allowlist (
  email text primary key,
  role text not null check (role in ('editor', 'approver')),
  note text
);

insert into public.staff_allowlist (email, role, note) values
  ('graphicartist@citygardenhotels.com', 'editor', 'Marketing'),
  ('fnbcoordinator@citygardenhotelmakati.com', 'editor', 'FNB supervisor'),
  ('fnbmanager@citygardenhotelmakati.com', 'approver', 'FNB manager')
on conflict (email) do update set role = excluded.role, note = excluded.note;

-- When the executive chef has an email:
-- insert into public.staff_allowlist (email, role, note)
-- values ('chef@…', 'approver', 'Executive chef');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  role text not null check (role in ('editor', 'approver')),
  created_at timestamptz not null default now()
);

create or replace function public.staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare r text;
begin
  select role into r from public.staff_allowlist where lower(email) = lower(new.email);
  if r is not null then
    insert into public.profiles (id, email, role) values (new.id, new.email, r)
    on conflict (id) do update set email = excluded.email, role = excluded.role;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.sections (
  id text primary key,
  group_id text not null,
  name text not null,
  tone text not null default 'slate',
  note text,
  is_setmenu boolean not null default false,
  sort_order int not null,
  block_id text
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  section_id text not null references public.sections (id) on delete cascade,
  name text not null,
  description text not null default '',
  price jsonb,
  tags text[] not null default '{}',
  photos text[] not null default '{}',
  pairing text,
  extra jsonb not null default '{}',
  visibility text not null default 'published'
    check (visibility in ('published', 'hidden', 'soldout')),
  review_status text not null default 'not_reviewed'
    check (review_status in ('not_reviewed', 'approved', 'for_revision')),
  sort_order int not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create table if not exists public.site_settings (
  id text primary key default 'main',
  payload jsonb not null default '{}',
  review_status text not null default 'not_reviewed'
    check (review_status in ('not_reviewed', 'approved', 'for_revision')),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('item', 'settings')),
  target_id text not null,
  body text not null,
  author_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists items_section_idx on public.items (section_id, sort_order);
create index if not exists items_review_idx on public.items (review_status);
create index if not exists comments_target_idx on public.review_comments (target_type, target_id, created_at);

create or replace function public.touch_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare r text;
begin
  r := public.staff_role();
  new.updated_at := now();
  new.updated_by := auth.uid();

  if r = 'approver' then
    new.name := old.name;
    new.description := old.description;
    new.price := old.price;
    new.tags := old.tags;
    new.photos := old.photos;
    new.pairing := old.pairing;
    new.extra := old.extra;
    new.visibility := old.visibility;
    new.section_id := old.section_id;
    new.sort_order := old.sort_order;
    return new;
  end if;

  if r = 'editor' then
    if new.visibility is distinct from old.visibility
       and new.visibility in ('soldout', 'published')
       and old.visibility in ('soldout', 'published')
       and new.name is not distinct from old.name
       and new.description is not distinct from old.description
       and new.price is not distinct from old.price
       and new.tags is not distinct from old.tags
       and new.photos is not distinct from old.photos
       and new.pairing is not distinct from old.pairing
       and new.extra is not distinct from old.extra
       and new.section_id is not distinct from old.section_id
    then
      new.review_status := old.review_status;
    else
      new.review_status := 'not_reviewed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists items_touch on public.items;
create trigger items_touch
  before update on public.items
  for each row execute function public.touch_item();

create or replace function public.touch_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare r text;
begin
  r := public.staff_role();
  new.updated_at := now();
  new.updated_by := auth.uid();
  if r = 'approver' then
    new.payload := old.payload;
    return new;
  end if;
  if r = 'editor' and new.payload is distinct from old.payload then
    new.review_status := 'not_reviewed';
  end if;
  return new;
end;
$$;

drop trigger if exists settings_touch on public.site_settings;
create trigger settings_touch
  before update on public.site_settings
  for each row execute function public.touch_settings();

alter table public.staff_allowlist enable row level security;
alter table public.profiles enable row level security;
alter table public.sections enable row level security;
alter table public.items enable row level security;
alter table public.site_settings enable row level security;
alter table public.review_comments enable row level security;

drop policy if exists allowlist_staff_read on public.staff_allowlist;
create policy allowlist_staff_read on public.staff_allowlist
  for select to authenticated using (public.staff_role() is not null);

drop policy if exists profiles_self_or_staff on public.profiles;
create policy profiles_self_or_staff on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.staff_role() is not null);

drop policy if exists sections_public_read on public.sections;
create policy sections_public_read on public.sections
  for select to anon, authenticated using (true);

drop policy if exists items_public_read on public.items;
create policy items_public_read on public.items
  for select to anon using (visibility in ('published', 'soldout'));

drop policy if exists items_staff_read on public.items;
create policy items_staff_read on public.items
  for select to authenticated using (public.staff_role() is not null);

drop policy if exists items_editor_write on public.items;
create policy items_editor_write on public.items
  for all to authenticated
  using (public.staff_role() = 'editor')
  with check (public.staff_role() = 'editor');

drop policy if exists items_approver_status on public.items;
create policy items_approver_status on public.items
  for update to authenticated
  using (public.staff_role() = 'approver')
  with check (public.staff_role() = 'approver');

drop policy if exists settings_public_read on public.site_settings;
create policy settings_public_read on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists settings_editor_update on public.site_settings;
create policy settings_editor_update on public.site_settings
  for update to authenticated
  using (public.staff_role() = 'editor')
  with check (public.staff_role() = 'editor');

drop policy if exists settings_approver_status on public.site_settings;
create policy settings_approver_status on public.site_settings
  for update to authenticated
  using (public.staff_role() = 'approver')
  with check (public.staff_role() = 'approver');

drop policy if exists comments_staff_read on public.review_comments;
create policy comments_staff_read on public.review_comments
  for select to authenticated using (public.staff_role() is not null);

drop policy if exists comments_staff_insert on public.review_comments;
create policy comments_staff_insert on public.review_comments
  for insert to authenticated
  with check (public.staff_role() is not null and author_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select on public.sections, public.items, public.site_settings to anon, authenticated;
grant select on public.profiles, public.staff_allowlist, public.review_comments to authenticated;
grant insert, update, delete on public.items to authenticated;
grant update on public.site_settings to authenticated;
grant insert on public.review_comments to authenticated;

insert into storage.buckets (id, name, public)
values ('menu-photos', 'menu-photos', true)
on conflict (id) do nothing;

drop policy if exists menu_photos_public_read on storage.objects;
create policy menu_photos_public_read on storage.objects
  for select using (bucket_id = 'menu-photos');

drop policy if exists menu_photos_editor_ins on storage.objects;
create policy menu_photos_editor_ins on storage.objects
  for insert to authenticated
  with check (bucket_id = 'menu-photos' and public.staff_role() = 'editor');

drop policy if exists menu_photos_editor_upd on storage.objects;
create policy menu_photos_editor_upd on storage.objects
  for update to authenticated
  using (bucket_id = 'menu-photos' and public.staff_role() = 'editor');

drop policy if exists menu_photos_editor_del on storage.objects;
create policy menu_photos_editor_del on storage.objects
  for delete to authenticated
  using (bucket_id = 'menu-photos' and public.staff_role() = 'editor');

-- If users were invited before this script ran, attach their profiles now.
insert into public.profiles (id, email, role)
select u.id, u.email, a.role
from auth.users u
join public.staff_allowlist a on lower(a.email) = lower(u.email)
on conflict (id) do update set email = excluded.email, role = excluded.role;
