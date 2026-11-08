# Security checklist (V4)
Legend: ✅ verified by an automated test in this project · 🔶 implemented but needs a live check on your Supabase project · ⬜ your manual step

## Database and access
- ✅ Row Level Security on every table; visitors cannot read or write staff data (94 database tests).
- ✅ Role-based access: HR cannot read form submissions or change content; content managers cannot read applications; editors cannot read submissions; staff cannot promote themselves; only a Super Administrator manages staff.
- ✅ Deactivated staff lose access immediately (no token expiry wait).
- ✅ The last Super Administrator cannot be demoted, deactivated or deleted.
- ✅ Expired jobs/tenders and future posts are hidden by the database itself.
- ✅ Draft theme is not readable by visitors.
- ✅ Social links limited to https/mailto/tel by a database constraint.
- ✅ Recipient e-mail addresses are never sent to visitors (`forms` table has no public access; `get_form()` omits them).
- ✅ Activity log is read-only for staff and contains no personal data from applications/messages.
## Forms and uploads
- ✅ Server-side validation re-checks every field; unknown fields dropped; SQL-looking text stored inertly.
- ✅ Honeypot and per-visitor rate limiting (also for job applications: 5 per hour).
- ✅ Application to an expired job is refused by the database.
- ✅ Uploads: private buckets, size and file-type limits (5 MB; PDF/Word/images), fixed folder.
- 🔶 Visitor-supplied file uploads with real Supabase Storage (the test server imitates storage).
## Browser code
- ✅ No service-role key or secret anywhere in the website files (scan run; only the anon key placeholder).
- ✅ Theme: malicious values ignored (tested with `;}body{display:none`), fonts validated by pattern.
- ✅ Custom SVG icons stripped of scripts, handlers, styles, images, foreignObject (tested with a hostile file).
- ✅ External social links use `target=_blank rel="noopener noreferrer"`.
- ✅ All rendered text goes through HTML escaping (existing `QX.util.esc`).
## Secrets and server functions
- ✅ E-mail key and webhook secret are read only from server environment variables in the Edge Functions.
- 🔶 `send-outbox` checks a shared secret header; `staff-admin` verifies the caller's JWT and Super Administrator role. Both compile cleanly but were **not run live** (no Supabase project available while building).
## Your manual steps
- ⬜ Enable "Confirm email", strong password policy (10+ chars), and e-mail-change confirmation in Supabase Auth.
- ⬜ Turn on Supabase backups (Pro plan has daily backups) and test a restore once.
- ⬜ Add security headers at your host (Content-Security-Policy, X-Content-Type-Options, Referrer-Policy). GitHub Pages cannot set headers; Cloudflare Pages/Netlify can.
- ⬜ Rotate any key you ever pasted somewhere public. The anon key is meant to be public; the service-role key must never be.
- ⬜ Review the privacy policy so it names the e-mail provider and Supabase as processors and mentions form storage.
## Known gaps
- Rich-text/HTML sanitiser not built (the rich-text editor is not part of this release).
- "Custom HTML" blocks are not offered (no page builder yet), so there is no custom-HTML attack surface yet.
- Password reset and e-mail-change flows are Supabase's standard flows; I have **not** tested them end to end.
