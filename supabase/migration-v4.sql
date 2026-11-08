-- ==========================================================================
-- QARTEXA WEBSITE V4: MIGRATION  (supabase/migration-v4.sql)
-- Run AFTER schema.sql and seed.sql. Safe to run again (idempotent).
-- Adds: staff roles (RBAC), query-time expiry for jobs/tenders, scheduled posts,
--       social links, form builder + submissions, activity log, hardened uploads.
-- ==========================================================================

-- 1. STAFF AND ROLES ---------------------------------------------------------
create table if not exists public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'content'
    check (role in ('super_admin','admin','editor','hr','content')),
  active boolean not null default true,
  invited_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- everybody already in the old "admins" table becomes a Super Administrator
insert into public.staff (user_id, email, role)
select user_id, coalesce(email,''), 'super_admin' from public.admins
on conflict (user_id) do nothing;

create or replace function public.staff_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.staff where user_id = auth.uid() and active
$$;

-- can('area'): the single place that decides who may manage what
create or replace function public.can(area text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case area
       when 'content'     then role in ('super_admin','admin','editor','content')
       when 'appearance'  then role in ('super_admin','admin','editor')
       when 'forms'       then role in ('super_admin','admin','editor')
       when 'submissions' then role in ('super_admin','admin')
       when 'hr'          then role in ('super_admin','admin','hr')
       when 'tenders'     then role in ('super_admin','admin','content')
       when 'staff'       then role in ('super_admin')
       when 'audit'       then role in ('super_admin','admin')
       else false end
     from public.staff where user_id = auth.uid() and active), false)
$$;

-- is_admin() stays for old policies/clients: "any active staff member"
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and active)
$$;

alter table public.staff enable row level security;
drop policy if exists "staff read own"   on public.staff;
drop policy if exists "staff read all"   on public.staff;
drop policy if exists "staff super"      on public.staff;
create policy "staff read own" on public.staff for select to authenticated using (user_id = auth.uid());
create policy "staff read all" on public.staff for select to authenticated using (public.can('staff'));
create policy "staff super"    on public.staff for all    to authenticated using (public.can('staff')) with check (public.can('staff'));

-- a Super Administrator cannot remove or demote the last active Super Administrator
create or replace function public.guard_last_super()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE' and old.role = 'super_admin' and old.active)
     or (tg_op = 'UPDATE' and old.role = 'super_admin' and old.active and (new.role <> 'super_admin' or not new.active)) then
    if (select count(*) from public.staff where role = 'super_admin' and active and user_id <> old.user_id) = 0 then
      raise exception 'At least one active Super Administrator is required';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
drop trigger if exists staff_guard on public.staff;
create trigger staff_guard before update or delete on public.staff for each row execute function public.guard_last_super();

-- 2. EXPIRY AT QUERY TIME (jobs and tenders) ---------------------------------
alter table public.jobs    add column if not exists closing_at timestamptz;
alter table public.jobs    add column if not exists application_email text;
alter table public.jobs    add column if not exists featured boolean not null default false;
alter table public.jobs    add column if not exists responsibilities_en text;
alter table public.jobs    add column if not exists responsibilities_fr text;
alter table public.jobs    add column if not exists instructions_en text;
alter table public.jobs    add column if not exists instructions_fr text;
alter table public.tenders add column if not exists closing_at timestamptz;
alter table public.tenders add column if not exists issuer text;
alter table public.tenders add column if not exists eligibility_en text;
alter table public.tenders add column if not exists eligibility_fr text;
alter table public.tenders add column if not exists instructions_en text;
alter table public.tenders add column if not exists instructions_fr text;
alter table public.tenders add column if not exists show_in_history boolean not null default false;
alter table public.tenders add column if not exists archived boolean not null default false;

