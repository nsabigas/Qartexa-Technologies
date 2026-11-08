# Image storage: options, current prices and recommendation

Prices checked on 6 November 2026 from public pricing pages (Supabase, Cloudflare). Prices and free allowances change; confirm before you commit.

## What the Media Library stores
Each uploaded picture is saved as about 5 to 9 small files (WebP at 400/800/1280/up-to-1920 px, plus one JPEG). **My estimate** (not measured on real Qartexa photographs yet): roughly 0.5 to 1 MB per picture in total, so 100 pictures ≈ 50–100 MB and 500 pictures ≈ 250–500 MB. The Media library shows each picture's real size once you upload.
A visitor downloads only one size per picture (for example about 100–350 KB for a hero), not all of them.

## Options compared
| | **Supabase Storage** (already in use) | **Cloudflare R2** |
|---|---|---|
| Free allowance | 1 GB storage, 5 GB transfer/month, on the Free plan | 10 GB storage, 1 M writes, 10 M reads per month |
| Paid | Included in **Pro ($25/month)**: 100 GB storage, 250 GB transfer | $0.015 per GB-month above 10 GB; $4.50 per million writes; $0.36 per million reads |
| Transfer (visitors downloading pictures) | Counted against the plan | **Free** |
| Needs extra code and a secret key | **No** (already built and tested here with the staff login) | **Yes**: uploads need a small server-side function (Cloudflare Worker or Supabase Edge Function) holding R2 keys, plus a public domain for the bucket |
| Pausing | Free Supabase projects **pause after a week of inactivity** (pictures would stop loading) | R2 does not pause |
| Permissions model | Same database rules as the rest of the site (tested) | Would need to be rebuilt and tested |

## Recommendation
**Stay on Supabase Storage on the Pro plan (about $25/month, the same plan already recommended for the database).** Reasons:
1. For a corporate site with a few hundred pictures and moderate traffic, 100 GB of storage and 250 GB of transfer are far more than needed, so pictures cost **no extra** beyond the $25 plan.
2. It is already integrated, secured by the staff roles and tested; R2 would add a server-side upload function, a secret to protect and new permissions to test.
3. Fewer services to maintain.

**If you stay on the Free plan:** pictures work, but (a) the project can pause after a week without activity, and (b) 5 GB of transfer is roughly 10,000 to 15,000 page views a month at ~300–500 KB of pictures per page (my estimate). That is acceptable for a trial, not for a live company site.

**When R2 becomes worth it:** if transfer regularly exceeds the Pro allowance (hundreds of thousands of page views a month) or the library grows beyond 100 GB. Then R2's free transfer saves money.

## If you ever move to R2 (plan, not done)
1. Create the bucket and a public domain; create a restricted API key (stored only in a server function).
2. Build and deploy an upload function that checks the staff login and role, then returns a short-lived upload link; keep the 5 MB limit and file-type checks.
3. Copy existing files from the Supabase `media` bucket to R2 keeping the same folder paths (`library/<id>/<width>.webp`).
4. Change the single public base address used by the website (`BASE` in `js/qx-hero.js` and `js/qx-admin3.js`); the database stores only relative paths, so nothing else changes.
5. Test on a copy first. Keep the Supabase files for 30 days.
Because paths are relative, the move is a copy plus one address change, and is reversible.

## AVIF
The images are produced as **WebP** (supported by all current browsers) plus a JPEG fallback. **AVIF** files are not produced: browsers cannot create AVIF from the in-browser editor (tested in Chromium; the code switches AVIF on automatically for any browser that supports it). True AVIF would need either a server-side image service (extra cost and secret keys) or a WebAssembly encoder (adds about 1 MB to the staff portal and is slow on large photos). WebP already gives most of the saving; I recommend not adding either now.

## Total monthly cost, recommended setup
| Item | Cost |
|---|---|
| Static website hosting (GitHub Pages / Cloudflare Pages / Netlify free plan) | $0 |
| Supabase Pro (database, login, picture storage, server functions) | $25 |
| E-mail sending (Resend free plan: 3,000 e-mails/month, 100/day) | $0 |
| Domain name | about $10–20 per year |
| **Total** | **about $25 per month + domain** |
