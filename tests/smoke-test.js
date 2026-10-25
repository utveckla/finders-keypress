// Smoke test: load the real HTML + app.js in jsdom, simulate input, assert state.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const dir = path.join(__dirname, '..'); // project root (this file lives in tests/)
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

// Stub canvas so Chart.js can "render" headlessly.
const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: 'http://localhost/'
});
const { window } = dom;
global.window = window;
global.document = window.document;
global.localStorage = window.localStorage || {
    _d: {},
    getItem(k) {
        return this._d[k] || null;
    },
    setItem(k, v) {
        this._d[k] = v;
    }
};
// jsdom lacks ResizeObserver (Chart.js uses it) - provide a no-op.
window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};
global.ResizeObserver = window.ResizeObserver;

// Minimal 2d context stub
window.HTMLCanvasElement.prototype.getContext = function () {
    return {
        canvas: this,
        measureText: () => ({ width: 10 }),
        save() {},
        restore() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        stroke() {},
        fill() {},
        arc() {},
        rect() {},
        clearRect() {},
        fillRect() {},
        translate() {},
        rotate() {},
        setTransform() {},
        resetTransform() {},
        scale() {},
        createLinearGradient: () => ({ addColorStop() {} }),
        fillText() {},
        strokeText() {},
        closePath() {},
        setLineDash() {},
        clip() {},
        bezierCurveTo() {},
        quadraticCurveTo() {},
        getImageData: () => ({ data: [] })
    };
};
window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
window.cancelAnimationFrame = () => {};

// Load Chart.js then app.js into the window
const chartSrc = fs.readFileSync(path.join(dir, 'vendor', 'chart.umd.min.js'), 'utf8');
const appSrc = fs.readFileSync(path.join(dir, 'js', 'app.js'), 'utf8');
window.eval(chartSrc);
window.eval(appSrc);
// Fire DOMContentLoaded so init() runs
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

let pass = 0,
    fail = 0;
const check = (name, cond) => {
    if (cond) {
        pass++;
        console.log('  ok  -', name);
    } else {
        fail++;
        console.log('  FAIL-', name);
    }
};

// 1. Virtual keyboard built
const vkeys = window.document.querySelectorAll('.vkey');
check('virtual keyboard rendered keys', vkeys.length > 30);

// 2. Simulate a hardware keydown
window.document.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'a', code: 'KeyA', keyCode: 65 })
);
check('basic readout shows key', window.document.getElementById('basicKey').textContent === 'a');
check('event count incremented', window.document.getElementById('basicCount').textContent === '1');

// 3. Simulate a scroll (wheel) event
window.document.dispatchEvent(new window.WheelEvent('wheel', { deltaY: 120 }));
check('scroll event captured', window.document.getElementById('basicCount').textContent === '2');

// 4. Switch to advanced + verify stats + log rows
window.document.getElementById('advancedModeBtn').click();
check('advanced total events', window.document.getElementById('advCount').textContent === '2');
const logRows = window.document.querySelectorAll('#logBody tr');
check(
    'log table populated',
    logRows.length >= 1 && !window.document.querySelector('#logBody .empty-row')
);

// 4b. Heatmap built and the pressed key (KeyA) has non-zero intensity
const heatKeys = window.document.querySelectorAll('.heat-key');
check('heatmap rendered keys', heatKeys.length > 30);
const aCell = window.document.querySelector('.heat-key[data-code="KeyA"]');
check('heatmap tinted pressed key', aCell && parseFloat(aCell.style.getPropertyValue('--i')) > 0);

// 4c. Non-layout keys appear in the extra detected keys area
window.document.dispatchEvent(
    new window.KeyboardEvent('keydown', {
        key: 'AudioVolumeUp',
        code: 'AudioVolumeUp'
    })
);
const extraHeat = window.document.getElementById('heatmapExtra');
const volumeCell = window.document.querySelector('.heat-key--extra[data-code="AudioVolumeUp"]');
check('extra key heatmap shown for non-layout key', extraHeat && !extraHeat.hidden && volumeCell);

// 4d. Repeat media/control keydown events should still be captured
window.document.dispatchEvent(
    new window.KeyboardEvent('keydown', {
        key: 'AudioVolumeUp',
        code: 'AudioVolumeUp',
        repeat: true
    })
);
const repeatedVolumeCount = window.document.querySelector(
    '.heat-key--extra[data-code="AudioVolumeUp"] .heat-count'
);
check(
    'repeat media keydown contributes to extra key heatmap',
    repeatedVolumeCount && Number(repeatedVolumeCount.textContent) >= 2
);

// 5. Tap a virtual key -> should add keydown + keyup (source touch)
window.document.getElementById('basicModeBtn').click();
const qKey = [...vkeys].find((k) => k.dataset.key === 'q');
qKey.dispatchEvent(new window.Event('pointerdown', { bubbles: true }));
check(
    'virtual tap added events',
    Number(window.document.getElementById('basicCount').textContent) >= 4
);

// 6. Theme toggle persists
window.document.getElementById('themeToggle').click();
check(
    'theme switched to light',
    window.document.documentElement.getAttribute('data-theme') === 'light'
);
check('theme persisted', window.localStorage.getItem('fk-theme') === 'light');

// 7. Clear resets
window.document.getElementById('advancedModeBtn').click();
window.confirm = () => true;
window.document.getElementById('clearBtn').click();
check('clear resets count', window.document.getElementById('advCount').textContent === '0');

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
