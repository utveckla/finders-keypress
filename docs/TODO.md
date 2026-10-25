# Roadmap - Finders Keypress

## ✅ Shipped

### v2.0 - Keyboard Signal Lab

- [x] Dual theme (dark "lab instrument" + light "clinical") with persisted toggle
- [x] Instrument-grade redesign (signal-green accents, scope grid, status LED)
- [x] Chart.js **bundled locally** (offline) - 5 charts total:
    - [x] Live activity signal (events/sec)
    - [x] Key frequency (top 10)
    - [x] Event-type distribution (doughnut)
    - [x] Inter-key latency line
    - [x] Cumulative scroll telemetry
- [x] Avg inter-key latency metric
- [x] Touch Test Bench: on-screen **virtual keyboard** (same pipeline as hardware)
- [x] **Virtual scroll wheel** - drag/scroll/arrow-key detented rotation
- [x] Single unified capture pipeline (`recordEvent`) with hardware/tap source tagging
- [x] Export **JSON + CSV**
- [x] Mobile-responsive down to 360px; `touch-action` tuned; reduced-motion support
- [x] Headless jsdom smoke test
- [x] Docs: README, QUICKSTART, CONTRIBUTING, BRANDING, DEPLOYMENT

### v2.1 - discovery & depth

- [x] **Keyboard heatmap** - board layout tinted by press frequency
- [x] **PWA** - web manifest + service worker (installable, fully offline)
- [x] **SEO**: metadata, Open Graph / Twitter cards, generated social image
- [x] **Structured data**: WebApplication + FAQPage JSON-LD
- [x] **AI discoverability**: `llms.txt` + AI-friendly `robots.txt`, `sitemap.xml`
- [x] Crawlable About + FAQ content; canonical-domain guard

### v2.2 - tooling, quality & brand

- [x] Restructured into `css/`, `js/`, `assets/`, `tests/`, `docs/`
- [x] ESLint + Prettier with npm scripts, enforced in CI
- [x] Git hooks via Husky + lint-staged (pre-commit lint/format, pre-push test)
- [x] GitHub Actions CI (lint, format check, test)
- [x] Governance: Dependabot, issue/PR templates, `SECURITY.md`,
      `CODE_OF_CONDUCT.md`, `CHANGELOG.md`
- [x] `AGENTS.md` + `.github/copilot-instructions.md` for AI-assisted development
- [x] `.editorconfig`, `.gitattributes` (LF), `.nvmrc`, `LICENSE`, `package.json`
- [x] Designer pass on layout; movement-free readout cue
- [x] Generalized terminology to "scroll" / "scroll wheel"
- [x] Two-word display brand "Finders Keypress" (lowercase slug kept for technical use)

## 🎯 Next

- [ ] **Per-key latency breakdown** - slowest-keys table
- [ ] **Session persistence** - optional `localStorage` autosave + restore
- [ ] **Keyboard shortcuts** - `1`/`2` switch modes, `Ctrl+Shift+E` export
- [ ] **Respect `prefers-color-scheme`** on first visit, before any saved choice

## Features (backlog)

- [ ] Compare two sessions side by side (import a previously exported JSON)
- [ ] WPM / typing-rhythm estimate
- [ ] Shareable PNG snapshot of the charts
- [ ] Ghosting / N-key rollover tester (hold many keys, confirm all register)

## Switch-level

- [ ] **Actuation pressure** readout if/when the web platform exposes analog key
      depth for pressure-sensitive switches (monitor spec progress)
- [ ] **Rapid-trigger timing** visualization (press -> release -> re-press cycles)

## Tooling & quality

- [ ] Stylelint for CSS (parity with ESLint for JS)
- [ ] HTML validation in CI (for example `html-validate`)
- [ ] Lighthouse / accessibility audit step in CI
- [ ] Virtualized log rows for 100k+ events (currently capped at 300 DOM rows)
- [ ] Extract chart configs into a small data-driven registry
- [ ] More smoke-test assertions (CSV contents, log filters)
- [ ] Optional GitHub Actions Pages deploy (alternative to branch deploy)
- [ ] Add manifest `screenshots` for a richer PWA install prompt

## Ideas / maybe

- [ ] Sound feedback (optional mechanical click)
- [ ] Custom accent picker (brand-your-own)
- [ ] Multi-language key labels by detected layout

---

_Move items to Shipped as they land. Keep the offline and no-build promises intact (see CONTRIBUTING.md)._
