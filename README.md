# 🎹 Finders Keypress - Keyboard Signal Lab

A zero-build web app for testing **any keyboard**: every keypress and scroll, visualized with live charts. Dark by default, light on demand, and fully usable on a phone with an on-screen keyboard and scroll wheel.

> **One file to open. No install. Works offline.** Just open `index.html`.

[![CI](https://github.com/utveckla/finderskeypress/actions/workflows/ci.yml/badge.svg)](https://github.com/utveckla/finderskeypress/actions/workflows/ci.yml)
![no build](https://img.shields.io/badge/build-none-blue)
![offline](https://img.shields.io/badge/offline-ready-success)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

## Why it feels pro

Finders Keypress is designed to make you feel like an analyst at a bench, not someone poking a text box:

- **Live "Activity Signal" chart** - events/second on a rolling 30s scope line.
- **Key Frequency**, **Event Distribution**, **Inter-Key Latency**, and **Scroll Telemetry** charts (powered by a locally-bundled Chart.js - no CDN, no tracking).
- **Instrument aesthetic** - signal-green data accents on deep charcoal, with a one-tap light "clinical" theme that persists.
- **Latency analysis** - millisecond gaps between keystrokes, averaged and charted.

## Two modes

### 📊 Basic - quick readout

- Giant last-signal readout with key + code chips
- `events`, `keys/sec`, and `last event` mini-stats
- Live activity chart + the last 12 keycaps

### 🔬 Advanced - full diagnostics

- Stat strip: total events, unique keys, avg latency, session time
- Four analyst charts (frequency, distribution, latency, scroll)
- Full, filterable **event log** (type + text filters, latency, source, modifiers)
- **Export JSON** and **Export CSV**

## 📱 Mobile & touch

Phones rarely have a keyboard attached, so the app ships a **Touch Test Bench**:

- **On-screen virtual keyboard** - tap any key; it flows through the exact same capture pipeline as hardware (tagged `tap` vs `hw` in the log).
- **Virtual scroll wheel** - drag in a circle or scroll over it to emit detented up/down ticks, like a rotary encoder. Arrow keys rotate it too (accessible).
- Fully responsive layout, `touch-action` tuned to avoid scroll/zoom fighting, and a collapsible bench so it stays out of the way on desktop.
- If you **do** connect a Bluetooth/USB keyboard to your phone, real events are captured natively - the bench and hardware share one log.

## Quick start

```bash
# Simplest: just open it
start index.html            # Windows
open index.html             # macOS

# Or serve locally (recommended for a clean origin / localStorage)
python -m http.server 8000  # then visit http://localhost:8000
```

See **[docs/QUICKSTART.md](./docs/QUICKSTART.md)** for a guided first run and **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** to publish it free on GitHub Pages / Netlify / Vercel.

## Project layout

```
finderskeypress/
├── index.html              App markup (semantic, a11y roles)
├── css/
│   └── styles.css          Dual-theme design system (one variable block re-skins all)
├── js/
│   └── app.js              Capture pipeline, charts, virtual input (heavily commented)
├── vendor/
│   └── chart.umd.min.js    Chart.js 4.4.6, bundled locally for offline use
├── assets/                 Icons + social (OG) image
├── sw.js                   Service worker (offline / installable; root scope)
├── site.webmanifest        PWA manifest
├── robots.txt · sitemap.xml · llms.txt · CNAME   SEO / hosting (must stay at root)
├── tests/
│   └── smoke-test.js       Headless jsdom test (see docs/CONTRIBUTING.md)
├── docs/                   QUICKSTART · CONTRIBUTING · BRANDING · DEPLOYMENT · TODO
├── package.json            Scripts: `npm test`, `npm start`
├── LICENSE
└── README.md               You are here
```

> Deploy note: GitHub Pages serves from the repo root, so `index.html`, `sw.js`,
> and `robots.txt` / `sitemap.xml` / `llms.txt` / `CNAME` live at the top level by
> design. Everything else is organized into `css/`, `js/`, `assets/`, `tests/`, `docs/`.

## Architecture in 30 seconds

Every input path - real keyboard, real scroll wheel, virtual keyboard, virtual scroll wheel - funnels into **one** function, `recordEvent()`. It stores a normalized event, pulses the status LED, re-renders the active mode, and marks the charts dirty. A throttled loop repaints the charts about four times per second regardless of typing speed. See the header of [`js/app.js`](./js/app.js) for the section map.

## Privacy

100% client-side. No network calls (Chart.js is vendored). No cookies, no analytics, nothing leaves your browser. Events live in memory and clear on refresh - export first if you want to keep them.

## Browser support

Chrome/Edge 90+, Firefox 88+, Safari 14+. Pointer Events power the touch bench (supported everywhere modern). Respects `prefers-reduced-motion`.

## Contributing

Contributions are welcome. Start with [`AGENTS.md`](./AGENTS.md) for setup,
commands, and the project constraints, and [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md)
for the code map and common tasks. Run `npm test` before opening a pull request.
By participating you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md).

Release history is in [`CHANGELOG.md`](./CHANGELOG.md); security reports go
through [`SECURITY.md`](./SECURITY.md).

## Built with AI assistance

This project was developed with an AI coding assistant. To keep that workflow
reproducible, agent guidance lives in [`AGENTS.md`](./AGENTS.md) (and
[`.github/copilot-instructions.md`](./.github/copilot-instructions.md)), the
constraints are written down, and a CI smoke test guards every change.

## License

MIT - use it, fork it, ship it.

## Author

Henry Rune Tang Kai  
Email: [henry@henrys.se](mailto:henry@henrys.se)  
LinkedIn: [linkedin.com/in/henrytk](https://www.linkedin.com/in/henrytk)

---

_Built as a "Keyboard Signal Lab" - see [docs/BRANDING.md](./docs/BRANDING.md) for the design thinking._
