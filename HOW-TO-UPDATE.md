# How to update your group website

You never need to touch any code. Everything on the website comes from a few
plain text files in the `data` folder and photos in the `photos` folder.
You edit them on the GitHub website, press **Commit changes**, and the live site
updates by itself about one minute later.

| What you want to change | File or folder |
|---|---|
| Lab name and intro, your name, headline, research tags, email and links | `data/profile.yml` |
| Members, students, alumni, your positions | `data/members.yml` |
| Member photos | `photos/members/` |
| Research areas, current projects, funded projects | `data/research.yml` |
| News | `data/news.yml` |
| Teaching (courses) | `data/teaching.yml` |
| Your photo | `photos/members/` (name set in `data/profile.yml`) |
| Group photos | `data/gallery.yml` + `photos/gallery/` |
| Campus photo (bottom of front page) | `photos/site/` (name set in `data/profile.yml` under `banner`) |
| Logo strip (institution logos) | `photos/logos/` (names set in `data/profile.yml` under `logos`) |
| Lab logo | `photos/site/logo.png` (upload a new file with the same name) |
| Publications | Automatic from Google Scholar. Corrections in `data/publications-extra.yml` |

---

## Everyday tasks

### Edit any text
1. Open your repository on github.com and click into the `data` folder.
2. Click the file (for example `profile.yml`), then the **pencil icon** (Edit) at the top right.
3. Change the words after the colon `:`.
4. Click the green **Commit changes** button, then **Commit changes** again.
5. Wait about a minute and refresh your website.

**Three rules that keep the files working**
- Keep the spaces at the start of each line exactly as they are. Use spaces, never Tab.
- If your text contains a colon `:` or starts with a quote, wrap the whole text in "double quotes".
- Lines starting with `#` are notes for you. The website ignores them.

If you break something, the website shows a red box saying which file has the problem.
You can always undo: open the file, click **History**, open the previous version, and copy it back.

### Add a new student
1. Open `data/members.yml` and click the pencil icon.
2. Find the right group (`Master's students`, `Undergraduate students` or `Alumni`).
3. Copy an existing person's block, for example:
   ```yaml
         - name: Md. Abu Salman
           topic: Intelligent fault localisation in modern grids
           email: m241104.eee@student.just.edu.bd
           photo: ""
   ```
4. Paste it directly under the last person in that group, keeping the same indentation, and change the details.
5. Commit changes.

### Add or change a member photo
1. Prepare the photo: roughly square, JPG or PNG, under 500 KB.
   Name it simply, in lowercase with no spaces, like `abu-salman.jpg`.
2. Go to the `photos/members` folder, click **Add file > Upload files**, drag the photo in, and click **Commit changes**.
3. Open `data/members.yml`, find the person, and set `photo: abu-salman.jpg`.
4. Commit changes.

**To replace a photo**, just upload a new file with the **same name**. GitHub replaces the old one and nothing else needs changing.
Student photos are optional. Without one, the card simply shows the name, email and topic.

### A student graduated
In `data/members.yml`, cut their block from the student group and paste it under `Alumni`.
Optionally add a line saying where they went:
```yaml
      - name: Fouziya Easmin Tonny
        topic: ML-based fault diagnostics
        now: Fully funded PhD, University of Toronto
        photo: ""
```
You can delete the `email:` line for alumni if you prefer.

### Add a former student to the Alumni Spotlight
At the bottom of `data/members.yml`, under `alumni:`, copy one block and change it:
```yaml
  - name: Fouziya Easmin Tonny
    now: PhD Student (fully funded), University of Toronto, Canada
    worked_on: ML-based fault diagnostics
    photo: ""
```
`now` is their current position. Put the most notable people at the top.
For a photo, upload it to `photos/members/` and write the file name after `photo:`.

### Add news
Open `data/news.yml`. Copy the first block, paste it **at the top** (newest first), and edit it:
```yaml
- date: "2026"
  tag: Publication
  text: Our paper on tactical microgrids was accepted in Energy Reports.
  link: https://doi.org/10.1016/j.egyr.2026.109838
```
`date` can be a full date (`"2026-11-13"`), a month (`"2026-11"`), a year, or `""`.
`tag` is Announcement, Achievement or Publication. `link` is optional; leave it as `""` if there is none.

### Add group photos
1. Upload the photos to `photos/gallery/`.
2. In `data/gallery.yml`, add two lines per photo under `photos:`:
   ```yaml
   photos:
     - photo: group-2026.jpg
       year: "2026"
   ```
   The year buttons above the photos are made automatically.

### Making the automatic update reliable (recommended, free, 5 minutes)
Google sometimes blocks automatic visits to Scholar from GitHub's servers. When that happens
nothing breaks: the site simply keeps the last list. To avoid it, use SerpAPI, a service that
reads Scholar for you. Its free plan (100 lookups a month) is far more than you need (about 4 a month).
1. Sign up at serpapi.com and copy your **API key** from your dashboard.
2. In your GitHub repository: **Settings > Secrets and variables > Actions > New repository secret**.
3. Name: `SERPAPI_KEY`. Secret: paste the key. Click **Add secret**.

That's all. The weekly update will use it automatically.

---

## One-time setup (about 20 minutes)

You can also skip this part: create an empty GitHub repository, tell Claude its name, and the files can be uploaded for you.

### 1. Put the files on GitHub
1. Create a free account at github.com (if you don't have one).
2. Click **+ > New repository**. Name it, for example, `eg-lab`. Choose **Public**. Click **Create repository**.
3. Click **uploading an existing file**, drag in **everything inside** the `eg-lab-website` folder
   (`index.html`, `assets`, `data`, `photos`, `scripts`, and the rest), and click **Commit changes**.
4. Check that the folder `.github/workflows` was uploaded. Computers often hide folders starting with a dot,
   so if it is missing: click **Add file > Create new file**, type the name
   `.github/workflows/update-publications.yml`, paste the contents of that file, and commit.

### 2. Publish the site (pick one)

**Option A: GitHub Pages (simplest, everything in one place)**
1. In the repository: **Settings > Pages**.
2. Under "Build and deployment", Source: **Deploy from a branch**. Branch: **main**, folder **/ (root)**. Click **Save**.
3. After a minute your site is live at `https://YOUR-USERNAME.github.io/eg-lab/`.

**Option B: Netlify (keeps your current eg-lab-just.netlify.app address)**
1. Log in to Netlify and open your existing site.
2. **Site configuration > Build & deploy > Link repository**, choose GitHub and your `eg-lab` repository.
3. Leave the build command empty and set the publish directory to `/` (or leave it blank). Deploy.
From then on, every change you commit on GitHub goes live on Netlify automatically.

### 3. Turn on the weekly publications update
1. Open the **Actions** tab. If GitHub asks, click **I understand my workflows, go ahead and enable them**.
2. Run **Update publications** once by hand (see above) to load your full Scholar list.
3. Optional but recommended: add the `SERPAPI_KEY` secret (see above).

---

## Checking a change before it goes live (optional)
The site reads its files from the web, so double-clicking `index.html` on your computer shows an empty page.
That is normal. Check changes on the live site instead, or preview the file you edited with
GitHub's **Preview** tab while editing.
