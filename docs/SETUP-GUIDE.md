# Qartexa website: one-time setup guide (versions 2 and 3)

This connects the website to a small online database so that your staff can **log in**, **add or hide solutions**, and publish **jobs, blog articles and tenders** without touching any code. You do this once (about 30 minutes). After that, everything is done from the staff portal.

> **Why is this needed?** A website on GitHub Pages is just files. It cannot store logins or data by itself. We use **Supabase**, a hosted database with built-in login, which has a free plan. The website pages talk to it directly. Check supabase.com for current plan limits and pricing before you rely on it.

Until you complete this guide, the website works exactly as before. The new pages (Careers, Blog, Tenders) show friendly "nothing yet" messages, and the portal says it is not connected.

---

## Step 1: Create the Supabase project
1. Go to **supabase.com**, create an account (use a company email) and click **New project**.
2. Name it `qartexa-website`. Choose a strong **database password** and save it in your password manager. Pick the region closest to your visitors.
3. Wait a few minutes until the project is ready.

## Step 2: Create the tables and security rules
1. In the left menu open **SQL Editor** and click **New query**.
2. Open the file `supabase/schema.sql` from this website folder, copy **everything**, paste it into the editor, and click **Run**. You should see "Success".
3. Open a **new query**, paste the whole of `supabase/seed.sql` (your 11 existing solutions and your 8 partner logos), and click **Run**.
   *(If you already did Step 2 for version 2, run `schema.sql` and `seed.sql` again. Both are safe to repeat and only add the new parts.)*

## Step 3: Create your administrator login
1. Open **Authentication → Users → Add user → Create new user**. Enter your email and a strong password (at least 10 characters). Tick **Auto confirm user** if you see that option.
2. Back in **SQL Editor**, run this (change the email to the one you just used):
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'YOUR-EMAIL@example.com';
   ```
   Repeat for every staff member who should be allowed in. Only people in this list can change anything, even if they have a login.

## Step 4: Switch off public sign-ups (important)
Open **Authentication → Sign In / Providers** (or **Settings**) and turn **off** "Allow new users to sign up". This stops strangers creating accounts. Even if someone did, the database rules would not let them change anything.

To make "Forgot password" emails work, open **Authentication → URL Configuration** and set **Site URL** to your website address (for example `https://nsabigas.github.io/Qartexa-Tech/` now, and `https://www.qartexa.com/` later).

## Step 5: Connect the website
1. Open **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
2. Open `js/qx-config.js` in the website folder and paste them:
   ```js
   supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
   supabaseAnonKey: 'eyJ...your anon public key...',
   ```
3. **Never** paste the `service_role` key anywhere in the website. The anon key is meant to be public; the rules from Step 2 protect your data.

## Step 6: Publish and test
1. Upload the website files to GitHub as you did before (drag the folders, then the files).
2. Open `your-site/portal.html` and sign in with the login from Step 3. You should arrive at the dashboard.
3. Test: add a **Job** with status **Open**, open `careers.html`, click it, and submit a test application with a small PDF. In the portal go to **Applications**: you should see it, and be able to download the CV.
4. Test: **Solutions → New solution**, then check the menu, footer, home page and Solutions overview. Hide it again when done.

(Optional) To see sample content first, run `supabase/sample-content.sql` once. Every sample title starts with SAMPLE: delete those rows from the portal before launch.

---

## Moving to your own domain later
Nothing in this setup depends on GitHub. When `www.qartexa.com` is live, upload the same files there and update **Site URL** in Supabase (Step 4). Logins, data and files stay as they are.

## Keeping it safe
- Use a strong, unique password and keep the list of admins short. Remove staff who leave (delete their row in the `admins` table and their user).
- Applications contain personal data. Only open them on trusted devices and delete them when no longer needed (see the retention wording in `privacy.html`).
- Supabase can back up your database. Check your plan's backup options, and export applications as CSV from the portal regularly.
- The free plan may **pause a project after a period of no activity**. If the lists suddenly look empty, open the Supabase dashboard and restore the project. The rest of the website keeps working.

## If something does not work
| What you see | What to check |
|---|---|
| Portal says "not connected" | `js/qx-config.js` still has empty values, or the file was not uploaded |
| "Wrong email or password" | Re-check the user in Authentication → Users; reset the password there |
| "This account is not authorised" | The email is missing from the `admins` table (Step 3, point 2) |
| Careers / Blog / Tenders are empty | Nothing is published yet, or items are still Draft; check status |
| Applications fail to send | Run `schema.sql` again (it is safe to repeat); check the CV is PDF or Word under 5 MB |
| Image upload fails | The `media` file folder is missing: run `schema.sql` again |
