# Quick Start

## Run it

**Option A - open directly**
Double-click `index.html`. Done.

**Option B - local server (recommended)**
A real origin gives you working `localStorage` (so your theme choice sticks):

```bash
python -m http.server 8000     # then open http://localhost:8000
# or
npx http-server
```

## First 60 seconds

1. You land in **Basic** mode, dark theme, status LED "Listening."
2. Press a few keys - watch the big **LAST SIGNAL** readout flash and the **Activity Signal** chart move.
3. Scroll (or turn a wheel) and it shows as a scroll event.
4. Hit the **🌙/☀️** button (top-right) to flip to the light "clinical" theme. It's remembered next visit.
5. Switch to **Advanced** to see the four analyst charts, latency, and the full event log.
6. Scroll down to the **Touch Test Bench** - tap the on-screen keys or drag the scroll wheel.

## On a phone

- No keyboard attached? Use the **Touch Test Bench**: tap keys, drag or scroll the wheel.
- Keyboard attached (Bluetooth/USB)? Just type - real events are captured natively and share the same log.
- Rotate to landscape for the widest virtual keyboard.

## Modes at a glance

|                          | Basic | Advanced |
| ------------------------ | ----- | -------- |
| Big last-key readout     | ✅    | -        |
| keys/sec + live chart    | ✅    | ✅       |
| Key frequency chart      | -     | ✅       |
| Event distribution       | -     | ✅       |
| Inter-key latency        | -     | ✅       |
| Scroll telemetry         | -     | ✅       |
| Full event log + filters | -     | ✅       |
| Export JSON / CSV        | -     | ✅       |

## Exporting

In **Advanced**, click **Export JSON** (full fidelity) or **Export CSV** (spreadsheet-friendly). Files download as `finderskeypress-<timestamp>.json/csv`.

CSV columns: `id, timestamp, type, source, key, code, keyCode, ctrl/shift/alt/meta, latency, direction, deltaY`.

## Troubleshooting

| Issue                      | Fix                                                                               |
| -------------------------- | --------------------------------------------------------------------------------- |
| Keys not registering       | Click the page once so it has focus.                                              |
| Theme doesn't persist      | Serve over `http://` (Option B) - file:// blocks `localStorage`.                  |
| Scrolling scrolls the page | Scroll **over the chart/readout area**; the log table scrolls normally by design. |
| Data gone after refresh    | Events are in-memory by design - export first.                                    |

## Keyboard shortcuts for the virtual scroll wheel

Focus the scroll wheel (Tab to it) and press **↑ / ↓** to emit up/down ticks - handy for accessibility and precise testing.