-- Kigali time (Africa/Kigali, UTC+2): a date-only closing means "end of that day"
create or replace function public.sync_closing()
returns trigger language plpgsql as $$
begin
  if new.closing_at is null and new.closing_date is not null then
    new.closing_at := (new.closing_date + time '23:59:59') at time zone 'Africa/Kigali';
  end if;
  if new.closing_at is not null then
    new.closing_date := (new.closing_at at time zone 'Africa/Kigali')::date;
  end if;
  return new;
end $$;
drop trigger if exists jobs_closing on public.jobs;
drop trigger if exists tenders_closing on public.tenders;
create trigger jobs_closing    before insert or update of closing_at, closing_date on public.jobs    for each row execute function public.sync_closing();
create trigger tenders_closing before insert or update of closing_at, closing_date on public.tenders for each row execute function public.sync_closing();
update public.jobs    set closing_at = (closing_date + time '23:59:59') at time zone 'Africa/Kigali' where closing_at is null and closing_date is not null;
update public.tenders set closing_at = (closing_date + time '23:59:59') at time zone 'Africa/Kigali' where closing_at is null and closing_date is not null;

-- status flip (tidy-up only: visibility below never depends on it)
create or replace function public.expire_items()
returns jsonb language plpgsql security definer set search_path = public as $$
declare j int; t int;
begin
  update public.jobs set status = 'closed', updated_at = now()
   where status = 'open' and closing_at is not null and closing_at <= now();
  get diagnostics j = row_count;
  update public.tenders set status = 'closed', updated_at = now()
   where status = 'open' and closing_at is not null and closing_at <= now();
  get diagnostics t = row_count;
  return jsonb_build_object('jobs', j, 'tenders', t);
end $$;
revoke all on function public.expire_items() from public;
grant execute on function public.expire_items() to anon, authenticated;

-- hourly tidy-up when pg_cron is available (optional; the policies below are the real guard)
do $$ begin
  begin
    create extension if not exists pg_cron;
    perform cron.schedule('qartexa-expire-items', '*/15 * * * *', 'select public.expire_items()');
  exception when others then
    raise notice 'pg_cron not enabled: expiry still works at query time (policies), status is tidied when staff open the dashboard.';
  end;
end $$;

-- tenders may be archived/historical; jobs/tenders statuses
alter table public.tenders drop constraint if exists tenders_status_check;
alter table public.tenders add constraint tenders_status_check check (status in ('open','closed','awarded','draft','cancelled'));

-- public visibility rules (evaluated on EVERY query)
drop policy if exists "jobs read"  on public.jobs;
create policy "jobs read" on public.jobs for select to anon, authenticated
  using ((status = 'open' and (closing_at is null or closing_at > now())) or public.can('hr') or public.can('content'));

drop policy if exists "tenders read" on public.tenders;
create policy "tenders read" on public.tenders for select to anon, authenticated
  using (
    (not archived and status = 'open' and (closing_at is null or closing_at > now()))
    or (not archived and show_in_history and status in ('closed','awarded','open') )
    or public.can('tenders'));

