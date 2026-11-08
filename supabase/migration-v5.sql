-- ==========================================================================
-- QARTEXA WEBSITE V5: MEDIA LIBRARY + HERO / IMAGE SLOTS  (supabase/migration-v5.sql)
-- Run AFTER migration-v4.sql. Safe to run again (idempotent). Only ADDS things:
-- it does not change or delete any existing table, row or file.
-- Reverse (rollback) script: supabase/migration-v5-rollback.sql
-- ==========================================================================

-- 1. MEDIA LIBRARY -----------------------------------------------------------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  folder text not null default 'General' check (char_length(folder) between 1 and 60),
  title text not null default '' check (char_length(title) <= 160),
  description text check (description is null or char_length(description) <= 600),
  alt_en text check (alt_en is null or char_length(alt_en) <= 200),
  alt_fr text check (alt_fr is null or char_length(alt_fr) <= 200),
  copyright text check (copyright is null or char_length(copyright) <= 200),
  mime text not null default 'image/webp',
  width int not null check (width between 1 and 20000),
  height int not null check (height between 1 and 20000),
  bytes int not null default 0,
  base text not null check (base ~ '^library/[a-f0-9-]{36}(-v[0-9]+)?$'),  -- storage folder holding this image's files
  variants jsonb not null default '[]'::jsonb,     -- [{"w":800,"h":450,"fmt":"webp","path":"library/<id>/800.webp","bytes":41234}]
  versions jsonb not null default '[]'::jsonb,     -- earlier files kept after "Replace file": [{"base","variants","width","height","replaced_at"}]
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists media_folder_idx on public.media (folder, created_at desc);

