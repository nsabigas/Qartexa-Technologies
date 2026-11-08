# Putting this version on your GitHub Pages site (step by step)

Your site address is `https://nsabigas.github.io/Qartexa-Tech/`.

## Why the site can look like plain text
If the page shows plain black text, blue links and a broken logo, the **style files (`css` folder) and pictures did not upload**. GitHub's browser uploader accepts **at most 100 files at a time**, and this website has 126 files, so one big drag-and-drop can leave folders out. The fix is to upload in **two smaller parts** (below) and then run the built-in check.

## Quick test: is the `css` folder there?
Open `https://nsabigas.github.io/Qartexa-Tech/css/tokens.css`. If you see lines of code, the folder is there. If you see "404", it is missing.

## Before you start
Save a backup: on GitHub open the repository **Qartexa-Tech** > green **Code** button > **Download ZIP**.

## Upload (two parts)
1. Extract `Qartexa-Deploy-1-main-files.zip` and `Qartexa-Deploy-2-folders.zip` into two separate folders on your computer.
2. On GitHub: repository **Qartexa-Tech** > **Add file** > **Upload files**.
3. **Part 1:** open the extracted folder of `Qartexa-Deploy-1-main-files` and drag **all the files inside it** (60 files: pages, logo and photos) onto the GitHub page. Wait until every file is listed, then press **Commit changes**.
4. **Part 2:** repeat with `Qartexa-Deploy-2-folders`. Drag the **five folders inside it** (`css`, `js`, `img`, `solutions`, `industries`). Wait until all are listed, then press **Commit changes**.
   - If GitHub says "too many files", upload the folders one at a time (`css` first).
5. Wait 1 to 2 minutes for GitHub to publish.

## Check that everything arrived
Open `https://nsabigas.github.io/Qartexa-Tech/deploy-check.html`. It checks all 126 files and shows a green message if all are present, or a red list of exactly which folders or files are missing. Upload what is listed, then reload the check page.

Then open the home page and press **Ctrl + F5** (Windows) or **Cmd + Shift + R** (Mac). On a phone, close and reopen the page.

## If something still looks wrong
Send me a screenshot of the `deploy-check.html` result. You can restore your backup by uploading its files the same way.

## Good to know
- The three files `Qartexa-Website-V5.1.zip` (everything, including guides and test files for developers) and the two Deploy packages contain the same website. For GitHub, use the **two Deploy packages**.
- GitHub Pages only serves the website pages. The Staff Portal features (media library, forms, jobs) additionally need your Supabase project and the settings in `js/qx-config.js` (see `V5-SETUP-GUIDE.md`).
- The `deploy-check.html` page changes nothing and can be deleted whenever you like.
