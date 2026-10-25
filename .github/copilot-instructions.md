# GitHub Copilot instructions

This repository uses a single source of agent guidance. Please read
[`/AGENTS.md`](../AGENTS.md) before making changes.

Quick reference:

- Static site, no build step, no runtime dependencies. Third-party code is
  vendored in `vendor/`. Do not add a bundler, framework, or CDN link.
- Install and test with `npm install` then `npm test` (headless jsdom suite).
- Serve locally with `npm start` (http, not `file://`).
- Keep `index.html`, `sw.js`, `robots.txt`, `sitemap.xml`, `llms.txt`, `CNAME`,
  and `site.webmanifest` at the repo root.
- All input funnels through `recordEvent()` in `js/app.js`.
- Comments stay factual; use plain hyphens, not em dashes.
