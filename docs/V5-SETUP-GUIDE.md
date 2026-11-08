# V5 setup guide: Media Library and page hero images

**Who this is for:** the person running Qartexa's website. No coding is needed for day-to-day use. The one-time setup below needs about 15 minutes in Supabase.

## What V5 adds
| New screen in the Staff Portal | What it does |
|---|---|
| **Media library** | Upload photos from your computer (one or many). Crop, rotate and resize. Each is shrunk and saved in several sizes (WebP + a JPEG fallback) so pages load fast. Add title, description, alt text (English and French) and credit. Folders, search, "where is this used?", safe delete, replace file with undo. |
| **Page heroes** | Every page's hero picture (38 pages) plus the four capability cards on the Home page: choose a picture, set the focal point, overlay colour and strength, height, text colour, optional different pictures for tablet and mobile, preview on three screen sizes, save a draft, publish, restore the previous picture, or go back to the original. |
| **Site images** | A list of every other picture on the website pages, each replaceable from the library, with "Restore original". |
| Image fields | The Partner logo, Solution image and Blog cover fields now use the library (optimised) instead of raw uploads, and you can pick an existing image. |

## One-time setup
1. In Supabase, open **SQL Editor**, create a new query, paste the contents of **`supabase/migration-v5.sql`** and press **Run**. It only *adds* things; it does not change or delete your existing content. It is safe to run twice.
2. Nothing else to configure: pictures use the existing `media` storage bucket. The migration only widens that bucket's allowed file types (it also accepts AVIF files) and keeps the 5 MB per-file limit.
3. Upload the new package to your web host as before.
4. Sign in to the Staff Portal (`portal.html`). You will see **Page heroes**, **Media library** and **Site images** under *Website*.

**To undo V5 completely:** run `supabase/migration-v5-rollback.sql`. It removes the library records and hero settings (the picture files stay in Storage until you delete them; the website then shows the original banners again).

## Your first hero image (the acceptance walk-through)
1. **Page heroes** > click **Home**.
2. Click **Upload new**, choose a photograph from your computer.
3. The picture editor opens. The shape is already a wide banner. Move the picture by dragging, zoom with the slider, rotate if needed. Type a title and a short description of the picture (the "alt text"). Click **Save to library**. (Use photographs at least 1920 px wide.)
4. Click the point of the photo that must always stay visible (for example a person's face).
5. Choose how dark the overlay is (it keeps the heading readable), the banner height and white or navy text.
6. Look at **Desktop / Tablet / Mobile** in the preview.
7. **Save draft** keeps your work private. **Publish** puts it on the public website. Visitors may take up to two minutes to see it because browsers keep a short-lived copy.
8. To undo: **Restore previous image** (swaps back) or **Back to original** (the page returns to its built-in banner).

Repeat for any page. The same library picture can be used on many pages; replacing the file (Media library > the picture > **Replace file**) updates every page at once, and **Restore previous file** undoes it.

## Good to know
- **Alt text**: describe what the picture shows. Leave empty only for purely decorative pictures. This helps visitors using screen readers and helps search engines.
- **Deleting**: you cannot delete a picture that is used somewhere; the portal lists where, and the database also refuses.
- **Limits**: JPG, PNG, WebP or AVIF files up to 25 MB, at least 200×100 px, up to 60 megapixels. Each stored file is under 5 MB (Supabase limit).
- **Built-in pictures** (those the site was built with) stay in the website files as the safety net; they are only hidden while a custom hero is published.
- **New pages**: when pages are added to the website, a developer runs `python3 tools/build-inventory.py` so they appear in Page heroes.
