# Test report (V4)

All numbers below are from real runs of the delivered code on 5 November 2026. Test code is in `tests/` and can be re-run (see `tests/README.md`).

## How it was tested
A real PostgreSQL 16 database was built from `schema.sql` + `seed.sql` + `migration-v4.sql`. Browser tests (Chromium via Playwright) ran against the real website files talking to **PostgREST** (the same API layer Supabase uses) with signed login tokens. A small test server imitated Supabase Auth and Storage. This is a faithful stand-in, **not** a real Supabase project.

| Suite | Result | What it covers |
|---|---|---|
| Database security (`tests/rls_test.py`) | **94 / 94 passed** (run repeatedly; migration also run 3 times in a row to prove it is repeatable) | Each role and visitor impersonated: expiry at query time, application rules and rate limit, role permissions, staff protections, scheduled posts, theme draft privacy, social-link constraints, form validation (required/type/options/range/regex/length/injection), honeypot, rate limit, recipient privacy, activity log |
| Public site (`tests/e2e/e2e_test.py`) | **43 / 43 passed** | All 39 pages load with a heading, no JS errors, no failed requests, no desktop overflow; mobile (390 px) overflow on 8 key pages; expired/draft/closed jobs and tenders; Open/Past tenders; scheduled blog; a job disappearing right after its deadline with the table still saying "open"; social links; contact form build, validation, EN/FR, storage, queued e-mails, honeypot, rate limit; generic form page; theme application, malicious value ignored, persistence |
| Staff portal (`tests/e2e/e2e_admin.py`) | **90 / 90 passed**, 3 consecutive runs | Menu and URL access per role (5 roles), deactivated staff, Appearance studio (live preview, device widths, fonts, contrast warning, undo/redo, draft vs publish, reset, public effect), Social manager (validation, hostile SVG sanitising, reorder, hide, delete, public effect), Form builder (recipients, fields, ordering, live form, success text), Submissions (search, status, notes, CSV, archive), job extension/reopen, tender creation rights, Staff & roles (role change, last-super guard, invite validation), Account (e-mail change request, password rule), Activity log + restore |
| Accessibility (axe-core, WCAG 2.0/2.1 A + AA) | **0 violations** on 9 screens (6 public, 3 portal) after fixing 3 issue types it found | Automated checks find only part of real accessibility problems; keyboard and screen-reader testing by a person is still advised |
| Links and assets | **3,824 local links/images checked, 0 broken** | All HTML files |
| Secrets scan | No service-role key, API key or private key in website files | |
| Weight | Home 49 requests, ~300 KB; Contact ~275 KB; Careers ~270 KB (local, uncompressed) | |

## Bugs the tests found and I fixed during the build
Migration not re-runnable (column type vs policy); starter form did not match the real contact form; form success message deleted by its own redraw; `QX.can` called on the wrong object; field reordering returned HTTP 400 (missing `updated_at`); undo skipped a step when pressed within 450 ms of a change; language button/map link names; portal contrast.

## NOT tested (be aware)
- **Edge Functions** (`send-outbox`, `staff-admin`) compile but were never run, and **no real e-mail was sent or received**. Do the "send a test enquiry" and "send a test invitation" steps in V4-SETUP-GUIDE.md.
- Real Supabase Auth: password reset e-mails, e-mail-change confirmation, invitation e-mails (V3 reset flow and the new e-mail change were exercised only up to the request being sent).
- Real Supabase Storage uploads (file-upload form field, tender PDFs, CV uploads).
- Firefox, Safari, real phones and tablets. Only Chromium; tablet width only inside the studio preview.
- French content proofreading: new French strings (form options, messages) reuse your site's own wording where it existed; the rest were written by me and should be reviewed by a French speaker.
- Performance scoring (Lighthouse) and load tests were not run.
- Live-database behaviour of the optional `pg_cron` tidy-up.

## Not yet built (clearly outstanding)
Rich-text editor, media library, page and section builder (add/duplicate/delete pages), navigation/footer manager, SEO manager UI, analytics, notification centre and other notification e-mails, content version history for pages, blog category/tag/SEO editing UI, icon and emoji changes for service cards, uploaded custom fonts, hero image replacements, display-name editing, jobs CSV export. Each is a separate piece of work; suggested order: SEO manager, blog editing fields, rich-text editor, media library, navigation manager, page builder, analytics.
