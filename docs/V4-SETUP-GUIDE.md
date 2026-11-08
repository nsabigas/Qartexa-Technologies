# Qartexa Website V4: Setup Guide (what is new and what you must do)

V4 adds to V3; it does not replace it. All 27 original pages, URLs, English/French content, branding and the visual page editor are unchanged.

## What V4 adds (all tested; see TEST-REPORT.md)
| Area | What you can now do |
|---|---|
| **Roles** | 5 roles: Super Administrator, Administrator, Website Editor, HR Manager, Content Manager. Each person only sees and can only change what their role allows. The database enforces this, not just the menu. |
| **Appearance** | Staff portal > Appearance: colours, fonts, sizes, spacing, shapes, shadows, section colours, animation, tablet/mobile overrides. Live preview (desktop/tablet/mobile), Save draft, Publish, Cancel, Undo/Redo, Restore Qartexa default, contrast warnings. |
| **Social media** | Staff portal > Social media: add unlimited accounts, 23 icons (19 platforms plus email, phone, website, link) and custom SVG (cleaned automatically), order, hide/show, header/footer/contact placement. |
| **Form builder** | Staff portal > Form builder: create forms, 15 field types, English/French text, who receives messages (to/CC/BCC), automatic acknowledgement e-mail, success/error text, redirect. The Contact page form is now built from this. |
| **Submissions** | Staff portal > Form submissions: search, filter, status (new/read/in progress/resolved), private notes, archive, delete, CSV export, private file attachments. |
| **Jobs / tenders** | Exact closing date **and time** (Kigali time). They disappear from the public site at that moment, applications stop, old links show a "closed" notice, staff keep the record, and can extend/reopen. Tenders: separate **Open tenders** and optional **Past tenders** sections. |
| **Blog** | Scheduled publishing by date and time; future articles are never public early. |
| **Staff** | Invite, change role, deactivate, remove. Cannot remove the last Super Administrator. |
| **Activity log** | Who changed what, when, old and new values, and one-click restore of the earlier version for most content. |
| **Security** | Hardened database rules, server-side form validation, spam honeypot, rate limits, private uploads, no recipient addresses exposed to visitors. |
| **Accessibility** | Fixed language-button name, map link name, portal contrast. |

## Setup: new project
1. Create a Supabase project (see SETUP-GUIDE.md steps 1-3).
2. In **SQL Editor** run, in this order: `supabase/schema.sql`, then `supabase/seed.sql`, then **`supabase/migration-v4.sql`**.
3. Paste your Project URL and anon key into `js/qx-config.js` (unchanged from V3).
4. Create your first user in Supabase > Authentication > Users, then run (with your user's email):
```sql
insert into public.staff (user_id, email, role)
select id, email, 'super_admin' from auth.users where email = 'YOU@qartexa.com';
```
## Setup: upgrading an existing V3 site
Run only **`supabase/migration-v4.sql`** (safe to run more than once). Everyone already in the old `admins` table becomes a Super Administrator automatically. Then replace the website files with this version.

## E-mail delivery (needed so form messages reach your inbox)
Messages are **always stored** in the portal even if e-mail is not set up. To also receive them by e-mail:
1. Create an account with an e-mail sending service (the code uses **Resend**; free plan: 3,000 e-mails/month, max 100/day, 1 domain at the time of writing). Verify your sending domain (add the DNS records Resend shows you) so mail is not marked as spam.
2. Install the Supabase CLI, then in the project folder: `supabase functions deploy send-outbox` and `supabase functions deploy staff-admin`.
3. Supabase > Edge Functions > Secrets: add `RESEND_API_KEY`, `MAIL_FROM` (e.g. `Qartexa Website <website@qartexa.com>`) and `WEBHOOK_SECRET` (any long random text). These stay on the server only.
4. Supabase > Database > Webhooks > Create: table `email_outbox`, event **Insert**, type Supabase Edge Function > `send-outbox`, add HTTP header `x-webhook-secret` = the same secret.
5. Optional retry of failed e-mails: schedule the same function with an empty body (same header) every 15 minutes (Supabase Cron).
6. Staff portal > Form builder > project-enquiry > **Send new messages to**: enter your address(es). Change it any time; no developer needed.

## Manual steps checklist
- [ ] Run `migration-v4.sql` (and insert your Super Administrator row on a new project).
- [ ] Deploy both Edge Functions, set the 3 secrets, create the Database Webhook (untested live, see TEST-REPORT.md).
- [ ] Verify your sending domain with the e-mail provider.
- [ ] Set the form recipients in Form builder.
- [ ] Send yourself a test enquiry and a test staff invitation.
- [ ] After e-mail delivery works, edit `contact.html` and delete the old fallback `<form>` fields that still contain the previous FormSubmit address (see the comment in the file); until then the old address remains visible in the page source, as in V3.
- [ ] In Supabase Authentication settings: set the Site URL to your website, enable "Confirm email", set minimum password length 10+, and keep e-mail change confirmations on.
- [ ] Decide whether visitors may load Google Fonts (choosing the default fonts keeps everything on your own server).
- [ ] Supply the replacement hero photographs listed in FINAL-REVIEW.md (photography cannot be generated honestly here).
- [ ] Read "Not yet built" in TEST-REPORT.md.

## Staff accounts without the Edge Function
If you do not deploy `staff-admin`, add people by hand: Supabase > Authentication > Add user (or Invite), then run the SQL in step 4 with their e-mail and a role (`admin`, `editor`, `hr`, `content`).
