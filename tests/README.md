# Running the tests (developers)
Needs: PostgreSQL 16, the PostgREST binary, Node 18+, Python 3 with `playwright` (Chromium) and `axe-core` (npm). The scripts assume a scratch Postgres on port 5433 with Supabase-style stub schemas (`tests/stubs.sql`), PostgREST on port 3000 (`jwt-secret` = the one in `tests/e2e/server.js`), then:
```
tests/e2e/reset.sh          # rebuild DB: schema -> seed -> migration-v4 -> fixtures
python3 tests/rls_test.py   # database security tests
node tests/e2e/server.js &  # test server on :8080 (site + JWT login + REST proxy + storage)
python3 tests/e2e/e2e_test.py
python3 tests/e2e/e2e_admin.py
python3 tests/e2e/a11y_perf.py
```
These files are for development only; do not upload `tests/` to your web host.

V5 additions: `python3 tests/e2e/make_images.py` creates the test photographs (not shipped), then `rls_test_v5.py`, `e2e/e2e_media.py`, `e2e/e2e_heroes.py`, `e2e/e2e_heroes2.py`. `e2e/start-stack.sh` starts the local test services.
