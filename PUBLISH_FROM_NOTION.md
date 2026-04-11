# Publish after Notion edits

The live site only updates when **GitHub Actions** runs a new build (it pulls Notion at build time). Editing Notion alone does nothing until a build runs.

You have **three** complementary options—use any mix you like.

---

## 1) Automatic (no clicks) — scheduled deploy

The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) includes a **daily cron** (`12:30 UTC`). Notion edits can show on the site within about a day without you doing anything.

- **Disable:** delete or comment out the entire `schedule:` block under `on:` in that file, commit, and push.
- **Change time:** edit the `cron:` expression (see [crontab.guru](https://crontab.guru)).

---

## 2) GitHub website (no terminal) — manual “Run workflow”

1. Open the workflow page (one click from repo **Actions** tab):  
   **https://github.com/brockcraft/brockcraft.github.io/actions/workflows/deploy-pages.yml**
2. Click **Run workflow** → branch **main** → **Run workflow**.

*(Replace `brockcraft` if your GitHub username differs.)*

---

## 3) Terminal — CLI

From your local clone:

**GitHub CLI** (if `gh` is installed and authenticated):

```bash
cd "/path/to/websites/brockcraft.github.io"
gh workflow run deploy-pages.yml --ref main
```

**Plain git** (no `gh`):

```bash
cd "/path/to/websites/brockcraft.github.io"
git pull && git commit --allow-empty -m "chore: redeploy from Notion" && git push
```

---

## Copy-paste for Notion (comment, page, or DB description)

For a single block to paste into Notion, use the plain file **[`notion-publish-snippet.txt`](./notion-publish-snippet.txt)** (open it in the repo and copy all lines). It mirrors **①②③** above with the direct Actions link.

---

## “A button in Notion”

Notion does not run git or call GitHub natively. To get close, use **Make** / **Zapier** (Notion trigger → HTTP) against GitHub **`repository_dispatch`** (you would add that event and a token to the automation—extra setup; the three options above cover most cases).
