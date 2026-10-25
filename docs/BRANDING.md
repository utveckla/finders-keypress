# Branding & Design System - Finders Keypress

This document captures the brand so anyone (you, or a future collaborator - human or AI) can extend the product without diluting it. It is written from the perspective of the three "team" personas that shaped v2.

---

## Product positioning

**Finders Keypress - Keyboard Signal Lab.**

Not a "key tester." A _lab instrument_. The user is cast as an **analyst at a bench**: they generate signals (keys, scrolling) and read them on calibrated readouts and scopes. Everything - copy, color, motion - reinforces that feeling.

**One-line pitch:** _Instrument-grade keypress and scroll diagnostics that run in any browser, online or off._

---

## The personas

These are working personas used to make consistent decisions. When unsure, ask "what would each of them say?"

### 🎨 Mara Voss - Design Lead

_Owns the look: the instrument aesthetic._

- **Palette:** deep charcoal (`--bg #0b1020`) with a single confident data accent, **signal green** (`--accent #37f0b0`), plus **probe blue** and **amber** for secondary series. Light theme is "clinical" - paper white with a calmer green.
- **Principles:**
    - One accent does the heavy lifting; color = data, not decoration.
    - Monospace (`--font`) for anything that reads as a _measurement_ (keys, codes, stats, timestamps). UI sans for prose.
    - Subtle background grid + radial glow = "oscilloscope," never busy.
    - Motion is feedback, not flair: a key _flashes_, the LED _triggers_, charts ease - all ≤400ms, and all disabled under `prefers-reduced-motion`.
- **Guardrail:** if an element doesn't convey signal or state, it shouldn't glow.

### 🧭 Devin Oyelaran - UI/UX Lead

_Owns the flows, especially one-thumb mobile._

- **Principles:**
    - The most important number is the biggest. The last signal readout dominates Basic mode.
    - Everything reachable with a thumb; tap targets ≥ 40px; the virtual keyboard and scroll wheel are first-class, not an afterthought.
    - Progressive disclosure: Basic is calm; Advanced reveals the full bench. The Touch Test Bench collapses so desktop isn't cluttered.
    - No dead ends: empty states tell you exactly what to do ("Press a key or scroll to begin…").
    - Accessibility is a feature: ARIA tab roles, a keyboard-operable scroll wheel, visible focus, reduced-motion support.
- **Guardrail:** test every change at 360px wide before calling it done.

### ✍️ Priya Nair - Content Lead

_Owns the voice._

- **Voice:** precise, confident, a little lab-coat. Short. Technical but never cold.
- **Lexicon:** "signal," "capture," "telemetry," "readout," "bench," "latency." Avoid cutesy or hype words.
- **Microcopy rules:**
    - Labels are nouns or measurements: `keys / sec`, `avg latency`, `Scroll Telemetry`.
    - Sentence case for UI, UPPERCASE only for tiny instrument labels (`LAST SIGNAL`).
    - Buttons are verbs: `Export JSON`, `Clear`.
- **Guardrail:** if copy sounds like a marketing site, rewrite it like an instrument manual.

---

## Design tokens (source of truth)

All live at the top of `css/styles.css` under `:root` and the two `html[data-theme=…]` blocks. **Change the brand here and the whole app follows.**

| Token        | Dark           | Light       | Meaning                       |
| ------------ | -------------- | ----------- | ----------------------------- |
| `--accent`   | `#37f0b0`      | `#0ea574`   | Primary signal / data         |
| `--accent-2` | `#4da3ff`      | `#2b7fff`   | Secondary series (probe blue) |
| `--warn`     | `#ffb454`      | -           | Scroll / tertiary series      |
| `--bg`       | `#0b1020`      | `#eef2f8`   | Canvas                        |
| `--surface*` | charcoal steps | paper steps | Panels                        |
| `--font`     | monospace      | -           | Measurement type              |

Charts read these same variables at build time, so the light/dark toggle re-themes every graph automatically (`Charts.retheme()`).

---

## Logo / mark

The mark is a glowing signal dot over a faint waveform in a rounded tile - a point being measured. It's pure CSS (`.brand-mark`), so it scales and re-themes for free. Wordmark: **Finders Keypress** (sans), tagline **KEYBOARD SIGNAL LAB** (mono, letter-spaced).

---

## Do / Don't

**Do**

- Keep one accent per theme as the data color.
- Add new metrics as charts/readouts, labeled as measurements.
- Preserve the single-pipeline model (`recordEvent`) when adding inputs.

**Don't**

- Add a second bright hue "to liven it up."
- Introduce a build step or a CDN dependency (offline is a promise).
- Write playful copy that breaks the instrument illusion.

---

_When you extend Finders Keypress, you're calibrating an instrument - keep it precise._