-- what an old direct link should show: title + state only, never private fields
create or replace function public.item_state(kind text, p_slug text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r record;
begin
  if kind = 'job' then
    select title_en, title_fr, status, closing_at into r from public.jobs where slug = p_slug and status <> 'draft';
  elsif kind = 'tender' then
    select title_en, title_fr, status, closing_at into r from public.tenders where slug = p_slug and status <> 'draft' and not archived;
  else return null; end if;
  if not found then return null; end if;
  return jsonb_build_object('title_en', r.title_en, 'title_fr', r.title_fr,
    'state', case when r.status = 'open' and (r.closing_at is null or r.closing_at > now()) then 'open' else 'closed' end,
    'closing_at', r.closing_at);
end $$;
grant execute on function public.item_state(text, text) to anon, authenticated;

-- 3. SCHEDULED POSTS ---------------------------------------------------------
drop policy if exists "posts read" on public.posts;   -- recreated below (a policy blocks the column type change)
do $$ begin
  if (select data_type from information_schema.columns where table_schema='public' and table_name='posts' and column_name='published_at') = 'date' then
    alter table public.posts alter column published_at drop default;
    alter table public.posts alter column published_at type timestamptz using (published_at::timestamptz);
  end if;
  alter table public.posts alter column published_at set default now();
end $$;
alter table public.posts add column if not exists tags text[] default '{}';
alter table public.posts add column if not exists seo_title text;
alter table public.posts add column if not exists seo_description text;
alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check check (status in ('published','scheduled','draft','archived'));
create policy "posts read" on public.posts for select to anon, authenticated
  using ((status in ('published','scheduled') and (published_at is null or published_at <= now())) or public.can('content'));

-- 4. APPLICATIONS: only to open, unexpired jobs; per-visitor rate limit ------
alter table public.applications add column if not exists ip_hash text;
create or replace function public.client_hash()
returns text language sql stable as $$
  select md5(coalesce(split_part(nullif(current_setting('request.headers', true), '')::json->>'x-forwarded-for', ',', 1), 'local'))
$$;
create or replace function public.limit_applications()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.ip_hash := public.client_hash();
  if (select count(*) from public.applications where ip_hash = new.ip_hash and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many submissions. Please try again later.' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists applications_limit on public.applications;
create trigger applications_limit before insert on public.applications for each row execute function public.limit_applications();

drop policy if exists "applications send"  on public.applications;
drop policy if exists "applications admin" on public.applications;
create policy "applications send" on public.applications for insert to anon, authenticated
  with check (status = 'new' and notes is null
    and (job_id is null or exists (select 1 from public.jobs j where j.id = job_id and j.status = 'open' and (j.closing_at is null or j.closing_at > now()))));
create policy "applications admin" on public.applications for all to authenticated using (public.can('hr')) with check (public.can('hr'));

-- 5. OLD CONTENT POLICIES -> ROLE-BASED --------------------------------------
drop policy if exists "solutions admin" on public.solutions;
create policy "solutions admin" on public.solutions for all to authenticated using (public.can('content')) with check (public.can('content'));
drop policy if exists "solutions read" on public.solutions;
create policy "solutions read" on public.solutions for select to anon, authenticated using (status = 'published' or public.can('content'));
drop policy if exists "posts admin" on public.posts;
create policy "posts admin" on public.posts for all to authenticated using (public.can('content')) with check (public.can('content'));
drop policy if exists "jobs admin" on public.jobs;
create policy "jobs admin" on public.jobs for all to authenticated using (public.can('hr')) with check (public.can('hr'));
drop policy if exists "tenders admin" on public.tenders;
create policy "tenders admin" on public.tenders for all to authenticated using (public.can('tenders')) with check (public.can('tenders'));
drop policy if exists "partners admin" on public.partners;
create policy "partners admin" on public.partners for all to authenticated using (public.can('content')) with check (public.can('content'));
drop policy if exists "partners read" on public.partners;
create policy "partners read" on public.partners for select to anon, authenticated using (status = 'published' or public.can('content'));
drop policy if exists "cms admin" on public.cms_overrides;
create policy "cms admin" on public.cms_overrides for all to authenticated using (public.can('content')) with check (public.can('content'));

-- site_settings: theme DRAFT is private; "admin only" keys never public
drop policy if exists "settings read"  on public.site_settings;
drop policy if exists "settings admin" on public.site_settings;
create policy "settings read" on public.site_settings for select to anon, authenticated
  using (key not like '%\_draft' escape '\' or public.can('appearance'));
create policy "settings admin" on public.site_settings for all to authenticated
  using (public.can('appearance') or public.can('content')) with check (public.can('appearance') or public.can('content'));

-- 6. SOCIAL LINKS ------------------------------------------------------------
create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  name text not null check (char_length(name) between 1 and 60),
  url text not null check (url ~* '^(https://|mailto:|tel:)' and char_length(url) <= 500),
  icon_key text,
  icon_svg text check (icon_svg is null or char_length(icon_svg) <= 4000),
  placements text[] not null default '{footer}',
  visible boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (placements <@ array['header','footer','contact']::text[])
);
alter table public.social_links enable row level security;
drop policy if exists "social read" on public.social_links;
drop policy if exists "social admin" on public.social_links;
create policy "social read"  on public.social_links for select to anon, authenticated using (visible or public.can('appearance'));
create policy "social admin" on public.social_links for all to authenticated using (public.can('appearance')) with check (public.can('appearance'));

-- 7. FORM BUILDER ------------------------------------------------------------
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null,
  title_en text, title_fr text,
  description_en text, description_fr text,
  submit_en text default 'Send', submit_fr text default 'Envoyer',
  success_en text default 'Thank you. Your message has been received.', success_fr text default 'Merci. Votre message a bien été reçu.',
  error_en text default 'We could not send your message. Please try again or email us.', error_fr text default 'Nous n’avons pas pu envoyer votre message. Veuillez réessayer ou nous écrire.',
  redirect_url text check (redirect_url is null or redirect_url ~* '^(https://|/|[a-z0-9._-]+\.html)'),
  recipients text[] not null default '{}',
  cc text[] not null default '{}',
  bcc text[] not null default '{}',
  ack_enabled boolean not null default false,
  ack_subject_en text, ack_subject_fr text,
  ack_body_en text, ack_body_fr text,
  note_en text, note_fr text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.forms add column if not exists note_en text;
alter table public.forms add column if not exists note_fr text;
create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  name text not null check (name ~ '^[a-z][a-z0-9_]{0,39}$'),
  type text not null check (type in ('text','textarea','email','tel','number','select','multiselect','radio','checkbox','date','file','url','subject','consent','hidden')),
  label_en text not null, label_fr text,
  placeholder_en text, placeholder_fr text,
  help_en text, help_fr text,
  options jsonb not null default '[]'::jsonb,   -- [{"value":"x","en":"..","fr":".."}]
  required boolean not null default false,
  validation jsonb not null default '{}'::jsonb, -- {minlength,maxlength,min,max,pattern}
  default_value text,
  visible boolean not null default true,
  wide boolean not null default false,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_id, name)
);
alter table public.form_fields add column if not exists updated_at timestamptz not null default now();
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.forms(id) on delete set null,
  form_name text,
  data jsonb not null default '{}'::jsonb,
  lang text default 'en',
  status text not null default 'new' check (status in ('new','read','in_progress','resolved')),
  archived boolean not null default false,
  notes text,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists form_submissions_form_idx on public.form_submissions (form_id, created_at desc);
