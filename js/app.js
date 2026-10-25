/* =======================================================================
   Finders Keypress - app.js
   Capture and analysis of keyboard and wheel input.

   Data flow:
     1. A real key / wheel event OR a virtual (touch) control fires.
     2. Everything funnels into recordEvent(), the one capture path.
     3. recordEvent() stores the event, then calls refresh() + the charts.
     4. The active mode (basic/advanced) re-renders from state.

   Dependencies: Chart.js (vendored locally at vendor/chart.umd.min.js).
   ======================================================================= */

'use strict';

/* =======================================================================
   0. CANONICAL DOMAIN GUARD
   -----------------------------------------------------------------------
   GitHub Pages already 301-redirects the *.github.io address to the custom
   domain. As a fallback, if the app is ever served from a github.io host
   (or a fork re-hosts it), bounce to the canonical domain.
   Localhost / 127.0.0.1 / file:// are left alone so local dev still works.
   ======================================================================= */

(function enforceCanonicalHost() {
    const CANONICAL = 'finderskeypress.com';
    const host = location.hostname;
    if (host.endsWith('github.io')) {
        // Drop the leading "/<repo>" path segment that project pages add.
        const path = location.pathname.replace(/^\/[^/]+/, '');
        location.replace('https://' + CANONICAL + path + location.search + location.hash);
    }
})();

/* =======================================================================
   1. STATE
   ======================================================================= */

const state = {
    events: [], // every captured event, in order
    startTime: Date.now(), // session start, for duration
    mode: 'basic', // 'basic' | 'advanced'
    lastKeydownAt: null, // used to compute inter-key latency

    /**
     * Append an event and tag it with timing + an id.
     * @param {Object} e - the raw event payload
     */
    add(e) {
        const now = Date.now();
        // Inter-key latency: time since the previous keydown (ms).
        let latency = null;
        if (e.type === 'keydown') {
            if (this.lastKeydownAt !== null) latency = now - this.lastKeydownAt;
            this.lastKeydownAt = now;
        }
        this.events.push({ ...e, timestamp: now, latency, id: this.events.length });
    },

    /** @returns {number} count of distinct physical keys seen */
    uniqueKeys() {
        const s = new Set();
        this.events.forEach((ev) => {
            if (ev.key) s.add(ev.key);
        });
        return s.size;
    },

    /** @returns {number|null} average inter-key latency in ms */
    avgLatency() {
        const vals = this.events.map((e) => e.latency).filter((v) => v !== null);
        if (!vals.length) return null;
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    },

    /** @returns {string} human-friendly session duration */
    duration() {
        const s = Math.floor((Date.now() - this.startTime) / 1000);
        if (s < 60) return `${s}s`;
        return `${Math.floor(s / 60)}m ${s % 60}s`;
    },

    reset() {
        this.events = [];
        this.startTime = Date.now();
        this.lastKeydownAt = null;
    }
};

/* =======================================================================
   2. SMALL HELPERS
   ======================================================================= */

/** Shorthand for document.getElementById. */
const $ = (id) => document.getElementById(id);

/** Read a CSS custom property from :root (so charts match the theme). */
function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Format a timestamp as HH:MM:SS.mmm. */
function clockTime(ts) {
    return new Date(ts).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
    });
}

