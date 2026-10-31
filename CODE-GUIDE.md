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
| Contact form recipient | `contact.html`, the `<form>` tag (`action` points to FormSubmit) |
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
