# Audit of V3 and feature inventory (done before any change)

Scope inspected: every folder and file of `Qartexa-Website-V3.zip` (39 HTML pages incl. portal/admin and dynamic pages, 8 CSS files, 13 JS modules, `schema.sql`, `seed.sql`, docs, tools, images).

## Already implemented and working in V3 (kept, not duplicated)
- 27-page bilingual (EN/FR) static site, sitemap.xml, robots.txt, structured data, canonical URLs.
- Supabase-backed dynamic pages: Solutions, Jobs/Careers, Blog, Tenders, Partners, with demo mode.
- Visual page editor ("Studio"): edit text, links, images in place; "All edits" list.
- Staff portal: Solutions, Jobs, Applications (with status + CSV export), Blog, Tenders, Partners, logo/header, contact details, edits.
- Login, password-reset request, set-new-password, change password, sign-out.
- Row Level Security on all tables; private CV bucket; media bucket.

## Weaknesses found in V3 (fixed in V4 unless listed under "Not yet built")
| # | Finding | Status |
|---|---|---|
| 1 | Job expiry was **date-only, client-side**. The database kept serving expired jobs and **accepted applications to them** | Fixed: exact time, enforced in the database policies and the application insert policy |
| 2 | Tenders had no automatic expiry, no past/open split, no archive | Fixed |
| 3 | One role only (`admins`); every admin could read applications | Fixed: 5 roles via `can()` |
| 4 | Contact form posted to a third-party service with the company e-mail in public HTML; no validation, rate limit or storage | Fixed: stored in your database, validated server-side, rate-limited, honeypot. (Old fallback markup stays until you delete it; see setup guide) |
| 5 | CV upload policy let anyone upload to any path in the bucket | Fixed: fixed folder only |
| 6 | Application inserts had no rate limit | Fixed: 5/hour per visitor |
| 7 | Future-dated blog posts compared by date only | Fixed: timestamp, enforced by the database |
| 8 | Four social links hard-coded into 39 pages + a 4-field settings form | Fixed: managed list (old HTML remains as fallback until you add your first account) |
| 9 | No activity log, no staff management | Fixed |
| 10 | Language button's accessible name did not contain its visible text; map link likewise; portal text contrast 2.6:1 | Fixed (axe: 0 violations on 9 screens) |
| 11 | Inter font is named in the CSS but never loaded, so it silently falls back to the system font | Documented; the Appearance manager can now load it (or any listed font) deliberately |
| 12 | No e-mail change for staff | Fixed (confirmation flow; not tested against real Supabase) |

## Inventory against your 23-section brief
| Section | Status |
|---|---|
| 1-2 Audit, brand | Done; brand colours, logo and images untouched; default theme adds zero CSS |
| 3 Appearance manager | **Done** except: icon/emoji changes for service cards and sections; custom-uploaded font files; per-component hover colours beyond buttons/links (see "Not yet built") |
| 4 Social media | **Done** |
| 5 Form builder | **Done** (15 field types, EN/FR, recipients, CC/BCC, acknowledgement, submissions, status, notes, archive, CSV). Multiple-form placement is via `form.html?f=name` (no page builder yet). E-mail delivery code written, **not tested live** |
| 6 Login/accounts | Roles, invite, deactivate/remove, password change/reset, e-mail change **done**; display-name editing, "active session list" not built |
| 7 Rich-text editor | **Not built** |
| 8 Jobs | Expiry, extend/reopen, new fields, applications, CSV (existing) **done**; jobs CSV export, featured highlighting on careers page not built |
| 9 Tenders | **Done** (expiry, open/past, archive, reopen, new fields). Hard-delete is available through the existing delete button. |
| 10 Media library | **Not built** (existing single-image upload remains) |
| 11 Page/section builder | **Not built** (existing visual editor remains) |
| 12 Navigation/footer manager | **Not built** (header/footer contact details and social links are editable) |
| 13 Blog | Scheduled publishing, archived status **done**; categories/tags/SEO fields exist in the database (tags, seo_title, seo_description) but have **no editor UI**; related articles, CSV not built |
| 14 SEO manager | **Not built**; existing sitemap/robots/canonicals preserved |
| 15 Analytics | **Not built** (recommendation: a privacy-friendly hosted service; see roadmap) |
| 16 Notifications | New-enquiry e-mail to multiple recipients **done** (untested live); job-application e-mail, notification centre, security-event e-mails not built |
| 17 Backup/restore/activity | Activity log with actor/old/new + restore **done**; CSV exports of submissions/applications/log **done**; full content export and page-content versions not built; backup guidance in SECURITY-CHECKLIST.md |
| 18 Performance/cost | **Done**; see ARCHITECTURE.md |
| 19 Security | **Done and tested** where listed in SECURITY-CHECKLIST.md |
| 20 Design/responsiveness | Desktop and mobile overflow tested on key pages; **hero image replacements not done** (needs real photography) |
| 21 Testing | See TEST-REPORT.md |


