-- Rolls back migration-v5.sql. WARNING: deletes the media records and hero settings
-- (uploaded files in Storage are NOT deleted; remove them in Supabase > Storage if you want).
drop trigger if exists media_delete_check on public.media;
drop table if exists public.page_heroes_draft;
drop table if exists public.page_heroes;
drop table if exists public.media;
drop function if exists public.publish_hero(text);
drop function if exists public.restore_hero(text);
drop function if exists public.remove_hero(text);
drop function if exists public.media_usage(uuid);
drop function if exists public.media_delete_guard();
drop function if exists public.validate_hero(jsonb);
drop function if exists public.check_hero_row();
