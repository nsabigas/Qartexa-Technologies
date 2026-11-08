# Backup and recovery guide

Plain-English rules: **your website has three kinds of things to protect**, and they are backed up in different places.

| What | Where it lives | Backed up by |
|---|---|---|
| 1. Content and settings (pages' text edits, jobs, tenders, blog, forms, submissions, staff list, hero settings, library records) | Supabase database | Supabase daily backups on the **Pro** plan (check the retention period shown in your Supabase project > Database > Backups). **The Free plan has no automatic backups.** |
| 2. The picture files themselves | Supabase Storage (`media` bucket) | **Not included in database backups.** You must copy them (see below). |
| 3. The website files (pages, code) | Your web host / this ZIP | Keep the ZIP you were given, and every later version, in a safe place (for example a company cloud drive). |

## Monthly routine (15 minutes)
1. **Download your data from the portal:** Form submissions > Export CSV; Applications > Export CSV; Activity log > Export CSV. Keep them in a private company folder (they contain personal information).
2. **Database backup:** Supabase > Database > Backups > download the latest backup. (Free plan: Supabase > SQL Editor can export tables; or ask a developer to run `pg_dump` once a month.)
3. **Pictures:** Supabase > Storage > `media` > download the `library` folder (or ask a developer to copy it with the Supabase S3-compatible access and a tool such as rclone). Do this after every large upload session.
4. Store the copies in two places (for example company drive + an external disk).

## Everyday undo (no backup needed)
- Changed a hero picture? **Page heroes > Restore previous image**, or **Back to original**.
- Replaced a library file by mistake? **Media library > the picture > Restore previous file**.
- Edited content by mistake? **Activity log > Details > Restore the earlier version**.
- Deleted something on purpose and want it back? Use the monthly backup below.

## Recovery: if the database is damaged or lost
1. Supabase > Database > Backups > pick a date > **Restore**. (Pro plan.) Supabase replaces the current database with that backup.
2. If you have no Supabase backup: create a new Supabase project, run `schema.sql`, `seed.sql`, `migration-v4.sql`, `migration-v5.sql`, then import your last data export. Update the project address and key in `js/qx-config.js`.
3. Sign in, check **Overview**, **Jobs**, **Tenders**, **Media library** and the homepage.

## Recovery: if pictures are lost
Upload the `library` folder copy back into Supabase > Storage > `media`, keeping the same folder names. The database still knows every picture's path, so pages will show them again. If you have only the original photographs, re-upload them and re-select them in **Page heroes**.

## Test your backups (once, now)
Create a free second Supabase project, restore a backup into it, and check that the data and pictures appear. A backup that has never been restored is not proven. **This has not been done for Qartexa yet** (no real Supabase project was available while building).

## Safe changes
Before running any new migration (`migration-v5.sql` etc.), take a backup first. Each migration only adds things and can be run twice; V5 also has `migration-v5-rollback.sql`.
