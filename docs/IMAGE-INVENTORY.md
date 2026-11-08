# Image inventory (generated from the website files)

Rebuilt by `python3 tools/build-inventory.py`. This is what the Staff Portal's **Page heroes** and **Site images** screens read, so the portal list and this document always match.

- **38 pages** can have a hero picture managed in *Page heroes*.
  - **25 pages** already show a photograph beside the heading: the manager *replaces that photo in place* (same layout).
  - **13 pages** (including the Home page) have no photograph in the heading or draw it with CSS: the manager adds a *full-width banner picture* with overlay, height and text colour. The Home page's built-in hero is drawn by CSS (a background plus a framed copy); both follow the new image.
- **4 capability cards** on the Home page (CSS pictures) are replaceable one by one.
- **12 other pictures** appear in *Site images* with Replace / Restore original.
- Not individually replaceable: small decorative design files (for example the Qartexa watermark and pin icon) and the logo (managed in *Logo & header*).

## Pages and their hero picture

| Group | Page | File | Mode in Page heroes | Built-in picture |
|---|---|---|---|---|
| Careers & resources | Blog & insights | `blog.html` | Full-width banner | none (text banner) |
| Careers & resources | Careers | `careers.html` | Full-width banner | none (text banner) |
| Careers & resources | Job page (each vacancy) | `job.html` | Full-width banner | none (text banner) |
| Careers & resources | Article page (each blog post) | `post.html` | Full-width banner | none (text banner) |
| Careers & resources | Tender page (each tender) | `tender.html` | Full-width banner | none (text banner) |
| Careers & resources | Tenders & procurement | `tenders.html` | Full-width banner | none (text banner) |
| Company & other | About Qartexa | `about.html` | Replace existing photo | `about-hero.jpg` |
| Company & other | Our approach | `approach.html` | Full-width banner | none (text banner) |
| Company & other | Ecosystem & partners | `ecosystem.html` | Replace existing photo | `partners-hero.jpg` |
| Company & other | Solution page (database-driven) | `solution.html` | Full-width banner | none (text banner) |
| Contact | Contact | `contact.html` | Replace existing photo | `contact-hero.jpg` |
| Contact | Form page (any form) | `form.html` | Full-width banner | none (text banner) |
| Home | Home | `index.html` | Full-width banner | CSS (`main-hero-image.jpg`) |
| Industries | Banking & Financial Services | `industries/banking-financial-services.html` | Replace existing photo | `../industries-africa-hero.jpg` |
| Industries | Education | `industries/education.html` | Replace existing photo | `../education-hero.jpg` |
| Industries | Energy & Utilities | `industries/energy-utilities.html` | Replace existing photo | `../industries-africa-hero.jpg` |
| Industries | Government & Public Sector | `industries/government-public.html` | Replace existing photo | `../government-public-hero.jpg` |
| Industries | Healthcare | `industries/healthcare.html` | Replace existing photo | `../healthcare-hero.jpg` |
| Industries | Hospitality & Tourism | `industries/hospitality-tourism.html` | Replace existing photo | `../industries-africa-hero.jpg` |
| Industries | Industries overview | `industries/index.html` | Replace existing photo | `../industries-africa-hero.jpg` |
| Industries | Manufacturing & Agriculture | `industries/manufacturing-agriculture.html` | Replace existing photo | `../industries-africa-hero.jpg` |
| Industries | Retail & Commercial | `industries/retail-commercial.html` | Replace existing photo | `../industries-africa-hero.jpg` |
| Industries | Telecommunications | `industries/telecommunications.html` | Replace existing photo | `../telecommunications-hero.jpg` |
| Legal | Cookie preferences | `cookies.html` | Full-width banner | none (text banner) |
| Legal | Privacy Policy | `privacy.html` | Full-width banner | none (text banner) |
| Legal | Terms of Use | `terms.html` | Full-width banner | none (text banner) |
| Solutions | AI & Digital Transformation | `solutions/ai-digital-transformation.html` | Replace existing photo | `../ai-digital-transformation-hero.jpg` |
| Solutions | Banking Technology | `solutions/banking-technology.html` | Replace existing photo | `../banking-solutions-hero.jpg` |
| Solutions | Cloud & Modern Workplace | `solutions/cloud-modern-workplace.html` | Replace existing photo | `../cloud-modern-workplace-hero.jpg` |
| Solutions | Cybersecurity | `solutions/cybersecurity.html` | Replace existing photo | `../cybersecurity-hero.jpg` |
| Solutions | Digital Infrastructure | `solutions/digital-infrastructure.html` | Replace existing photo | `../digital-transformation-hero.jpg` |
| Solutions | ICT Consultancy & Professional Services | `solutions/ict-consultancy.html` | Replace existing photo | `../ict-consultancy-hero.jpg` |
| Solutions | Solutions overview | `solutions/index.html` | Replace existing photo | `../solutions-hero.jpg` |
| Solutions | IoT & Smart Solutions | `solutions/iot-smart-solutions.html` | Replace existing photo | `../iot-smart-solutions-hero.jpg` |
| Solutions | Managed ICT Services | `solutions/managed-ict.html` | Replace existing photo | `../managed-ict-hero.jpg` |
| Solutions | Physical Security | `solutions/physical-security.html` | Replace existing photo | `../physical-security-hero.jpg` |
| Solutions | Power & Energy | `solutions/power-energy.html` | Replace existing photo | `../power-energy-hero.jpg` |
| Solutions | Software Engineering | `solutions/software-engineering.html` | Replace existing photo | `../software-engineering-hero.jpg` |

