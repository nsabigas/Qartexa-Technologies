# Qartexa website: code guide

How this website is organised, so anyone opening the code can find the right part quickly.

## 1. Folder map

| Item | What it is |
|---|---|
| `index.html` | Home page |
| `about.html`, `ecosystem.html`, `contact.html` | Main company pages |
| `privacy.html`, `terms.html`, `cookies.html` | Legal pages |
| `solutions/` | Solutions overview (`index.html`) + 11 solution pages |
| `industries/` | Industries overview (`index.html`) + 9 industry pages |
| `css/` | Styles (see section 4) |
| `js/` | Scripts: menu, search, animations, search data |
| `img/` and `*.png`, `*.jpg` | Logos, hero images, partner logos, icons |
| `tools/build-search-index.py` | Rebuilds the search data after text edits (section 6) |
| `sitemap.xml`, `robots.txt` | For search engines |

**Images are already optimized** (about 4 MB in total). Large hero photos are `.jpg`, up to 1400 px wide. When you add a new photo, resize it to 1400 px wide or less and save it as JPG (quality about 75-80) before uploading, otherwise pages will load slowly.

## 2. How every HTML page is organised

Each page starts with a **FILE GUIDE** comment listing its sections, then uses banners:

* **Big `====` banners** mark the main parts, always in this order:
  1. HEAD (title, description, social-sharing tags, icons, stylesheets)
  2. SKIP LINK (accessibility)
  3. TOP BAR (company name, email, phone)
  4. HEADER / MAIN NAVIGATION (logo, menu, language switch, Contact button)
  5. MAIN CONTENT, split into numbered sections (5.1, 5.2, ...), each with its own banner
  6. FOOTER
  7. SCRIPTS
* **Small `~~~~` lines** mark sub-parts (a menu dropdown, a footer column, the contact form, the hero image).
* The last line of every page is `END OF PAGE`.

Tip: in any editor, search for `5.` or a name such as `FOOTER` to jump straight to a part.

## 3. Parts repeated on every page

The top bar, header and footer are **copied into all 30 pages** (there is no shared template). If you change one of them, change it on every page. On GitHub, press the `.` key in the repository to open the web editor, then use **Search → Replace** across all files.

## 4. Stylesheets (loaded in this order; later files win)

| File | Purpose |
|---|---|
| `tokens.css` | Brand colours (navy, red), fonts, sizes: **change brand colours here** |
| `global.css` | Base look: body text, links, focus outline |
| `components.css` | Header, menu, buttons, cards, forms, footer |
| `responsive.css` | Tablet and phone adjustments |
| `home.css` | Home page and shared hero layouts |
| `contact.css` | Contact page form (contact page only) |
| `phase8-1.css` | Design refinements, round 1 |
| `phase8-2.css` | Latest refinements: search panel, footer, legal pages, hero animation |

## 5. Where to change common things

| I want to change... | Go to |
|---|---|
| Brand colours | `css/tokens.css` (and check `css/phase8-2.css` for the red `#e80000` used in new parts) |
| Email or phone in the top bar and footer | Section 3 (TOP BAR) and 6 (FOOTER) in **every page** |
| Menu links and dropdowns | Section 4 (HEADER) in **every page** |
| Footer columns, address, social links | Section 6 (FOOTER) in **every page** |
| Social handle (`@qartexatech`) | Footer "Follow us" block in every page, plus its entry in the `frText` list |
| Page text | The page's section 5.x; edit the English text **and** its `data-en` / `data-fr` attributes |
| French wording | `data-fr` attributes, and the `frText` list in the language-switch script near the bottom of each page |
| Contact form recipient | `contact.html`, the `<form>` tag: the `action` address ends with the inbox that receives enquiries (currently `qartexa@gmail.com`; the first submission must be activated once from that inbox) |
| Which pages appear in Search, and their titles | `js/search.js`, the `pages` list at the top |
| Hero animation on the home page | Markup `hero-fx` in `index.html`; styles in `css/phase8-2.css` |
| Legal text | `privacy.html`, `terms.html`, `cookies.html` (section 5.x of each) |
| Website address used by search engines | `<link rel="canonical">` in each page's HEAD, and `sitemap.xml` / `robots.txt` |

