# Custom domain and redirects (www.brockcraft.com → GitHub Pages)

When you are ready to make **GitHub Pages** the canonical host for [https://www.brockcraft.com](https://www.brockcraft.com):

## 1. Enable GitHub Pages from Actions

In the repository **Settings → Pages → Build and deployment**:

- **Source:** GitHub Actions (not “Deploy from a branch”).

The workflow [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) publishes the `dist` output from Astro.

## 2. Add a `CNAME` file (optional automation)

You can add a file `public/CNAME` containing only:

```text
www.brockcraft.com
```

Astro copies `public/` into `dist/`, so GitHub Pages will serve the custom domain. Alternatively, set the custom domain in the Pages settings UI (GitHub may commit `CNAME` for you).

## 3. DNS at your registrar

- **www:** `CNAME` → `brockcraft.github.io` (see [GitHub Pages custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)).
- **apex (`@`):** use the **A** (and **AAAA** if listed) records GitHub documents for Pages, or an **ALIAS/ANAME** to `brockcraft.github.io` if your DNS provider supports it.

## 4. HTTPS

After DNS propagates, enable **“Enforce HTTPS”** in the Pages settings.

## 5. Redirect map from Squarespace

A starting list of old paths appears in [`migration/inventory.json`](inventory.json) under `redirect_map_suggested`. Before cutover:

1. Decide the **new URL** for each legacy path (e.g. `/teaching-publications` → `/teaching` or an external link).
2. Implement redirects:
   - **Preferred:** generate minimal HTML redirect stubs under `public/` for each old path (meta refresh + canonical link), **or**
   - Use **Cloudflare** / registrar redirect rules if you terminate DNS there.

3. Update internal links on the new site so they no longer point at Squarespace where you want self-hosted content.

## 6. Asset URLs

Migrated media lives under **`/legacy/*`** (see [`asset-url-map.json`](asset-url-map.json)). Long term, replace remaining `images.squarespace-cdn.com` links in content with `/legacy/...` paths using the map.
