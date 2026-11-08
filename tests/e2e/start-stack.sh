#!/bin/bash
# Starts (if not running) Postgres :5433, PostgREST :3000, test server :8080
if ! su postgres -c "psql -h /tmp -p 5433 -U postgres -d qx -Atc 'select 1'" >/dev/null 2>&1; then
  rm -f /tmp/pgdata/postmaster.pid; su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /tmp/pgdata -o '-p 5433 -k /tmp' -l /tmp/pg.log -w start" >/dev/null 2>&1
fi
curl -s -m 2 localhost:3000/ >/dev/null 2>&1 || { setsid nohup /tmp/postgrest /tmp/pgrst.conf >/tmp/pgrst.log 2>&1 < /dev/null & sleep 3; }
curl -s -m 2 localhost:8080/__files >/dev/null 2>&1 || { (cd /home/claude/work && setsid nohup node tests/e2e/server.js >/tmp/srv.log 2>&1 < /dev/null &) ; sleep 2; }
echo "stack: $(curl -s -m 3 localhost:8080/rest/v1/social_links?select=name | head -c 30)"