create index if not exists form_submissions_ip_idx on public.form_submissions (ip_hash, created_at desc);

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.form_submissions(id) on delete cascade,
  kind text not null check (kind in ('notify','ack')),
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.forms            enable row level security;
alter table public.form_fields      enable row level security;
alter table public.form_submissions enable row level security;
alter table public.email_outbox     enable row level security;
drop policy if exists "forms read" on public.forms;           drop policy if exists "forms admin" on public.forms;
drop policy if exists "fields read" on public.form_fields;    drop policy if exists "fields admin" on public.form_fields;
drop policy if exists "subs admin" on public.form_submissions; drop policy if exists "outbox admin" on public.email_outbox;
-- visitors may read ONLY the public shape of enabled forms (recipients/cc/bcc are hidden via the view below)
create policy "forms admin"  on public.forms       for all to authenticated using (public.can('forms')) with check (public.can('forms'));
create policy "fields admin" on public.form_fields for all to authenticated using (public.can('forms')) with check (public.can('forms'));
create policy "subs admin"   on public.form_submissions for all to authenticated using (public.can('submissions')) with check (public.can('submissions'));
create policy "outbox admin" on public.email_outbox for all to authenticated using (public.can('submissions')) with check (public.can('submissions'));

-- Public form definition WITHOUT recipient addresses (staff e-mails are never exposed)
create or replace function public.get_form(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'slug', f.slug, 'title_en', f.title_en, 'title_fr', f.title_fr,
    'description_en', f.description_en, 'description_fr', f.description_fr,
    'submit_en', f.submit_en, 'submit_fr', f.submit_fr,
    'success_en', f.success_en, 'success_fr', f.success_fr,
    'error_en', f.error_en, 'error_fr', f.error_fr, 'redirect_url', f.redirect_url, 'note_en', f.note_en, 'note_fr', f.note_fr,
    'fields', coalesce((select jsonb_agg(to_jsonb(x) - 'id' - 'form_id' - 'created_at' order by x.sort_order, x.created_at)
                         from public.form_fields x where x.form_id = f.id and x.visible), '[]'::jsonb))
  from public.forms f where f.slug = p_slug and f.enabled
