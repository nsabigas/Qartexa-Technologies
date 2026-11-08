# Test report: Media Library and hero images (V5)

Run on 6 November 2026. Test code is in `tests/` (see `tests/README.md`).

## Plain summary
**Everything below under A was tested against simulated services. Nothing under B was possible, because no real Supabase project, e-mail service or Cloudflare account was available while building. Section C lists what is still untested.** Please do not treat A as proof that it works on your live accounts; it is proof that the code and the database rules behave correctly against a faithful stand-in.

## A. Tests that passed against SIMULATED services
**What "simulated" means here:** a real PostgreSQL 16 database built from your `schema.sql` + `seed.sql` + the migrations; the real PostgREST program (the same API layer Supabase uses); real Chromium browser tests; but a small test program imitating Supabase's login and file storage. Real photographs-like test files (3000×1600, 6000×4000, 900×1200, plus a 26 MB file, a tiny file, a fake JPEG and a text file) were processed by the real in-browser image engine.

| Suite | Result |
|---|---|
| Database rules, V4 (roles, expiry, forms, social, log) | **94 / 94** |
| Database rules, V5 (media, hero validation, draft/publish/restore, usage check, delete guard) | **43 / 43** |
| Public website (39 pages, expiry, forms, social, theme) | **43 / 43** |
| Staff portal (roles, appearance, social, forms, submissions, jobs, staff, account, activity) | **90 / 90** |
| **Media Library** (`e2e_media.py`) | **38 / 38** |
| **Homepage hero acceptance scenario** (`e2e_heroes.py`) | **31 / 31** |
| **Inner pages, cards, reuse, replace, delete, site images, editors, accessibility** (`e2e_heroes2.py`) | **42 / 42** |

Evidence the image work really happens (examples from these tests):
- A 3000×1600 photo uploaded through the editor, cropped 16:9 and zoomed, was stored as 1896×1067 in four WebP widths (400/800/1280/1896) plus one JPEG; every file under the 5 MB limit; all downloadable with the right content type.
- A 6000×4000 photo was reduced to 1920 px and stored at a fraction of its size; rotating a 900×1200 photo gave 1200×900; small images are never enlarged.
- Bad files were refused with plain messages: too small, not an image type, damaged file, over 25 MB. Nothing was stored.
- **Your acceptance scenario:** in the portal, Home was selected, a photograph was uploaded from a file, cropped, a focal point was clicked, overlay 60%, tall height and alt text were set; the live preview frame showed the draft; **Save draft** left visitors on the original hero; **Publish** put the new image on the public homepage with the right position, overlay, height and alt text; no JavaScript errors; no horizontal overflow on a phone.
- Phones downloaded a smaller file (≤ 800 px) than desktops (≥ 1280 px); a separate mobile picture was served only to phones.
- **Restore previous image** and **Back to original** returned the page to the earlier image and then to the original built-in hero (including the homepage's framed picture).
- Pages that already had a photo (About, Industries) got the replacement in the same place without moving the layout; the four homepage capability cards were replaced individually.
- One library image used on three pages: the portal listed all three places and refused to delete it; the database refused a direct delete; **Replace file** updated all three pages at once, **Restore previous file** put it back; after removal the image could be deleted and its files were removed from storage.
- Roles: HR cannot see or use the library or heroes, a visitor cannot call publish (HTTP 401/403), content/editor/admin can.
- Accessibility (axe-core, WCAG A and AA) found problems that were fixed; the Media library, Page heroes and Site images screens now report 0 violations (screens opened at their main state; automated checks catch only part of real accessibility problems).

### Bugs found by these tests and fixed during V5
The Publish confirmation message disappeared; heading colour and banner height lost to older stylesheets; the homepage's second (framed) copy of the photo was left behind; crop sliders were hidden in "Free" mode; the capability cards were wrongly assumed to be on the Solutions page; choosing a picture inside the Partner/Solution/Blog editors closed the editor and lost typed text (the picker now opens on top); form fields lacked accessible labels; page names in the hero list were technical; the library text promised AVIF that is not produced.

## B. Tests against the REAL Supabase project and other live services
**None performed.** Specifically not done: real Supabase Storage uploads (size limits, content types, permissions), real login/password reset/e-mail change/staff invitation e-mails, real e-mail delivery of form messages, real database backups and restore, the Supabase CDN's caching of replaced images, and the Edge Functions (`send-outbox`, `staff-admin`).

## C. Not yet tested or not built
**Not tested:** everything in B; Firefox, Safari, real tablets and phones (only Chromium; tablet checked only in the preview frame); Lighthouse performance scores and load tests; large real photographs (test images were synthetic; real photos compress differently, so real file sizes will be larger than in these tests); drag-and-drop file dropping (the file chooser path is tested); French proofreading of new screen text (the new portal screens are English only).
**Not built (requested in the brief, still open):**
- A full visual **section/page builder** with drag-and-drop, section templates, adding/duplicating/deleting pages (the existing in-page Studio editor for text, links and images remains).
- **Rich-text editor** for content fields.
- **Navigation and footer manager** (menus, dropdowns, footer columns).
- **SEO manager** (titles, descriptions, Open Graph, canonical, robots, structured data per page).
- **Website analytics** and the **notification centre**.
- **Custom font uploads**, and changing **icons/emojis** per section.
- Video sections; PDF/document handling inside the library (images only); copying one image's crop into several shapes.
- Full editing of *all* public text in portal forms (text on the built-in pages is still edited with the in-page Studio editor, not in portal forms).
- AVIF output (see STORAGE-AND-COSTS.md).
- Screenshots of the new screens in French, and a printed user manual.

---
## Addendum: Solutions and Industries overview layout fix (V5.1)
**Problem (reported with a screenshot):** on the Solutions overview the 4 practice groups were laid out side by side as narrow columns, so card headings and descriptions were clipped and unreadable. The same happened on the Industries overview. **I checked the original V3 files: the fault was already there** (not introduced by V4 or V5).
**Cause:** the wrapper `.phase82-families` was meant to be a simple stack, but the generic `.page-grid` rule turned it into a 3-column grid, making each group about 400 px wide.
**Fix:** a final CSS block in `css/phase8-2.css`: each practice is a full-width row with its kicker above the heading; cards sit in equal columns (3, or 4 for the four-card group; 2 on tablets; 1 on phones); the single Advisory card shows its picture beside the text; text can no longer be cut off; the "Explore" link uses a darker red for readable contrast. All pages now request `phase8-2.css?v=51` so browsers fetch the fix.
**Tested (simulated services, real browser):** `e2e_layout.py` **60 / 60** (both pages × 1910, 1280, 1024, 768, 390 px: groups stacked full width, correct card counts, no card below the minimum width, no clipped text, all pictures load, no sideways scroll, no JavaScript errors); axe accessibility **0 violations** on both pages at desktop and phone width; earlier suites re-run after the change: public 43/43, homepage hero 31/31, images 42/42. Screenshots: `docs/screenshots/20` to `23` (JPEG).
**Not tested:** Safari, Firefox and real devices; the live GitHub Pages site (the fix was verified on a local copy).
