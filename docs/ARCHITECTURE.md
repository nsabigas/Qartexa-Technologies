# Technical architecture and running costs

## Shape of the system
```
Visitor browser ──static files──▶ Static host (GitHub Pages / Cloudflare Pages / Netlify)
       │  anon key (public by design)
       ▼
 Supabase: Postgres + Row Level Security + Auth + Storage
       ├─ public reads only see live rows (policies check status AND closing time on every query)
       ├─ visitors write ONLY via function submit_form() or the job-application insert policy
       └─ Database Webhook ──▶ Edge Function send-outbox ──▶ e-mail provider (Resend)
Staff browser ──JWT──▶ same Supabase; every write is checked by public.can(area)
Super Administrator invites ──▶ Edge Function staff-admin (holds the service-role key server-side)
```
No frameworks were added. Public pages gain: `qx-theme.js` (16 KB, every page), `qx-forms.js` (11 KB, form pages only), `qx-icons.js` (16 KB, only when social links exist). Staff-only code (`qx-admin2.js`, 58 KB) never loads for visitors.

## Key decisions
- **Theme = closed schema, not CSS.** `qx-theme.js` validates every value (hex colours, number ranges, whitelisted fonts) and builds CSS from fixed templates. Only differences from the Qartexa default are emitted, so the default theme adds no CSS.
- **Expiry is evaluated at query time.** The public read policy for jobs/tenders is `status='open' AND (closing_at is null OR closing_at > now())`. A scheduled job (`expire_items()`, optional pg_cron) only tidies the status label; if it never runs, nothing expired is visible.
- **Forms:** definitions are public via `get_form()` (without recipient addresses). Submissions go through `submit_form()` which re-validates everything server-side (required, types, option lists, number ranges, regex, length), drops unknown fields, enforces rate limits (5 per 10 minutes per visitor, 60 per minute overall) and queues e-mails. Direct table writes by visitors are denied.
- **Roles:** `public.can('area')` is the single source of truth, used by every policy and mirrored in the portal menu.
- **Activity log:** database triggers record each staff change with actor and old/new values. Applications and form messages are logged by status only.
- **Social SVGs:** sanitised in the browser when saved and again when displayed; the database also restricts URLs to https/mailto/tel.

## Hosting and monthly cost (checked against public pricing pages, 2026; confirm before committing)
| Item | Plan | Cost | Limits that matter |
|---|---|---|---|
| Static website hosting | GitHub Pages / Cloudflare Pages / Netlify free | $0 | Fair-use bandwidth; custom domain supported |
| Domain name | existing | ~$10-20/year | n/a |
| Supabase | **Free** | $0 | 500 MB database, 1 GB file storage, 5 GB egress/month, 50,000 monthly users, **project pauses after 1 week of inactivity** |
| Supabase | **Pro** (recommended for a live company site) | **$25/month** (+usage) | 8 GB database, 100 GB storage, 250 GB egress, no pausing, daily backups |
| E-mail sending (Resend) | Free | $0 | 3,000 e-mails/month **and max 100/day**, 1 domain |
| E-mail sending (Resend) | Pro | $20/month | 50,000 e-mails/month, no daily cap |

- **Minimum possible:** $0/month (Free + Free). Risk: the Supabase free project **pauses after a week without activity** and the website's dynamic parts (jobs, forms, theme) stop until it is resumed. Not recommended for the live site.
- **Recommended:** about **$25/month** (Supabase Pro) + $0 (Resend free; one enquiry creates 1-2 e-mails, so 100/day is ample for normal volume) + hosting $0 = **~$25/month**, plus domain.
- Edge Function invocations (one per queued e-mail) are far inside the plan allowances.
- Free tiers are not unlimited; revisit if you pass the limits above.

## Browser and caching notes
Visitors' browsers keep the last theme and the content lists for up to 2 minutes. After you press Publish, most visitors see the change on their next page load; some may take up to 2 minutes. Job/tender deadlines are re-checked on every page view regardless of that cache.
