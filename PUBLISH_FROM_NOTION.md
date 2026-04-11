# Publish after Notion edits

The live site only updates when **GitHub Actions** runs a new build (it pulls Notion at build time). Editing Notion alone does nothing until a build runs.

---

## Copy-paste for Notion (comment, page, or DB description)

Paste the block below into a **database comment**, a pinned **“Publishing”** subpage, or the database **description** so it’s always one click away.

```
── Publish site (after Notion changes) ──

① GitHub (no terminal)
   • Open: https://github.com/brockcraft/brockcraft.github.io/actions
   • Workflow: “Deploy to GitHub Pages”
   • “Run workflow” → Branch: main → Run workflow

② Terminal — GitHub CLI (if you use gh)
   cd "/path/to/websites/brockcraft.github.io"
   gh workflow run "Deploy to GitHub Pages" --ref main

③ Terminal — empty commit (no gh CLI)
   cd "/path/to/websites/brockcraft.github.io"
   git pull && git commit --allow-empty -m "chore: redeploy from Notion" && git push

Replace /path/to/websites/brockcraft.github.io with your local clone path.
```

*(Adjust the GitHub URL if your username or repo name differs.)*

---

## Optional: no manual step

This repo can run **scheduled** deploys (see `.github/workflows/deploy-pages.yml`). If enabled, Notion changes appear on the site within ~24 hours without you running anything. Turn the `schedule:` block off if you prefer only manual publishes.

---

## “A button in Notion”

Notion does not run git or call GitHub natively. To get close, you’d use a middleman (e.g. **Make** / **Zapier**: Notion updated → HTTP request to GitHub **`repository_dispatch`**) and a personal access token stored only in that automation—more setup than the options above.
