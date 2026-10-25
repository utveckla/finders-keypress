# Contributing to Finders Keypress

A guide to the architecture and how to extend it. The code is deliberately plain, commented vanilla JS/CSS - no framework, no build step.

## Mental model: one pipeline

The single most important idea:

```
real keydown ─┐
real keyup   ─┤
real wheel   ─┼──▶ recordEvent(payload) ──▶ state.add() ──▶ refresh() + Charts.onEvent()
virtual key  ─┤
virtual wheel ─┘
```

**Every** input - hardware or touch - builds a _normalized payload_ and calls `recordEvent()`. There is exactly one place events enter the system. If you add a new input source, normalize it to the same shape and call `recordEvent()`. Don't render from the raw DOM event.

### Normalized event shape

```js
{
  type: 'keydown' | 'keyup' | 'wheel',
  source: 'hardware' | 'touch',
  key, code, keyCode,                 // keys
  ctrlKey, shiftKey, altKey, metaKey, // modifiers
  location,                           // keys
  deltaY, direction, deltaMode,       // wheel / scroll
  timestamp, latency, id              // added by state.add()
}
```

## File map of `js/app.js` (numbered sections)

0. **CANONICAL DOMAIN GUARD** - redirect `*.github.io` to the custom domain (dev hosts untouched).
1. **STATE** - the `state` object: events array + derived getters (`uniqueKeys`, `avgLatency`, `duration`).
2. **HELPERS** - `$`, `cssVar`, `clockTime`, `keyLabel`.
3. **CAPTURE PIPELINE** - `recordEvent`, `fromKeyboard`, and the three real listeners.
4. **STATUS LED** - trigger pulse.
5. **RENDER - BASIC** - readout, keys/sec, key stream.
6. **RENDER - ADVANCED** - stat strip + event log.
7. **MASTER REFRESH** - `refresh()` dispatches to the active mode.
8. **CHARTS** - the `Charts` object wrapping Chart.js (build / update / retheme), throttled.
9. **MODE SWITCHING**.
10. **THEME TOGGLE** - persisted to `localStorage`, re-themes charts.
11. **ACTIONS** - clear, export JSON/CSV.
12. **LOG FILTERS**.
13. **TOUCH BENCH - virtual keyboard** (`VKEYS` layout + delegated handler).
    13b. **KEY HEATMAP** - reuses `VKEYS` as a read-only board tinted by press frequency.
14. **TOUCH BENCH - virtual scroll wheel** (pointer-angle → detented ticks).
15. **PERIODIC TICKS** - keep gauges/timer live when idle.
16. **INIT** - builds everything and registers the service worker (`sw.js`).

## Common tasks

### Add a new chart

1. Add a `<canvas id="myChart">` inside a `.panel` in `index.html`.
2. In `Charts.build()`, construct it with `this.baseOptions()` (so it inherits theme colors).
3. In `Charts.update()`, compute its dataset from `state.events` and call `.update('none')`.
4. Add it to the `retheme()` destroy list.

### Add a new input source (e.g. gamepad)

Normalize to the event shape above and call `recordEvent({...})`. Tag `source` so the log can show its origin. Nothing else needs changing - charts and views update for free.

### Add a stat

1. Add a getter to `state` (e.g. `peakRate()`).
2. Add a DOM slot in `index.html`.
3. Populate it in `renderBasic()` or `renderAdvanced()`.

### Re-skin the brand

Edit the `:root` / `html[data-theme=…]` variable blocks in `css/styles.css`. Charts read these variables, so they follow automatically. See **BRANDING.md**.

## Conventions

- `camelCase` JS, `kebab-case` CSS classes and IDs.
- JSDoc on non-obvious functions; comment _why_, not _what_.
- Keep functions single-purpose and short.
- No new runtime dependencies and no build step - these are product promises (offline, one-file-open).

## Quality checks

Three commands guard every change, and all three run in CI:

```bash
npm run lint         # ESLint over js/, sw.js, tests/
npm run format:check # Prettier (all source files: js, css, html, json, markdown, yaml)
npm test             # headless jsdom smoke test -> 12 passed, 0 failed
```

Use `npm run lint:fix` and `npm run format` to apply fixes automatically.

The smoke test (`tests/smoke-test.js`) loads the real `index.html` + `js/app.js`
in **jsdom**, stubs the canvas, simulates input, and asserts behavior (readout,
counts, mode switch, heatmap, virtual tap, theme persistence, clear).

> Note: Chart.js draws to a stubbed 2D context in the test, so you'll see harmless
> `resetTransform is not a function` lines from Chart.js' renderer. The assertions
> (the `ok -` / `FAIL-` lines and the final RESULT) are what matter.

Manual checklist before shipping a change:

- [ ] Hardware keydown/keyup/scroll captured in both modes
- [ ] Virtual keyboard + scroll wheel add events (log shows `tap`)
- [ ] All five charts update and re-theme on toggle
- [ ] Filters work; JSON + CSV export open correctly
- [ ] Layout clean at 360px wide (DevTools device mode)
- [ ] No console errors; `prefers-reduced-motion` calms animation

## Pull request format

```
feat: short imperative summary

- what changed
- why
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`.

---

Thanks for keeping the instrument precise. See **BRANDING.md** for the design voice.