-- 2. HERO / IMAGE SLOTS ------------------------------------------------------
-- published config is public (it is what visitors see); drafts are staff-only
create table if not exists public.page_heroes (
  page_key text primary key check (page_key ~ '^[a-z0-9_.:-]{1,80}$'),
  config jsonb not null,
  previous jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
create table if not exists public.page_heroes_draft (
  page_key text primary key check (page_key ~ '^[a-z0-9_.:-]{1,80}$'),
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

-- strict validation: nothing outside this shape can be stored (this is what keeps the public pages safe)
create or replace function public.validate_hero(cfg jsonb)
returns void language plpgsql stable set search_path = public as $$
declare k text; m jsonb; v text;
begin
  if jsonb_typeof(cfg) <> 'object' or octet_length(cfg::text) > 4000 then raise exception 'hero: invalid config'; end if;
  for k in select jsonb_object_keys(cfg) loop
    if k not in ('mode','media','focal','overlay','height','text','zoom','alt_en','alt_fr') then raise exception 'hero: unknown setting %', k; end if;
  end loop;
  if cfg ? 'mode' and (cfg->>'mode') not in ('banner','side','card') then raise exception 'hero: invalid mode'; end if;
  m := cfg->'media';
  if jsonb_typeof(m) <> 'object' or not (m ? 'desktop') then raise exception 'hero: a desktop image is required'; end if;
  for k in select jsonb_object_keys(m) loop
    if k not in ('desktop','tablet','mobile') then raise exception 'hero: unknown image slot %', k; end if;
    v := m->>k;
    if v is not null and (v !~* '^[a-f0-9-]{36}$' or not exists (select 1 from public.media x where x.id = v::uuid)) then raise exception 'hero: image not found in the library (%)', k; end if;
  end loop;
  if cfg ? 'focal' and not ((cfg#>>'{focal,x}')::numeric between 0 and 100 and (cfg#>>'{focal,y}')::numeric between 0 and 100) then raise exception 'hero: focal point out of range'; end if;
  if cfg ? 'overlay' and not ((cfg#>>'{overlay,color}') ~* '^#[0-9a-f]{6}$' and (cfg#>>'{overlay,opacity}')::numeric between 0 and 1) then raise exception 'hero: invalid overlay'; end if;
  if cfg ? 'height' then
    if (cfg#>>'{height,mode}') not in ('auto','compact','standard','tall','custom') then raise exception 'hero: invalid height'; end if;
    if (cfg#>>'{height,mode}') = 'custom' and not ((cfg#>>'{height,px}')::numeric between 200 and 1100) then raise exception 'hero: custom height must be 200-1100 px'; end if;
  end if;
  if cfg ? 'text' and (cfg->>'text') not in ('light','dark') then raise exception 'hero: invalid text colour'; end if;
  if cfg ? 'zoom' and jsonb_typeof(cfg->'zoom') <> 'boolean' then raise exception 'hero: invalid zoom'; end if;
  if char_length(coalesce(cfg->>'alt_en','')) > 200 or char_length(coalesce(cfg->>'alt_fr','')) > 200 then raise exception 'hero: alt text too long'; end if;
end $$;

create or replace function public.check_hero_row()
returns trigger language plpgsql as $$
begin perform public.validate_hero(new.config); new.updated_at := now(); return new; end $$;
drop trigger if exists page_heroes_check on public.page_heroes;
drop trigger if exists page_heroes_draft_check on public.page_heroes_draft;
create trigger page_heroes_check before insert or update on public.page_heroes for each row execute function public.check_hero_row();
create trigger page_heroes_draft_check before insert or update on public.page_heroes_draft for each row execute function public.check_hero_row();

-- publish = draft becomes live; the old live version is kept as "previous" so it can be restored
create or replace function public.publish_hero(p_key text)
returns void language plpgsql security definer set search_path = public as $$
declare d jsonb; old jsonb;
begin
  if not public.can('content') then raise exception 'not allowed'; end if;
  select config into d from public.page_heroes_draft where page_key = p_key;
  if d is null then raise exception 'there is no draft to publish'; end if;
  select config into old from public.page_heroes where page_key = p_key;
  insert into public.page_heroes (page_key, config, previous) values (p_key, d, old)
    on conflict (page_key) do update set config = excluded.config, previous = old, updated_at = now(), updated_by = auth.uid();
  delete from public.page_heroes_draft where page_key = p_key;
end $$;

-- restore previous = swap live and previous
create or replace function public.restore_hero(p_key text)
returns void language plpgsql security definer set search_path = public as $$
declare cur jsonb; prev jsonb;
begin
  if not public.can('content') then raise exception 'not allowed'; end if;
  select config, previous into cur, prev from public.page_heroes where page_key = p_key;
  if prev is null then raise exception 'there is no previous version'; end if;
  update public.page_heroes set config = prev, previous = cur, updated_at = now(), updated_by = auth.uid() where page_key = p_key;
end $$;

-- remove = the page goes back to its original built-in banner (the old config is kept as "previous" for restore)
create or replace function public.remove_hero(p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can('content') then raise exception 'not allowed'; end if;
  delete from public.page_heroes_draft where page_key = p_key;
  delete from public.page_heroes where page_key = p_key;
end $$;
revoke all on function public.publish_hero(text), public.restore_hero(text), public.remove_hero(text) from public, anon;
grant execute on function public.publish_hero(text), public.restore_hero(text), public.remove_hero(text) to authenticated;

-- 3. "WHERE IS THIS IMAGE USED?" ----------------------------------------------
-- looks for the image's storage folder in every place content is saved
create or replace function public.media_usage(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare b text; r jsonb := '[]'::jsonb; t record;
begin
  if not public.can('content') then raise exception 'not allowed'; end if;
  select base into b from public.media where id = p_id;
  if b is null then return r; end if;
  for t in select 'Page hero (published)' as area, page_key as label from public.page_heroes where config::text like '%' || p_id::text || '%'
    union all select 'Page hero (draft)', page_key from public.page_heroes_draft where config::text like '%' || p_id::text || '%'
    union all select 'Edited image on page ' || page, key from public.cms_overrides where data::text like '%' || b || '%' or data::text like '%' || p_id::text || '%'
    union all select 'Solution', slug from public.solutions where to_jsonb(solutions)::text like '%' || b || '%'
    union all select 'Blog article', slug from public.posts where to_jsonb(posts)::text like '%' || b || '%'
    union all select 'Partner', slug from public.partners where to_jsonb(partners)::text like '%' || b || '%'
    union all select 'Site setting', key from public.site_settings where value::text like '%' || b || '%' or value::text like '%' || p_id::text || '%'
  loop r := r || jsonb_build_array(jsonb_build_object('area', t.area, 'label', t.label)); end loop;
  return r;
end $$;
revoke all on function public.media_usage(uuid) from public, anon;
grant execute on function public.media_usage(uuid) to authenticated;

-- the database itself refuses to delete an image that is still in use
create or replace function public.media_delete_guard()
returns trigger language plpgsql as $$
declare u jsonb;
begin
  u := public.media_usage(old.id);
  if jsonb_array_length(u) > 0 then raise exception 'This image is still used in % place(s). Replace it there first.', jsonb_array_length(u); end if;
  return old;
end $$;
drop trigger if exists media_delete_check on public.media;
create trigger media_delete_check before delete on public.media for each row execute function public.media_delete_guard();

-- 4. ACCESS RULES --------------------------------------------------------------
alter table public.media enable row level security;
alter table public.page_heroes enable row level security;
alter table public.page_heroes_draft enable row level security;
drop policy if exists "media read" on public.media;   drop policy if exists "media admin" on public.media;
drop policy if exists "heroes read" on public.page_heroes; drop policy if exists "heroes admin" on public.page_heroes;
drop policy if exists "heroes draft admin" on public.page_heroes_draft;
create policy "media read"  on public.media for select to anon, authenticated using (true);                 -- image metadata is public (the files are public too)
create policy "media admin" on public.media for all to authenticated using (public.can('content')) with check (public.can('content'));
create policy "heroes read" on public.page_heroes for select to anon, authenticated using (true);
create policy "heroes admin" on public.page_heroes for all to authenticated using (public.can('content')) with check (public.can('content'));
create policy "heroes draft admin" on public.page_heroes_draft for all to authenticated using (public.can('content')) with check (public.can('content'));
grant select on public.media, public.page_heroes to anon;
grant select, insert, update, delete on public.media, public.page_heroes, public.page_heroes_draft to authenticated;
revoke all on public.page_heroes_draft from anon;

-- 5. STORAGE: allow modern formats, keep limits ----------------------------------
update storage.buckets set file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif','application/pdf']
 where id = 'media';

-- 6a. activity log: also understand tables whose key is called page_key
create or replace function public.log_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare o jsonb; n jsonb; rid text; email text;
begin
  if auth.uid() is null then return coalesce(new, old); end if;
  o := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
  n := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;
  if tg_table_name in ('applications','form_submissions') then
    o := case when o is null then null else jsonb_build_object('status', o->'status') end;
    n := case when n is null then null else jsonb_build_object('status', n->'status') end;
  end if;
  rid := coalesce((n->>'id'), (o->>'id'), (n->>'key'), (o->>'key'), (n->>'page_key'), (o->>'page_key'), (n->>'user_id'), (o->>'user_id'));
  select s.email into email from public.staff s where s.user_id = auth.uid();
  insert into public.activity_log (actor, actor_email, table_name, row_id, op, old_value, new_value)
  values (auth.uid(), email, tg_table_name, rid, tg_op, o, n);
  return coalesce(new, old);
end $$;

-- 6. ACTIVITY LOG ------------------------------------------------------------------
do $$ declare t text; begin
  foreach t in array array['media','page_heroes','page_heroes_draft'] loop
    execute format('drop trigger if exists %I on public.%I', 'audit_' || t, t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.log_change()', 'audit_' || t, t);
  end loop;
end $$;
-- ==========================================================================