---
# V5 update: status against the "Final development brief"
Legend: DONE = built and tested on simulated services (see TEST-REPORT-V5.md); PARTLY = some of it; NOT BUILT.

| Brief item | Status | Notes |
|---|---|---|
| 3. Media library: upload, multiple upload, preview, crop/rotate/resize, compress, thumbnails, titles/descriptions/alt/credit, folders, search, reuse, sizes/dimensions, delete only after usage check, warnings, limits, progress, clear errors | **DONE** | Images become WebP in 4 widths + 1 JPEG. **AVIF: not produced** (browsers cannot encode it; see STORAGE-AND-COSTS.md). Separate tablet/mobile **pictures** supported for heroes; automatic per-device sizes for all. Image-file replace with undo. PDFs/documents are not in the library (existing PDF fields unchanged). |
| 3. Every hero image manageable (Home, About, corporate, services, industries, careers/resources, contact…) with upload/preview/focal point/overlay/height/alt/restore/draft/publish | **DONE** | All 38 pages and the 4 Home capability cards. Overlay/height/text colour apply to full-width banners; pages that already show a side photograph get that photo replaced (focal point, alt). Image inventory generated: `js/qx-inventory.js` (38 hero slots, 38 other picture slots). |
| 3. "Create an inventory of all images and connect them to the Media Library" | **DONE** | Site images screen + hero screen. Small decorative design files (watermark, icons in CSS) are not individually replaceable and are listed as such. |
| 4. Visual editor: sections, drag and drop, templates, device previews, draft/publish | **NOT BUILT** | The existing in-place visual editor (Studio) still edits text, links and pictures on current pages. No add/remove/reorder sections, no section templates, no new pages. |
| 5. Manage all public content | **PARTLY** | Already editable: solutions, jobs, tenders, blog, partners, contact details, logo, in-place page text/links/pictures (Studio), social links, forms. Not editable as structured content: vision/mission/values, company profile, industries, FAQs, legal pages (only via Studio in-place text); projects/case studies and testimonials do not exist as content types. |
| 6. Rich-text editor | **NOT BUILT** | |
| 7. Navigation and footer manager | **NOT BUILT** | |
| 8. Appearance manager: custom font uploads, icons/emojis | **PARTLY** | Colours, fonts (incl. any Google font), sizes, shapes, spacing, widths, animations, tablet/mobile, header/footer colours, live preview, undo, restore were done in V4. **Not done:** custom font uploads, icon/emoji manager; image overlays are per hero (done), not global. |
| 9. SEO manager, analytics, notification centre | **NOT BUILT** | Notification e-mails for new enquiries exist (untested live). |
| 9. Staff, forms, jobs, tenders, blog, social, activity log, account | **DONE in V4** | Unchanged and regression-tested. |
| 10. Performance | **PARTLY** | Responsive picture sizes, lazy library thumbnails, no new heavy libraries; hero image served as WebP at the right width. Lighthouse not run. |
| 11. Storage comparison and recommendation | **DONE** | STORAGE-AND-COSTS.md (Supabase vs Cloudflare R2, current prices). No migration performed or needed. |
| 11. Backup and recovery | **DONE (documented)** | BACKUP-AND-RECOVERY.md. Never tested against a real project. |
| 12. Security review | **DONE for new features** | Hero settings are validated by the database (strict shape); in-use images cannot be deleted; staff-only writes; drafts private. Live-service verification outstanding. |
| 14. Test evidence split A/B/C, screenshots | **DONE** | TEST-REPORT-V5.md; `docs/screenshots/` |
| 15. Administrator guide with screenshots, setup, deployment, backup, costs, audit | **DONE** for V5 features | ADMIN-GUIDE.md (V5 section), V5-SETUP-GUIDE.md, BACKUP-AND-RECOVERY.md, STORAGE-AND-COSTS.md |
| 17. Acceptance demonstration (upload hero from computer, preview, position, save, publish, see on public site; repeat for every image) | **DONE on simulated services; to be confirmed live** | Automated in `e2e_heroes.py` and `e2e_heroes2.py` |