## Home page capability cards (CSS pictures)

| Card | Built-in picture |
|---|---|
| Digital transformation card | `img/digital-transformation-hero-card.jpg` |
| Cybersecurity card | `img/cybersecurity-hero-card.jpg` |
| Software engineering card | `img/software-engineering-hero-card.jpg` |
| ICT consultancy card | `img/ict-consultancy-hero-card.jpg` |

## Other pictures in *Site images*

| Page | Slot | Kind | Built-in picture |
|---|---|---|---|
| about | `i.g.f.83c56f` | img | `location-pin-white.png` |
| solutions_index | `i.solutions_index.247bad` | img | `../img/digital-transformation-hero-card.jpg` |
| solutions_index | `i.solutions_index.f5ac4d` | img | `../img/cloud-modern-workplace-hero-card.jpg` |
| solutions_index | `i.solutions_index.f00d15` | img | `../img/power-energy-hero-card.jpg` |
| solutions_index | `i.solutions_index.c2319e` | img | `../img/cybersecurity-hero-card.jpg` |
| solutions_index | `i.solutions_index.10d189` | img | `../img/physical-security-hero-card.jpg` |
| solutions_index | `i.solutions_index.ed9971` | img | `../img/managed-ict-hero-card.jpg` |
| solutions_index | `i.solutions_index.290702` | img | `../img/software-engineering-hero-card.jpg` |
| solutions_index | `i.solutions_index.caebf3` | img | `../img/ai-digital-transformation-hero-card.jpg` |
| solutions_index | `i.solutions_index.e1fbb1` | img | `../img/iot-smart-solutions-hero-card.jpg` |
| solutions_index | `i.solutions_index.f1c946` | img | `../img/banking-solutions-hero-card.jpg` |
| solutions_index | `i.solutions_index.077639` | img | `../img/ict-consultancy-hero-card.jpg` |

## Largest built-in image files (candidates to replace with optimised library pictures)

| Size | File |
|---|---|
| 79 KB | `img/ict-consultancy-hero-card.jpg` |
| 70 KB | `img/power-energy-hero-card.jpg` |
| 70 KB | `img/digital-transformation-hero-card.jpg` |
| 65 KB | `img/managed-ict-hero-card.jpg` |
| 63 KB | `img/iot-smart-solutions-hero-card.jpg` |
| 58 KB | `img/software-engineering-hero-card.jpg` |
| 58 KB | `img/cloud-modern-workplace-hero-card.jpg` |
| 53 KB | `img/cybersecurity-hero-card.jpg` |