$$;
grant execute on function public.get_form(text) to anon, authenticated;

-- Server-side validation + rate limit + storage. Visitors can ONLY write through this function.
create or replace function public.submit_form(p_form text, p_data jsonb, p_lang text default 'en', p_hp text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  f public.forms; fld record; v text; clean jsonb := '{}'::jsonb; ih text := public.client_hash();
  n numeric; opt jsonb; arr jsonb; item text; sid uuid; em text; ok boolean; vv jsonb; pat text;
begin
  if coalesce(p_hp, '') <> '' then return jsonb_build_object('ok', true); end if;     -- honeypot: silently accept, store nothing
  select * into f from public.forms where slug = p_form and enabled;
  if not found then raise exception 'form_unavailable'; end if;
  if jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 60000 then raise exception 'invalid_data'; end if;
  if (select count(*) from public.form_submissions where ip_hash = ih and created_at > now() - interval '10 minutes') >= 5
     or (select count(*) from public.form_submissions where created_at > now() - interval '1 minute') >= 60 then
    raise exception 'rate_limited';
  end if;

  for fld in select * from public.form_fields where form_id = f.id and visible order by sort_order loop
    vv := coalesce(fld.validation, '{}'::jsonb);
    if fld.type in ('multiselect','checkbox') and jsonb_typeof(p_data->fld.name) = 'array' then
      arr := p_data->fld.name; v := null;
      if jsonb_array_length(arr) > 50 then raise exception 'invalid:%', fld.name; end if;
      if fld.required and jsonb_array_length(arr) = 0 then raise exception 'required:%', fld.name; end if;
      if jsonb_array_length(arr) > 0 and fld.type = 'multiselect' then
        for item in select jsonb_array_elements_text(arr) loop
          if not exists (select 1 from jsonb_array_elements(fld.options) o where o->>'value' = item) then raise exception 'invalid:%', fld.name; end if;
        end loop;
      end if;
      if jsonb_array_length(arr) > 0 then clean := clean || jsonb_build_object(fld.name, arr); end if;
      continue;
    end if;

    v := p_data->>fld.name;
    if fld.type = 'hidden' then v := coalesce(v, fld.default_value); end if;
    v := nullif(btrim(coalesce(v, '')), '');
    if v is null then
      if fld.required then raise exception 'required:%', fld.name; end if;
      continue;
    end if;
    if char_length(v) > coalesce((vv->>'maxlength')::int, case when fld.type = 'textarea' then 5000 else 500 end) then raise exception 'too_long:%', fld.name; end if;
    if vv ? 'minlength' and char_length(v) < (vv->>'minlength')::int then raise exception 'too_short:%', fld.name; end if;

    if fld.type = 'email' then
      if v !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' or char_length(v) > 254 then raise exception 'invalid:%', fld.name; end if;
    elsif fld.type = 'tel' then
      if v !~ '^[0-9+()\-. ]{6,30}$' then raise exception 'invalid:%', fld.name; end if;
    elsif fld.type = 'url' then
      if v !~* '^https?://[^\s]+$' then raise exception 'invalid:%', fld.name; end if;
    elsif fld.type = 'number' then
      begin n := v::numeric; exception when others then raise exception 'invalid:%', fld.name; end;
      if vv ? 'min' and n < (vv->>'min')::numeric then raise exception 'invalid:%', fld.name; end if;
      if vv ? 'max' and n > (vv->>'max')::numeric then raise exception 'invalid:%', fld.name; end if;
    elsif fld.type = 'date' then
      begin perform v::date; exception when others then raise exception 'invalid:%', fld.name; end;
    elsif fld.type in ('select','radio') then
      if not exists (select 1 from jsonb_array_elements(fld.options) o where o->>'value' = v) then raise exception 'invalid:%', fld.name; end if;
    elsif fld.type = 'checkbox' or fld.type = 'consent' then
      if v not in ('true','on','yes','1','Agreed') then raise exception 'invalid:%', fld.name; end if;
    elsif fld.type = 'file' then
      if v !~ '^forms/[A-Za-z0-9._-]{1,120}$' then raise exception 'invalid:%', fld.name; end if;   -- path inside the private uploads bucket
    end if;
    if vv ? 'pattern' and char_length(vv->>'pattern') <= 200 then
      begin ok := v ~ (vv->>'pattern'); exception when others then ok := true; end;
      if not ok then raise exception 'invalid:%', fld.name; end if;
    end if;
    clean := clean || jsonb_build_object(fld.name, v);
  end loop;

  insert into public.form_submissions (form_id, form_name, data, lang, ip_hash)
  values (f.id, f.name, clean, case when p_lang = 'fr' then 'fr' else 'en' end, ih) returning id into sid;

  if cardinality(f.recipients) > 0 then insert into public.email_outbox (submission_id, kind) values (sid, 'notify'); end if;
  if f.ack_enabled then
    select value into em from jsonb_each_text(clean) e join public.form_fields ff on ff.name = e.key and ff.form_id = f.id and ff.type = 'email' limit 1;
    if em is not null then insert into public.email_outbox (submission_id, kind) values (sid, 'ack'); end if;
  end if;
  return jsonb_build_object('ok', true, 'id', sid);
end $$;
grant execute on function public.submit_form(text, jsonb, text, text) to anon, authenticated;

-- 8. ACTIVITY LOG ------------------------------------------------------------
create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid, actor_email text,
  table_name text not null, row_id text, op text not null,
  old_value jsonb, new_value jsonb
);
create index if not exists activity_log_at_idx on public.activity_log (at desc);
alter table public.activity_log enable row level security;
drop policy if exists "audit read" on public.activity_log;
create policy "audit read" on public.activity_log for select to authenticated using (public.can('audit'));