/** Friendly label for a key (spaces/arrows get symbols). */
function keyLabel(ev) {
    if (ev.type === 'wheel') return ev.direction === 'up' ? '⟲ ▲' : '⟳ ▼';
    const map = { ' ': 'Space', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
    return map[ev.key] || ev.key || '∅';
}

/* =======================================================================
   3. CAPTURE PIPELINE
   ======================================================================= */

/**
 * The ONE function every input path calls. Real keyboard, real wheel,
 * virtual keyboard, and virtual wheel all end up here.
 * @param {Object} payload - normalized event data
 */
function recordEvent(payload) {
    state.add(payload);
    pulseStatusLed();
    refresh();
    Charts.onEvent();
}

/**
 * Build a normalized payload from a real KeyboardEvent.
 * @param {KeyboardEvent} e
 * @param {string} type - 'keydown' | 'keyup'
 */
function fromKeyboard(e, type) {
    return {
        type,
        source: 'hardware',
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
        location: e.location
    };
}

function isControlLikeKey(e) {
    const source = e.code || e.key || '';
    if (!source) return false;
    if (e.key && e.key.length === 1) return false;
    return /^(Audio|Media|Browser|Launch|Power|Sleep|WakeUp|Brightness|Eject)/.test(source);
}

/* ---- Real hardware listeners ---- */
document.addEventListener('keydown', (e) => {
    if (e.repeat && !isControlLikeKey(e)) return; // keep normal key-hold spam out, allow control/media repeats
    recordEvent(fromKeyboard(e, 'keydown'));
});

document.addEventListener('keyup', (e) => {
    recordEvent(fromKeyboard(e, 'keyup'));
});

document.addEventListener(
    'wheel',
    (e) => {
        // Only treat it as wheel telemetry when over the capture area, and
        // avoid hijacking scroll inside scrollable regions.
        if (e.target && typeof e.target.closest === 'function' && e.target.closest('.table-scroll'))
            return;
        e.preventDefault();
        recordEvent({
            type: 'wheel',
            source: 'hardware',
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            deltaZ: e.deltaZ,
            deltaMode: e.deltaMode,
            direction: e.deltaY > 0 ? 'down' : 'up',
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
            metaKey: e.metaKey
        });
    },
    { passive: false }
);

/* =======================================================================
   4. STATUS LED
   ======================================================================= */

let ledTimer = null;
/** Briefly hold the LED solid on each capture. */
function pulseStatusLed() {
    const led = $('statusLed');
    if (!led) return;
    led.classList.add('hit');
    clearTimeout(ledTimer);
    ledTimer = setTimeout(() => led.classList.remove('hit'), 120);
}

/* =======================================================================
   5. RENDER - BASIC MODE
   ======================================================================= */

function renderBasic() {
    const last = state.events[state.events.length - 1];
    const keyEl = $('basicKey');

    if (last) {
        keyEl.textContent = keyLabel(last);
        keyEl.classList.remove('flash');
        void keyEl.offsetWidth; // restart the flash animation
        keyEl.classList.add('flash');
        $('basicType').textContent = last.type === 'wheel' ? 'scroll' : last.type;
        $('basicCode').textContent =
            'code ' + (last.code || last.keyCode || (last.type === 'wheel' ? 'scroll' : '-'));
        $('basicTime').textContent = clockTime(last.timestamp).slice(0, 8);
    }

    $('basicCount').textContent = state.events.length;
    $('basicRate').textContent = eventsPerSecond().toFixed(1);

    renderKeyStream();
}

/** Events in the last 1000ms - a live "keys per second" gauge. */
function eventsPerSecond() {
    const cutoff = Date.now() - 1000;
    return state.events.filter((e) => e.timestamp >= cutoff).length;
}

/** Last 12 events as keycaps, newest first. */
function renderKeyStream() {
    const box = $('basicEvents');
    const recent = state.events.slice(-12).reverse();
    if (!recent.length) {
        box.innerHTML = '<p class="empty-note">Press a key or scroll to begin…</p>';
        return;
    }
    box.innerHTML = recent
        .map((ev) => {
            const wheel = ev.type === 'wheel' ? ' is-wheel' : '';
            const sub = ev.type === 'wheel' ? 'scroll' : ev.type.replace('key', '');
            return `<div class="key-cap${wheel}">${keyLabel(ev)}<small>${sub}</small></div>`;
        })
        .join('');
}

/* =======================================================================
   6. RENDER - ADVANCED MODE
   ======================================================================= */

function renderAdvanced() {
    $('advCount').textContent = state.events.length;
    $('advUnique').textContent = state.uniqueKeys();
    const lat = state.avgLatency();
    $('advLatency').textContent = lat === null ? '-' : lat + 'ms';
    $('advDuration').textContent = state.duration();
    renderLog();
}

/** Render the filtered event log table. */
function renderLog() {
    const body = $('logBody');
    const q = $('filterInput').value.toLowerCase();
    const typeF = $('typeFilter').value;

    const rows = state.events.filter((ev) => {
        const okType = !typeF || ev.type === typeF;
        const okText =
            !q ||
            (ev.key && ev.key.toLowerCase().includes(q)) ||
            (ev.code && ev.code.toLowerCase().includes(q));
        return okType && okText;
    });

    if (!rows.length) {
        body.innerHTML = '<tr class="empty-row"><td colspan="12">No matching events.</td></tr>';
        return;
    }

    // Render newest-first, cap at 300 DOM rows for performance.
    body.innerHTML = rows
        .slice(-300)
        .reverse()
        .map((ev) => {
            const wheel = ev.type === 'wheel';
            const code = wheel
                ? ev.deltaMode === 0
                    ? 'px'
                    : ev.deltaMode === 1
                      ? 'line'
                      : 'page'
                : ev.code || ev.keyCode || '-';
            const detail = wheel ? `Δy ${ev.deltaY}` : `loc ${ev.location}`;
            const mod = (on) =>
                on ? '<span class="mod-on">●</span>' : '<span class="mod-off">·</span>';
            const src = `<span class="src-tag ${ev.source === 'touch' ? 'touch' : ''}">${ev.source === 'touch' ? 'tap' : 'hw'}</span>`;
            return `<tr class="${wheel ? 'is-wheel' : ''}">
            <td>${ev.id + 1}</td>
            <td>${clockTime(ev.timestamp)}</td>
            <td>${wheel ? 'scroll' : ev.type}</td>
            <td><strong>${keyLabel(ev)}</strong></td>
            <td>${code}</td>
            <td>${src}</td>
            <td>${mod(ev.ctrlKey)}</td>
            <td>${mod(ev.shiftKey)}</td>
            <td>${mod(ev.altKey)}</td>
            <td>${mod(ev.metaKey)}</td>
            <td>${ev.latency === null || ev.latency === undefined ? '-' : ev.latency + 'ms'}</td>
            <td>${detail}</td>
        </tr>`;
        })
        .join('');
}

/* =======================================================================
   7. MASTER REFRESH
   ======================================================================= */

/** Re-render whichever mode is visible. Called after every event. */
function refresh() {
    if (state.mode === 'basic') renderBasic();
    else renderAdvanced();
    updateHeatmap();
}

/* =======================================================================
   8. CHARTS  (Chart.js wrapper)
   ======================================================================= */

const Charts = {
    activity: null,
    freq: null,
    type: null,
    latency: null,
    wheel: null,
    built: false,
    _dirty: false,

    /** Shared styling so every chart matches the active theme. */
    baseOptions() {
        const grid = cssVar('--border');
        const tick = cssVar('--text-dim');
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 250 },
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { color: grid },
                    ticks: { color: tick, maxRotation: 0, autoSkip: true }
                },
                y: { grid: { color: grid }, ticks: { color: tick }, beginAtZero: true }
            }
        };
    },

    /** Build all charts once, lazily (first time advanced/basic needs them). */
    build() {
        if (this.built || typeof Chart === 'undefined') return;
        const accent = cssVar('--accent');
        const accent2 = cssVar('--accent-2');
        const warn = cssVar('--warn') || '#ffb454';

        // Basic: live activity line
        this.activity = new Chart($('activityChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        data: [],
                        borderColor: accent,
                        backgroundColor: accent + '22',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 0,
                        borderWidth: 2
                    }
                ]
            },
            options: this.baseOptions()
        });

        // Advanced: key frequency bar
        this.freq = new Chart($('freqChart'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{ data: [], backgroundColor: accent, borderRadius: 6 }]
            },
            options: this.baseOptions()
        });

        // Advanced: event type doughnut
        const doughnutOpts = this.baseOptions();
        doughnutOpts.scales = {};
        doughnutOpts.plugins.legend = {
            display: true,
            position: 'bottom',
            labels: { color: cssVar('--text-dim') }
        };
        this.type = new Chart($('typeChart'), {
            type: 'doughnut',
            data: {
                labels: ['Keydown', 'Keyup', 'Scroll'],
                datasets: [
                    { data: [0, 0, 0], backgroundColor: [accent, accent2, warn], borderWidth: 0 }
                ]
            },
            options: doughnutOpts
        });

        // Advanced: inter-key latency line
        this.latency = new Chart($('latencyChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        data: [],
                        borderColor: accent2,
                        backgroundColor: accent2 + '22',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 0,
                        borderWidth: 2
                    }
                ]
            },
            options: this.baseOptions()
        });

        // Advanced: cumulative wheel telemetry
        this.wheel = new Chart($('wheelChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        data: [],
                        borderColor: warn,
                        backgroundColor: warn + '22',
                        fill: true,
                        tension: 0.2,
                        pointRadius: 0,
                        borderWidth: 2,
                        stepped: false
                    }
                ]
            },
            options: this.baseOptions()
        });

        this.built = true;
        this.update();
    },

    /** Mark charts dirty; a throttled loop repaints them. */
    onEvent() {
        this._dirty = true;
    },

    /** Recompute datasets from state and push to Chart.js. */
    update() {
        if (!this.built) return;

        // --- Activity: events per second over the last 30 buckets ---
        const buckets = 30;
        const now = Date.now();
        const perSec = new Array(buckets).fill(0);
        state.events.forEach((ev) => {
            const ago = Math.floor((now - ev.timestamp) / 1000);
            if (ago >= 0 && ago < buckets) perSec[buckets - 1 - ago]++;
        });
        this.activity.data.labels = perSec.map((_, i) => `-${buckets - i}s`);
        this.activity.data.datasets[0].data = perSec;
        this.activity.update('none');

        // --- Frequency: top 10 keys (keydown only) ---
        const counts = {};
        state.events.forEach((ev) => {
            if (ev.type === 'keydown' && ev.key) {
                const k = keyLabel(ev);
                counts[k] = (counts[k] || 0) + 1;
            }
        });
        const top = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        this.freq.data.labels = top.map((t) => t[0]);
        this.freq.data.datasets[0].data = top.map((t) => t[1]);
        this.freq.update('none');

        // --- Type distribution ---
        let down = 0,
            up = 0,
            wheel = 0;
        state.events.forEach((ev) => {
            if (ev.type === 'keydown') down++;
            else if (ev.type === 'keyup') up++;
            else if (ev.type === 'wheel') wheel++;
        });
        this.type.data.datasets[0].data = [down, up, wheel];
        this.type.update('none');

        // --- Latency: last 40 inter-key gaps ---
        const lats = state.events
            .filter((e) => e.latency !== null && e.latency !== undefined)
            .slice(-40);
        this.latency.data.labels = lats.map((_, i) => i + 1);
        this.latency.data.datasets[0].data = lats.map((e) => e.latency);
        this.latency.update('none');

        // --- Wheel: cumulative rotation (up = +1, down = -1) ---
        let acc = 0;
        const series = [];
        state.events.forEach((ev) => {
            if (ev.type === 'wheel') {
                acc += ev.direction === 'up' ? 1 : -1;
                series.push(acc);
            }
        });
        this.wheel.data.labels = series.map((_, i) => i + 1);
        this.wheel.data.datasets[0].data = series;
        this.wheel.update('none');

        this._dirty = false;
    },

    /** Rebuild color palette after a theme switch. */
    retheme() {
        if (!this.built) return;
        [this.activity, this.freq, this.type, this.latency, this.wheel].forEach((c) => c.destroy());
        this.built = false;
        this.build();
    }
};