## 6. After you edit page text: rebuild the search data

Search reads `js/search-index.js`, which is **generated** from the pages. If you change page text, rebuild it:

```
pip install beautifulsoup4
python3 tools/build-search-index.py
```

Then upload the updated `js/search-index.js` with your changed pages. If you add a **new page**, also add it to the `pages` list in `js/search.js` first.

## 7. Check after every change

Open the changed page, press the **FR** button to test French, try **Search**, and test at phone width.

## 8. Version 2: staff portal and dynamic pages

| File | What it does |
|---|---|
| `portal.html`, `admin.html` | Staff login and dashboard (not indexed by search engines) |
| `careers.html`, `job.html` | Open positions and the application form |
| `blog.html`, `post.html` | Article list and one article |
| `tenders.html`, `tender.html` | Tender list and one tender |
| `solution.html` | Page for solutions created in the portal (`?s=slug`) |
| `js/qx-config.js` | **Connection settings (the only file to edit to connect the database)** |
| `js/qx-core.js` | Data layer (Supabase or demo mode), formatter, English/French text |
| `js/qx-site.js` | On every page: hides/adds solutions in menus, footer, home and overview; fills the home "Latest" band |
| `js/qx-pages.js` | Controllers for the public pages above |
| `js/qx-portal.js`, `js/qx-admin.js` | Login and dashboard |
| `js/qx-seed.js` | Demo-mode sample data (only loaded when `demo: true`) |
| `css/qx.css`, `css/qx-admin.css` | Styles for the new pages and the portal |
| `supabase/*.sql` | Database tables, security rules, your 11 solutions, optional sample content |
| `docs/` | Setup guide and everyday admin guide |

**How it fits together:** public pages read published rows from the database (cached for 2 minutes per visitor). The database rules (`schema.sql`) let visitors read published content and send applications; only users listed in the `admins` table can change anything. If the database is not connected, every new page shows a friendly empty message and the original pages are untouched.

**Adding another content type later:** add a table in `schema.sql` (with security rules), add a schema entry in `js/qx-admin.js` (`SCH`), and a controller in `js/qx-pages.js`.

## 9. Version 3: the visual editor (Studio)

Everything on the pages can be edited by signed-in staff, and saved edits are stored in the database and applied on top of the original page.

| File | What it does |
|---|---|
| `js/qx-cms.js` | On every page: applies saved edits (text, pictures, links), the logo, contact/social settings, custom links and the partner logos |
| `js/qx-studio.js`, `css/qx-studio.css` | The visual editor. Loaded only for signed-in admins (bar at the bottom left of each page) |
| `tools/tag-cms.py` | Adds the hidden editing keys (`data-cms`, `data-cms-img`, `data-cms-link`...) to every editable item. Run it after adding a **new page** or new text by hand: `python3 tools/tag-cms.py` |
| `supabase/schema.sql` (V3 block) | Tables `cms_overrides` (saved edits), `site_settings` (logo, contact, social, added links) and `partners` |

**How it works:** each editable element has a stable key. When staff save a change, a row `key -> new text / picture / link` is stored. On every page load, `qx-cms.js` reads the rows for that page (plus the shared header/footer rows) and applies them. "Reset to original" deletes the row, so the original text in the HTML file shows again. The HTML files are never modified by the editor.

**Keys:** `p.<page>.<hash>` = text on one page; `g.h|g.f|g.t.<hash>` = header, footer or top bar text shared by every page; `i.…` = pictures; `l.…` = links.

**Header and footer:** edited once, they change on every page. Links can be renamed, re-pointed, hidden, or added after an existing link. The logo size and file are set in the portal under *Logo & header*.

**Partners:** the partner strip is rebuilt from the `partners` table (Partners in the portal). If the table is empty, the logos in the HTML are used.
