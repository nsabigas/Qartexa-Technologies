-- ==========================================================================
-- QARTEXA WEBSITE V2: DATABASE SETUP  (supabase/schema.sql)
-- Run this ONCE in Supabase: SQL Editor -> New query -> paste -> Run.
-- It creates the tables, the security rules and the two file folders.
-- The rules mean: visitors can READ published content and SEND job
-- applications; only people listed in the "admins" table can change anything.
-- ==========================================================================

create extension if not exists pgcrypto;

-- 1. Who is an administrator --------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- 2. Content tables ----------------------------------------------------------
create table if not exists public.solutions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  menu_group text not null default 'technology' check (menu_group in ('technology','connected')),
  card_group text not null default 'infrastructure' check (card_group in ('infrastructure','security','applications','advisory')),
  title_en text not null, title_fr text,
  tagline_en text, tagline_fr text,
  summary_en text, summary_fr text,
  body_en text, body_fr text,
  capabilities_en text, capabilities_fr text,
  image_url text,
  sort_order int not null default 100,
  status text not null default 'published' check (status in ('published','draft')),
  is_core boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null, title_fr text,
  department text, location text,
  employment_type text check (employment_type in ('full-time','part-time','contract','internship')),
  experience_level text check (experience_level in ('entry','mid','senior','lead')),
  summary_en text, summary_fr text,
  description_en text, description_fr text,
  requirements_en text, requirements_fr text,
  closing_date date,
  status text not null default 'draft' check (status in ('open','closed','draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  job_title text,
  full_name text not null check (char_length(full_name) between 2 and 160),
  email text not null check (char_length(email) between 5 and 254),
  phone text check (char_length(phone) <= 40),
  linkedin_url text check (char_length(linkedin_url) <= 300),
  cover_letter text check (char_length(cover_letter) <= 5000),
  cv_path text, cv_name text,
  status text not null default 'new' check (status in ('new','reviewing','shortlisted','rejected','hired')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null, title_fr text,
  excerpt_en text, excerpt_fr text,
  body_en text, body_fr text,
  category text, author text, cover_url text,
  status text not null default 'draft' check (status in ('published','draft')),
  published_at date default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenders (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  reference text,
  title_en text not null, title_fr text,
  description_en text, description_fr text,
  category text,
  issued_date date, closing_date date,
  status text not null default 'draft' check (status in ('open','closed','awarded','draft')),
  document_url text, contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Security rules (Row Level Security) -------------------------------------
alter table public.admins       enable row level security;
alter table public.solutions    enable row level security;
alter table public.jobs         enable row level security;
alter table public.applications enable row level security;
alter table public.posts        enable row level security;
alter table public.tenders      enable row level security;

drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins for select to authenticated using (user_id = auth.uid());

-- visitors see published items; admins see and change everything
drop policy if exists "solutions read"  on public.solutions;
drop policy if exists "solutions admin" on public.solutions;
create policy "solutions read"  on public.solutions for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy "solutions admin" on public.solutions for all    to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "jobs read"  on public.jobs;
drop policy if exists "jobs admin" on public.jobs;
create policy "jobs read"  on public.jobs for select to anon, authenticated using (status = 'open' or public.is_admin());
create policy "jobs admin" on public.jobs for all    to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "posts read"  on public.posts;
drop policy if exists "posts admin" on public.posts;
create policy "posts read"  on public.posts for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy "posts admin" on public.posts for all    to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tenders read"  on public.tenders;
drop policy if exists "tenders admin" on public.tenders;
create policy "tenders read"  on public.tenders for select to anon, authenticated using (status in ('open','closed','awarded') or public.is_admin());
create policy "tenders admin" on public.tenders for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- anyone can SEND an application (new, unreviewed); only admins can read or manage them
drop policy if exists "applications send"  on public.applications;
drop policy if exists "applications admin" on public.applications;
create policy "applications send"  on public.applications for insert to anon, authenticated with check (status = 'new' and notes is null);
create policy "applications admin" on public.applications for all    to authenticated using (public.is_admin()) with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.solutions, public.jobs, public.posts, public.tenders to anon;
grant insert on public.applications to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- 4. File folders (Storage) ---------------------------------------------------
-- media = public pictures and tender documents; cvs = private CV uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
 ('media','media', true, 5242880, array['image/jpeg','image/png','image/webp','application/pdf']),
 ('cvs','cvs', false, 5242880, array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media public read"  on storage.objects;
drop policy if exists "media admin write"  on storage.objects;
drop policy if exists "media admin update" on storage.objects;
drop policy if exists "media admin delete" on storage.objects;
drop policy if exists "cvs anyone upload"  on storage.objects;
drop policy if exists "cvs admin read"     on storage.objects;
drop policy if exists "cvs admin delete"   on storage.objects;
create policy "media public read"  on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "media admin write"  on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "cvs anyone upload"  on storage.objects for insert to anon, authenticated with check (bucket_id = 'cvs');
create policy "cvs admin read"     on storage.objects for select to authenticated using (bucket_id = 'cvs' and public.is_admin());
create policy "cvs admin delete"   on storage.objects for delete to authenticated using (bucket_id = 'cvs' and public.is_admin());

-- ==========================================================================
-- AFTER running this file (see docs/SETUP-GUIDE.md):
--  1) Authentication -> Users -> Add user (your email + a strong password)
--  2) Run supabase/seed.sql   (adds your 11 existing solutions)
--  3) Make yourself an admin (change the email, then run):
--       insert into public.admins (user_id, email)
--       select id, email from auth.users where email = 'YOUR-EMAIL@example.com';
-- ==========================================================================

-- ==========================================================================
-- VERSION 3: WEBSITE EDITING (page text, images, logo, header/footer, partners)
-- Safe to run again. Adds three tables; visitors can read, only admins can write.
-- ==========================================================================
create table if not exists public.cms_overrides (
  key text primary key,
  page text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create index if not exists cms_overrides_page_idx on public.cms_overrides (page);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  logo_url text not null,
  website text,
  sort_order int not null default 100,
  status text not null default 'published' check (status in ('published','draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cms_overrides enable row level security;
alter table public.site_settings enable row level security;
alter table public.partners      enable row level security;

drop policy if exists "cms read"  on public.cms_overrides;
drop policy if exists "cms admin" on public.cms_overrides;
create policy "cms read"  on public.cms_overrides for select to anon, authenticated using (true);
create policy "cms admin" on public.cms_overrides for all    to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings read"  on public.site_settings;
drop policy if exists "settings admin" on public.site_settings;
create policy "settings read"  on public.site_settings for select to anon, authenticated using (true);
create policy "settings admin" on public.site_settings for all    to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "partners read"  on public.partners;
drop policy if exists "partners admin" on public.partners;
create policy "partners read"  on public.partners for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy "partners admin" on public.partners for all    to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.cms_overrides, public.site_settings, public.partners to anon;
grant select, insert, update, delete on public.cms_overrides, public.site_settings, public.partners to authenticated;
