# Deployment - GitHub Pages + custom apex domain

Finders Keypress is static (HTML/CSS/JS + vendored Chart.js), so it hosts on
**GitHub Pages** for free with HTTPS. This guide targets the apex domain
**finderskeypress.com**.

Two helper files are already in the repo:

- **`CNAME`** - contains `finderskeypress.com` (tells Pages your custom domain).
- **`.nojekyll`** - skips Jekyll processing (safe for a plain static site).

---

## 1. Create the repo & push

Requirements: the repo must be **public** for free Pages.

```bash
# from inside the finderskeypress folder (git is already initialised + committed)
gh repo create finderskeypress --public --source=. --remote=origin --push
```

Or manually:

```bash
git remote add origin https://github.com/<username>/finderskeypress.git
git push -u origin main
```

## 2. Turn on Pages

GitHub → your repo → **Settings → Pages**:

- **Source:** Deploy from a branch
- **Branch:** `main` · **Folder:** `/ (root)` → **Save**

Because the repo contains a `CNAME` file, the **Custom domain** field will
auto-fill with `finderskeypress.com`. (If prompted, leave it as is.)

## 3. Point DNS at GitHub (at your registrar)

For an **apex** domain you need four `A` records (and ideally the matching
IPv6 `AAAA` records):

| Type | Host/Name | Value               |
| ---- | --------- | ------------------- |
| A    | @         | 185.199.108.153     |
| A    | @         | 185.199.109.153     |
| A    | @         | 185.199.110.153     |
| A    | @         | 185.199.111.153     |
| AAAA | @         | 2606:50c0:8000::153 |
| AAAA | @         | 2606:50c0:8001::153 |
| AAAA | @         | 2606:50c0:8002::153 |
| AAAA | @         | 2606:50c0:8003::153 |

**Recommended bonus:** also add a `www` → `<username>.github.io` **CNAME** so
`www.finderskeypress.com` redirects to the apex.

> Tip: if your registrar supports **ALIAS/ANAME** records at the apex, you may
> instead point `@` to `<username>.github.io`. Otherwise use the A records above.

## 4. HTTPS

Back in **Settings → Pages**, once DNS resolves (minutes-hours), GitHub
auto-issues a free Let's Encrypt certificate. Then tick **Enforce HTTPS**.

## 5. Verify

```bash
# DNS points at GitHub's IPs?
nslookup finderskeypress.com

# Site responds?
curl -I https://finderskeypress.com
```

---

## Updating the site later

```bash
git add .
git commit -m "Update: <what changed>"
git push
```

Pages redeploys automatically within a minute or two.

## Troubleshooting

| Symptom                                     | Fix                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| "Domain's DNS record could not be verified" | DNS not propagated yet - wait, then click **Check again**.                    |
| Site loads but no HTTPS option              | Wait for the cert; the box enables after DNS verifies.                        |
| 404 after enabling Pages                    | Confirm branch = `main`, folder = root, and `index.html` is at the repo root. |
| Charts missing / blank                      | Ensure `vendor/chart.umd.min.js` was pushed (it's committed).                 |
| Theme doesn't persist locally               | Serve over http, not `file://` (Pages is https, so it's fine live).           |

## Why not a build step?

Finders Keypress deliberately ships no bundler and no CDN dependency - one of
its promises is "open the file, works offline." GitHub Pages serves the files
verbatim, so what you test locally is exactly what ships.