// Throttled repaint loop - charts update at most ~4x/sec regardless of typing speed.
setInterval(() => {
    if (Charts._dirty) Charts.update();
}, 250);

/* =======================================================================
   9. MODE SWITCHING
   ======================================================================= */

function switchMode(mode) {
    state.mode = mode;
    $('basicModeBtn').classList.toggle('active', mode === 'basic');
    $('advancedModeBtn').classList.toggle('active', mode === 'advanced');
    $('basicModeBtn').setAttribute('aria-selected', mode === 'basic');
    $('advancedModeBtn').setAttribute('aria-selected', mode === 'advanced');
    $('basicMode').classList.toggle('active', mode === 'basic');
    $('advancedMode').classList.toggle('active', mode === 'advanced');
    document.querySelector('.mode-switch').dataset.active = mode;
    refresh();
    Charts.update();
}

$('basicModeBtn').addEventListener('click', () => switchMode('basic'));
$('advancedModeBtn').addEventListener('click', () => switchMode('advanced'));

/* =======================================================================
   10. THEME TOGGLE (persisted)
   ======================================================================= */

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
        localStorage.setItem('fk-theme', theme);
    } catch (_) {}
    // Chart colors are theme-derived, so rebuild them.
    Charts.retheme();
}

$('themeToggle').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
});

