# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `AGENTS.md` and `.github/copilot-instructions.md` for AI-assisted development.
- ESLint and Prettier with scripts, config, and CI enforcement.
- Git hooks via Husky and lint-staged: lint and format staged files on commit,
  run the test suite on push.
- Continuous integration (GitHub Actions) running lint, format check, and the
  test suite on every push and pull request.
- Issue and pull request templates, Dependabot, `SECURITY.md`,
  `CODE_OF_CONDUCT.md`, `.editorconfig`, `.gitattributes`, and this changelog.

### Changed

- Generalized the "knob" terminology to "scroll" / "scroll wheel" throughout the
  UI, docs, and code identifiers.

## [2.1.0]

### Added

- Key heatmap showing press frequency across the board.
- Progressive Web App support: web manifest and service worker (installable,
  fully offline).
- SEO metadata, Open Graph and Twitter cards, and a generated social image.
- Structured data (WebApplication and FAQPage), `llms.txt`, and an
  AI-friendly `robots.txt` and `sitemap.xml`.
- Crawlable About and FAQ content; canonical-domain guard.

### Changed

- Reorganized the project into `css/`, `js/`, `assets/`, `tests/`, and `docs/`.

## [2.0.0]

### Added

- Dark and light themes with a persisted toggle.
- Live charts via a locally vendored Chart.js: activity, key frequency, event
  distribution, inter-key latency, and scroll telemetry.
- Average inter-key latency metric.
- Touch test bench: on-screen virtual keyboard and virtual scroll wheel.
- JSON and CSV export.
- Headless jsdom smoke test.

### Changed

- Rebuilt the interface and consolidated all input into a single capture
  pipeline (`recordEvent`).