---
# V5 audit: status against the "final brief" (6 November 2026)
Legend: ✅ built and tested against simulated services · 🔶 built, needs a live check on your accounts · ❌ not built

| Brief section | Status | Notes |
|---|---|---|
| 3. Media library: upload (single, multiple), preview, crop/rotate/resize, auto-compress, thumbnails, desktop/tablet/mobile versions, title/description/alt/credit, folders, search/filter, reuse, dimensions and sizes, delete only when unused, warn on replace/delete, size/type limits, progress and clear errors | ✅ | WebP + JPEG fallback in 4 widths. **AVIF not produced** (browser limitation, see STORAGE-AND-COSTS.md). Drag-and-drop uses the same path as the file chooser (chooser tested). Documents/PDF are not in the library yet. |
| 3. Hero images on every page: upload/replace, preview, focal point, overlay colour and opacity, height, alt text, restore previous, draft, publish | ✅ | 38 pages + 4 home cards. Inventory in IMAGE-INVENTORY.md. Heights/overlay apply to full-width banner pages; pages that already show a photo get an in-place replacement with focal point. |
| 3. "No existing hero left hard-coded where it cannot be replaced" | ✅ | Home's CSS hero + framed copy, 25 in-page photos, 13 banner pages, 4 cards. Built-in files remain as the safety net. |
| 3. Inventory of all images connected to the library | ✅ | `docs/IMAGE-INVENTORY.md` and the Site images screen (12 other pictures replaceable). |
| 4. Visual page editor: add/remove/reorder sections, drag and drop, templates, backgrounds, video, device previews | ❌ | The older in-page Studio (text, links, images) is unchanged. |
| 5. Manage all content | 🔶 partial | Solutions, blog, jobs, tenders, partners, contact, social, forms, pictures: yes. Text on built-in pages: only through the in-page Studio. FAQ, projects/case studies, legal pages as separate managed content: ❌ |
| 6. Rich-text editor | ❌ | |
| 7. Navigation and footer manager | ❌ | |
| 8. Appearance and brand manager: complete | 🔶 | V4 manager unchanged. Custom font uploads, icons/emojis, image overlays beyond heroes: ❌ |
| 9. Staff/roles, forms, jobs, tenders, blog, social, activity log, account | ✅ (V4) | SEO management, analytics, notification centre: ❌ |
| 10. SEO manager and site speed | ❌ / ✅ | SEO manager not built. Speed: responsive images by device, lazy structure unchanged, no new heavy libraries (qx-hero.js ≈ 9 KB). |
| 11. Storage comparison, low cost, safe migration plan, policies, backup | ✅ | STORAGE-AND-COSTS.md (checked prices), BACKUP-AND-RECOVERY.md. Recommendation: stay on Supabase Pro. No migration performed. |
| 12. Security review | 🔶 | Database rules tested (137 checks). Live auth, invitation, e-mail, storage tests not done. |
| 14. Test separation A/B/C, screenshots | ✅ | TEST-REPORT-V5.md; screenshots in docs/screenshots/ |
| 15. Deliverables | partial | Source, portal, library, heroes, migrations (with rollback), guides, backup guide, costs: yes. Remaining CMS modules: no. |