// Restore saved theme on load (default dark).
(function restoreTheme() {
    let saved = 'dark';
    try {
        saved = localStorage.getItem('fk-theme') || 'dark';
    } catch (_) {}
    document.documentElement.setAttribute('data-theme', saved);
})();

/* =======================================================================
   11. ACTIONS - clear / export
   ======================================================================= */

$('clearBtn').addEventListener('click', () => {
    if (!state.events.length || confirm('Clear all captured events?')) {
        state.reset();
        refresh();
        Charts.update();
    }
});

/** Trigger a file download from a Blob. */
function download(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

$('exportJsonBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state.events, null, 2)], { type: 'application/json' });
    download(`finderskeypress-${Date.now()}.json`, blob);
});

$('exportCsvBtn').addEventListener('click', () => {
    const cols = [
        'id',
        'timestamp',
        'type',
        'source',
        'key',
        'code',
        'keyCode',
        'ctrlKey',
        'shiftKey',
        'altKey',
        'metaKey',
        'latency',
        'direction',
        'deltaY'
    ];
    const header = cols.join(',');
    const lines = state.events.map((ev) =>
        cols
            .map((c) => {
                const v = ev[c];
                if (v === undefined || v === null) return '';
                return typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
            })
            .join(',')
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    download(`finderskeypress-${Date.now()}.csv`, blob);
});

/* =======================================================================
   12. LOG FILTERS
   ======================================================================= */

$('filterInput').addEventListener('input', () => {
    if (state.mode === 'advanced') renderLog();
});
$('typeFilter').addEventListener('change', () => {
    if (state.mode === 'advanced') renderLog();
});

/* =======================================================================
   13. TOUCH TEST BENCH - virtual keyboard
   ======================================================================= */

// Layout rows. Each entry: [displayLabel, key, code] (+ optional class).
const VKEYS = [
    [
        ['Esc', 'Escape', 'Escape'],
        ['1', '1', 'Digit1'],
        ['2', '2', 'Digit2'],
        ['3', '3', 'Digit3'],
        ['4', '4', 'Digit4'],
        ['5', '5', 'Digit5'],
        ['6', '6', 'Digit6'],
        ['7', '7', 'Digit7'],
        ['8', '8', 'Digit8'],
        ['9', '9', 'Digit9'],
        ['0', '0', 'Digit0'],
        ['⌫', 'Backspace', 'Backspace', 'wide']
    ],
    [
        ['Q', 'q', 'KeyQ'],
        ['W', 'w', 'KeyW'],
        ['E', 'e', 'KeyE'],
        ['R', 'r', 'KeyR'],
        ['T', 't', 'KeyT'],
        ['Y', 'y', 'KeyY'],
        ['U', 'u', 'KeyU'],
        ['I', 'i', 'KeyI'],
        ['O', 'o', 'KeyO'],
        ['P', 'p', 'KeyP']
    ],
    [
        ['A', 'a', 'KeyA'],
        ['S', 's', 'KeyS'],
        ['D', 'd', 'KeyD'],
        ['F', 'f', 'KeyF'],
        ['G', 'g', 'KeyG'],
        ['H', 'h', 'KeyH'],
        ['J', 'j', 'KeyJ'],
        ['K', 'k', 'KeyK'],
        ['L', 'l', 'KeyL'],
        ['↵', 'Enter', 'Enter', 'wide']
    ],
    [
        ['⇧', 'Shift', 'ShiftLeft', 'wide'],
        ['Z', 'z', 'KeyZ'],
        ['X', 'x', 'KeyX'],
        ['C', 'c', 'KeyC'],
        ['V', 'v', 'KeyV'],
        ['B', 'b', 'KeyB'],
        ['N', 'n', 'KeyN'],
        ['M', 'm', 'KeyM'],
        ['⌃', 'Control', 'ControlLeft', 'wide']
    ],
    [['space', 'Space', ' ', 'Space']]
];

/** Dispatch a virtual key through the same pipeline as hardware. */
function virtualKey(label, key, code) {
    recordEvent({
        type: 'keydown',
        source: 'touch',
        key: key === 'Space' ? ' ' : key,
        code,
        keyCode: 0,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        location: 0
    });
    // Emit a matching keyup so up/down stats stay realistic.
    recordEvent({
        type: 'keyup',
        source: 'touch',
        key: key === 'Space' ? ' ' : key,
        code,
        keyCode: 0,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        location: 0
    });
}

/** Build the on-screen keyboard DOM. */
function buildVKeyboard() {
    const kb = $('vkeyboard');
    kb.innerHTML = VKEYS.map((row) => {
        const keys = row
            .map(
                ([label, key, code, cls]) =>
                    `<button class="vkey ${cls ? cls.toLowerCase() : ''}"
                     data-key="${key}" data-code="${code}" data-label="${label}">${label}</button>`
            )
            .join('');
        return `<div class="vkey-row">${keys}</div>`;
    }).join('');

    // One delegated handler for taps and mouse.
    kb.addEventListener('pointerdown', (e) => {
        const btn = e.target.closest('.vkey');
        if (!btn) return;
        e.preventDefault();
        btn.classList.add('pressed');
        virtualKey(btn.dataset.label, btn.dataset.key, btn.dataset.code);
        setTimeout(() => btn.classList.remove('pressed'), 110);
    });
}

/* =======================================================================
   13b. KEY HEATMAP
   -----------------------------------------------------------------------
   Reuses the virtual-keyboard layout (VKEYS) as a read-only board and tints
   each key by how often it was pressed. Intensity is set via a per-key CSS
   custom property (--i) so the paint work stays on the GPU.
   ======================================================================= */

const heatCells = {}; // event.code -> element

function resetExtraHeatmap() {
    const grid = $('heatmapExtraGrid');
    const empty = $('heatmapExtraEmpty');
    if (!grid) return;
    grid.textContent = '';
    if (empty) empty.hidden = false;
}

function heatmapEventId(ev) {
    if (ev.code) return ev.code;
    if (!ev.key || ev.key === 'Unidentified' || ev.key === ' ') return '';
    if (ev.key.length === 1) return '';
    return ev.key;
}

function extraHeatLabel(ev, code) {
    const source = ev.key && ev.key !== 'Unidentified' ? ev.key : code || '';
    const map = {
        AudioVolumeUp: 'Vol +',
        AudioVolumeDown: 'Vol -',
        AudioVolumeMute: 'Mute',
        MediaPlayPause: 'Play/Pause',
        MediaTrackNext: 'Next Track',
        MediaTrackPrevious: 'Prev Track'
    };
    if (map[source]) return map[source];
    return source.replace(/^Numpad/, 'Num ');
}

function renderExtraHeatmap(counts, labels, max) {
    const grid = $('heatmapExtraGrid');
    const empty = $('heatmapExtraEmpty');
    if (!grid) return;

    const extras = Object.entries(counts)
        .filter(([code]) => !heatCells[code])
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

    if (!extras.length) {
        grid.textContent = '';
        if (empty) empty.hidden = false;
        return;
    }

    if (empty) empty.hidden = true;
    grid.textContent = '';
    extras.forEach(([code, count]) => {
        const key = document.createElement('div');
        key.className = 'heat-key heat-key--extra';
        key.dataset.code = code;
        key.style.setProperty('--i', (max ? count / max : 0).toFixed(3));
        key.classList.toggle('hot', max ? count / max > 0.55 : false);

        const label = document.createElement('span');
        label.textContent = labels[code] || code;
        const countEl = document.createElement('span');
        countEl.className = 'heat-count';
        countEl.textContent = String(count);

        key.append(label, countEl);
        grid.appendChild(key);
    });
}

function buildHeatmap() {
    const hm = $('heatmap');
    if (!hm) return;
    hm.innerHTML = VKEYS.map((row) => {
        const keys = row
            .map(
                ([label, , code, cls]) =>
                    `<div class="heat-key ${cls ? cls.toLowerCase() : ''}" data-code="${code}">
                <span>${label}</span><span class="heat-count"></span>
             </div>`
            )
            .join('');
        return `<div class="heat-row">${keys}</div>`;
    }).join('');
    hm.querySelectorAll('.heat-key').forEach((el) => {
        heatCells[el.dataset.code] = el;
    });
    resetExtraHeatmap();
}

function updateHeatmap() {
    if (!Object.keys(heatCells).length) return;
    const downCounts = {};
    const upCounts = {};
    const counts = {};
    const labels = {};
    let max = 0;
    state.events.forEach((ev) => {
        if (ev.type !== 'keydown' && ev.type !== 'keyup') return;
        const id = heatmapEventId(ev);
        if (!id) return;
        if (ev.type === 'keydown') downCounts[id] = (downCounts[id] || 0) + 1;
        else upCounts[id] = (upCounts[id] || 0) + 1;
        if (!labels[id]) labels[id] = extraHeatLabel(ev, id);
    });
    const ids = new Set([...Object.keys(downCounts), ...Object.keys(upCounts)]);
    ids.forEach((id) => {
        const down = downCounts[id] || 0;
        const up = upCounts[id] || 0;
        counts[id] = down > 0 ? down : up;
        if (counts[id] > max) max = counts[id];
    });
    Object.entries(heatCells).forEach(([code, el]) => {
        const c = counts[code] || 0;
        const i = max ? c / max : 0;
        el.style.setProperty('--i', i.toFixed(3));
        el.classList.toggle('hot', i > 0.55);
        el.querySelector('.heat-count').textContent = c || '';
    });
    renderExtraHeatmap(counts, labels, max);
}

/* =======================================================================
   14. TOUCH TEST BENCH - virtual scroll wheel
   ======================================================================= */

/**
 * Turn a drag or scroll on the dial into wheel events. We track the angle of
 * the pointer relative to the dial center; crossing a step threshold emits one
 * tick up or down, like a detented rotary encoder.
 */
function initWheel() {
    const wheel = $('wheel');
    const indicator = wheel.querySelector('.wheel-indicator');
    const STEP = 18; // degrees per tick
    let dragging = false;
    let lastAngle = 0;
    let visualAngle = 0;
    let carry = 0;

    const angleFrom = (e) => {
        const r = wheel.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
    };

    const emitTick = (dir) => {
        recordEvent({
            type: 'wheel',
            source: 'touch',
            deltaX: 0,
            deltaY: dir === 'up' ? -120 : 120,
            deltaZ: 0,
            deltaMode: 0,
            direction: dir,
            ctrlKey: false,
            shiftKey: false,
            altKey: false,
            metaKey: false
        });
    };

    wheel.addEventListener('pointerdown', (e) => {
        dragging = true;
        carry = 0;
        lastAngle = angleFrom(e);
        wheel.setPointerCapture(e.pointerId);
    });

    wheel.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const a = angleFrom(e);
        let delta = a - lastAngle;
        if (delta > 180) delta -= 360; // normalize wrap-around
        if (delta < -180) delta += 360;
        lastAngle = a;
        carry += delta;
        visualAngle += delta;
        indicator.style.transform = `translateX(-50%) rotate(${visualAngle}deg)`;
        // Emit ticks for every full STEP crossed.
        while (Math.abs(carry) >= STEP) {
            const dir = carry > 0 ? 'down' : 'up'; // clockwise = down
            emitTick(dir);
            carry += carry > 0 ? -STEP : STEP;
        }
    });

    const stop = (e) => {
        dragging = false;
    };
    wheel.addEventListener('pointerup', stop);
    wheel.addEventListener('pointercancel', stop);

    // Scrolling directly over the dial also rotates it.
    wheel.addEventListener(
        'wheel',
        (e) => {
            e.preventDefault();
            const dir = e.deltaY > 0 ? 'down' : 'up';
            visualAngle += dir === 'down' ? STEP : -STEP;
            indicator.style.transform = `translateX(-50%) rotate(${visualAngle}deg)`;
            emitTick(dir);
        },
        { passive: false }
    );

    // Keyboard a11y: arrow up/down rotate the wheel.
    wheel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            emitTick('up');
            visualAngle -= STEP;
        } else if (e.key === 'ArrowDown') {
            emitTick('down');
            visualAngle += STEP;
        } else return;
        indicator.style.transform = `translateX(-50%) rotate(${visualAngle}deg)`;
    });
}

/* Bench collapse toggle */
$('benchToggle').addEventListener('click', () => {
    const bench = $('bench');
    bench.classList.toggle('collapsed');
    $('benchToggle').setAttribute('aria-expanded', !bench.classList.contains('collapsed'));
});

/* =======================================================================
   15. PERIODIC TICKS
   ======================================================================= */

// Keep the "keys/sec" gauge and session timer alive even when idle.
setInterval(() => {
    if (state.mode === 'basic') $('basicRate').textContent = eventsPerSecond().toFixed(1);
    else $('advDuration').textContent = state.duration();
}, 1000);

/* =======================================================================
   16. INIT
   ======================================================================= */

function init() {
    buildVKeyboard();
    buildHeatmap();
    initWheel();
    Charts.build();
    switchMode('basic');
    registerServiceWorker();
    console.log(
        '%cFinders Keypress ready - Keyboard Signal Lab online.',
        'color:#37f0b0;font-family:monospace'
    );
}

/**
 * Register the service worker for offline support / installability.
 * Only over http(s) - service workers are unavailable on file://.
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('sw.js').catch(() => {
            /* non-fatal */
        });
    }
}

document.addEventListener('DOMContentLoaded', init);