create or replace function public.log_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare o jsonb; n jsonb; rid text; email text;
begin
  if auth.uid() is null then return coalesce(new, old); end if;           -- anonymous visitors (e.g. a job application) are not "staff changes"
  o := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
  n := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;
  if tg_table_name in ('applications','form_submissions') then               -- personal data is never copied into the log
    o := case when o is null then null else jsonb_build_object('status', o->'status') end;
    n := case when n is null then null else jsonb_build_object('status', n->'status') end;
  end if;
  rid := coalesce((n->>'id'), (o->>'id'), (n->>'key'), (o->>'key'), (n->>'user_id'), (o->>'user_id'));
  select s.email into email from public.staff s where s.user_id = auth.uid();
  insert into public.activity_log (actor, actor_email, table_name, row_id, op, old_value, new_value)
  values (auth.uid(), email, tg_table_name, rid, tg_op, o, n);
  return coalesce(new, old);
end $$;

do $$ declare t text; begin
  foreach t in array array['solutions','jobs','applications','posts','tenders','partners','cms_overrides','site_settings','social_links','forms','form_fields','form_submissions','staff'] loop
    execute format('drop trigger if exists %I on public.%I', 'audit_' || t, t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.log_change()', 'audit_' || t, t);
  end loop;
end $$;

-- 9. STORAGE: tighter upload rules -------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
 ('uploads','uploads', false, 5242880, array['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cvs anyone upload" on storage.objects;
drop policy if exists "cvs admin read"    on storage.objects;
drop policy if exists "cvs admin delete"  on storage.objects;
create policy "cvs anyone upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = 'applications');
create policy "cvs admin read"    on storage.objects for select to authenticated using (bucket_id = 'cvs' and public.can('hr'));
create policy "cvs admin delete"  on storage.objects for delete to authenticated using (bucket_id = 'cvs' and public.can('hr'));

drop policy if exists "uploads anyone upload" on storage.objects;
drop policy if exists "uploads admin read"    on storage.objects;
drop policy if exists "uploads admin delete"  on storage.objects;
create policy "uploads anyone upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = 'forms');
create policy "uploads admin read"    on storage.objects for select to authenticated using (bucket_id = 'uploads' and public.can('submissions'));
create policy "uploads admin delete"  on storage.objects for delete to authenticated using (bucket_id = 'uploads' and public.can('submissions'));

drop policy if exists "media admin write"  on storage.objects;
drop policy if exists "media admin update" on storage.objects;
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin write"  on storage.objects for insert to authenticated with check (bucket_id = 'media' and (public.can('content') or public.can('appearance') or public.can('tenders')));
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id = 'media' and (public.can('content') or public.can('appearance')));
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and (public.can('content') or public.can('appearance')));

-- 10. GRANTS -----------------------------------------------------------------
grant select on public.social_links to anon;
grant select, insert, update, delete on public.staff, public.social_links, public.forms, public.form_fields, public.form_submissions, public.email_outbox to authenticated;
grant select on public.activity_log to authenticated;
-- visitors never touch submissions/forms tables directly
revoke all on public.forms, public.form_fields, public.form_submissions, public.email_outbox, public.staff, public.activity_log from anon;

-- 11. STARTER CONTENT: the existing enquiry form + the four existing social links
insert into public.forms (slug, name, title_en, title_fr, submit_en, submit_fr, success_en, success_fr, note_en, note_fr, recipients, enabled)
values ('project-enquiry', 'Project enquiry', 'Tell us what your organization needs', 'Dites-nous ce dont votre organisation a besoin',
        'Send project enquiry', 'Envoyer la demande',
        'Thank you. Your enquiry has been sent to Qartexa.', 'Merci. Votre demande a été envoyée à Qartexa.',
        'Your enquiry is stored securely and sent to our team by email. Do not include passwords or access credentials.',
        'Votre demande est conservée de manière sécurisée et transmise à notre équipe par e-mail. N’incluez aucun mot de passe ni identifiant d’accès.',
        '{}', true)
on conflict (slug) do nothing;

insert into public.form_fields (form_id, name, type, label_en, label_fr, placeholder_en, placeholder_fr, required, wide, sort_order, options)
select f.id, x.name, x.type, x.le, x.lf, nullif(x.pe,''), nullif(x.pf,''), x.req, x.wide, x.ord, x.opts::jsonb from public.forms f, (values
('name','text','Full name','Nom complet','','',true,false,10,'[]'),
('organization','text','Organization','Organisation','','',true,false,20,'[]'),
('email','email','Work email','Adresse e-mail professionnelle','','',true,false,30,'[]'),
('phone','tel','Phone number','Numéro de téléphone','','',false,false,40,'[]'),
('service','select','Solution or service of interest','Solution ou service recherché','Select a solution or service','Sélectionnez une solution ou un service',true,false,50,'[{"value":"Banking & Financial Technology","en":"Banking & Financial Technology","fr":"Technologies bancaires et financières"},{"value":"Cybersecurity","en":"Cybersecurity","fr":"Cybersécurité"},{"value":"Cloud & Modern Workplace","en":"Cloud & Modern Workplace","fr":"Cloud et environnement de travail moderne"},{"value":"Digital Infrastructure","en":"Digital Infrastructure","fr":"Infrastructure numérique"},{"value":"AI & Digital Transformation","en":"AI & Digital Transformation","fr":"IA et transformation numérique"},{"value":"Software Engineering","en":"Software Engineering","fr":"Ingénierie logicielle"},{"value":"IoT & Smart Solutions","en":"IoT & Smart Solutions","fr":"IoT et solutions intelligentes"},{"value":"Physical Security","en":"Physical Security","fr":"Sécurité physique"},{"value":"Power & Energy","en":"Power & Energy","fr":"Énergie et alimentation électrique"},{"value":"Managed ICT Services","en":"Managed ICT Services","fr":"Services TIC gérés"},{"value":"ICT Consultancy & Professional Services","en":"ICT Consultancy & Professional Services","fr":"Conseil TIC et services professionnels"},{"value":"Other / Not sure yet","en":"Other / Not sure yet","fr":"Autre / Je ne sais pas encore"}]'),
('industry','select','Industry','Secteur d’activité','Select your industry (optional)','Sélectionnez votre secteur (facultatif)',false,false,60,'[{"value":"Banking & Financial Services","en":"Banking & Financial Services","fr":"Banque et services financiers"},{"value":"Government & Public Sector","en":"Government & Public Sector","fr":"Administration et secteur public"},{"value":"Healthcare","en":"Healthcare","fr":"Santé"},{"value":"Education","en":"Education","fr":"Éducation"},{"value":"Energy & Utilities","en":"Energy & Utilities","fr":"Énergie et services publics"},{"value":"Manufacturing & Agriculture","en":"Manufacturing & Agriculture","fr":"Industrie et agriculture"},{"value":"Telecommunications","en":"Telecommunications","fr":"Télécommunications"},{"value":"Retail & Commercial","en":"Retail & Commercial","fr":"Commerce et distribution"},{"value":"Hospitality & Tourism","en":"Hospitality & Tourism","fr":"Hôtellerie et tourisme"},{"value":"Other","en":"Other","fr":"Autre"}]'),
('project_location','text','Project location','Lieu du projet','','',false,false,70,'[]'),
('timeline','select','Expected timeline','Échéance envisagée','Select a timeline (optional)','Sélectionnez une échéance (facultatif)',false,false,80,'[{"value":"As soon as possible","en":"As soon as possible","fr":"Dès que possible"},{"value":"Within 1–3 months","en":"Within 1–3 months","fr":"Dans 1 à 3 mois"},{"value":"Within 3–6 months","en":"Within 3–6 months","fr":"Dans 3 à 6 mois"},{"value":"More than 6 months","en":"More than 6 months","fr":"Dans plus de 6 mois"},{"value":"Planning / exploring","en":"Planning / exploring","fr":"Planification / exploration"}]'),
('message','textarea','Project details','Détails du projet','','',true,true,90,'[]'),
('consent','consent','I agree that Qartexa Technologies may use these details to respond to this enquiry.','J’accepte que Qartexa Technologies utilise ces informations pour répondre à cette demande.','','',true,true,100,'[]')
) as x(name,type,le,lf,pe,pf,req,wide,ord,opts)
where f.slug = 'project-enquiry' on conflict (form_id, name) do nothing;

insert into public.social_links (platform, name, url, icon_key, placements, sort_order)
select * from (values
 ('linkedin','LinkedIn','https://www.linkedin.com/company/qartexatech/','linkedin','{footer}'::text[],10),
 ('instagram','Instagram','https://www.instagram.com/qartexatech/','instagram','{footer}'::text[],20),
 ('x','X','https://x.com/qartexatech','x','{footer}'::text[],30),
 ('facebook','Facebook','https://www.facebook.com/qartexatech/','facebook','{footer}'::text[],40)
) v(platform,name,url,icon_key,placements,sort_order)
where not exists (select 1 from public.social_links);

-- ==========================================================================
-- AFTER running this file: see docs/SETUP-GUIDE.md section "Version 4".
-- ==========================================================================
