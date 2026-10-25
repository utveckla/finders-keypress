# AGENTS.md

Guidance for AI coding agents (and new human contributors) working in this
repository. This is the single source for how the project is built, run, and
maintained. If you change how the project works, update this file.

## What this project is

Finders Keypress is a static, client-side web app that tests keyboards: it
captures key and scroll events and shows key codes, modifiers, latency, rollover,
and a key heatmap with live charts. It ships as plain files with no build step.

- Live site: https://finderskeypress.com
- Stack: HTML, CSS, vanilla JavaScript (ES2020), Chart.js (vendored locally)
- No framework, no bundler, no transpiler, no runtime dependencies

## Setup and commands

```bash
npm install        # installs dev dependencies (jsdom, eslint, prettier)
npm test           # runs the headless smoke test -> "RESULT: 12 passed, 0 failed"
npm run lint       # ESLint over js/, sw.js, and tests/
npm run format     # Prettier formats all source (js, css, html, json, markdown, yaml)
npm run format:check   # verify formatting without writing (used in CI)
npm start          # serves the site at http://localhost:8777 (python http.server)
```

Prefer serving over HTTP rather than opening `file://`: the service worker and
`localStorage` (theme persistence) only work from an http(s) origin.

## Repository layout

```
index.html              App markup (entry point, must stay at repo root)
css/styles.css          Styles and the theme token blocks
js/app.js               All application logic
sw.js                   Service worker (must stay at root for '/' scope)
site.webmanifest        PWA manifest
vendor/chart.umd.min.js Chart.js, pinned and vendored for offline use
assets/                 Icons and the Open Graph image
tests/smoke-test.js     jsdom smoke test
docs/                   QUICKSTART, CONTRIBUTING, BRANDING, DEPLOYMENT, TODO
robots.txt sitemap.xml llms.txt CNAME   SEO / hosting (must stay at root)
```

## Hard constraints (do not break these)

1. No build step and no runtime dependencies. Do not add a bundler, a framework,
   or a CDN `<script>`/`<link>`. Third-party code is vendored into `vendor/`.
2. Offline must keep working. Every asset is same-origin and cached by `sw.js`.
   If you add a shell asset, add it to the `SHELL` list in `sw.js` and bump
   `CACHE_VERSION`.
3. These files must stay at the repo root because GitHub Pages serves from root
   and some of them only work there: `index.html`, `sw.js`, `robots.txt`,
   `sitemap.xml`, `llms.txt`, `CNAME`, `site.webmanifest`.
4. Accessibility: keep ARIA roles, visible focus, keyboard operability, and the
   `prefers-reduced-motion` handling intact.

## Architecture

Every input path (real keyboard, real scroll wheel, the on-screen virtual keyboard, the
virtual scroll wheel) is normalized and passed to one function, `recordEvent()`. It
stores the event in `state`, then refreshes the active mode and the charts. To
add a new input source, normalize it to the event shape and call
`recordEvent()`; nothing else needs to change. See `docs/CONTRIBUTING.md` for
the numbered file map and common tasks.

## Conventions

- Vanilla JS, `camelCase` for identifiers, `kebab-case` for CSS classes and IDs.
- Comments explain what the code does; keep them factual. Do not add
  self-referential or marketing commentary.
- Use plain hyphens in prose and comments, not em or en dashes.
- All colors are CSS variables in the token blocks at the top of
  `css/styles.css`; change the theme there, not inline.

## Before you open a pull request

- Run `npm run lint`, `npm run format:check`, and `npm test`; keep them green.
- Check the layout at 360px wide and confirm no console errors.
- Update the relevant file in `docs/` and this file if behavior or layout changed.

Git hooks (installed by `npm install` via Husky) enforce this automatically: a
pre-commit hook runs lint-staged (ESLint and Prettier on staged files) and a
pre-push hook runs the test suite.

## Deployment

GitHub Pages, deploy from the `main` branch root. The `CNAME` file points the
site at the custom domain. See `docs/DEPLOYMENT.md` for DNS and HTTPS steps.
