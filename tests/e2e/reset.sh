#!/bin/bash
# Rebuild the local test database exactly like a customer would: schema -> seed -> migration-v4 -> test fixtures.
P="psql -h /tmp -p 5433 -U postgres -d qx -q -v ON_ERROR_STOP=1"
R=/home/claude/work
su postgres -c "$P -c 'drop schema public cascade; create schema public; grant usage on schema public to anon, authenticated; grant all on schema public to postgres; delete from storage.buckets; delete from storage.objects; delete from auth.users;'" >/dev/null
for f in supabase/schema.sql supabase/seed.sql supabase/migration-v4.sql supabase/migration-v5.sql tests/e2e/fixtures.sql; do cp $R/$f /tmp/_r.sql; chmod 644 /tmp/_r.sql; su postgres -c "$P -f /tmp/_r.sql" 2>&1 | grep -i "error" ; done
pkill -SIGUSR1 postgrest 2>/dev/null; sleep 1; echo reset-done
