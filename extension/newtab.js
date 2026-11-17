// Layered wave wallpapers: each band is one tone. Tones go from the bottom-left band
// to the top-right band, so the last tone sits next to the toolbar and is the base color.
function waves(name, tones) {
  return { name, tones, base: tones[tones.length - 1], c: [tones[1], tones[2], tones[3]] };
}

// Curated presets per mode, so every wallpaper blends into the toolbar.
const PRESETS = {
  ink:      waves('Ink',    ['#9a9a9a', '#767676', '#575757', '#3d3d3d', '#282828', '#171717', '#0a0a0a']),
  tide:     waves('Tide',   ['#4b7bb0', '#3d6797', '#30547d', '#244264', '#19314c', '#112337', '#0b1726']),
  velvet:   waves('Velvet', ['#e0488a', '#c23a76', '#9f2d61', '#7c214c', '#5a1738', '#3a0f25', '#200815']),
  aurora:   { name: 'Aurora',   base: '#05080d', c: ['#12a4b8', '#6a30d8', '#1db87f'] },
  midnight: { name: 'Midnight', base: '#04060d', c: ['#2350d8', '#0b6fc4', '#4a22a8'] },
  rose:     { name: 'Rose',     base: '#12050b', c: ['#ff3d8b', '#b0125a', '#ff7ab6'] },
  sunset:   { name: 'Sunset',   base: '#0e0707', c: ['#ff6a3d', '#c4195e', '#ffad42'] },
  lagoon:   { name: 'Lagoon',   base: '#03090c', c: ['#00b6c9', '#0a5cff', '#00d39c'] },
  neon:     { name: 'Neon',     base: '#07050f', c: ['#ff2e93', '#6200ff', '#00d9ff'] },
  graphite: { name: 'Graphite', base: '#0a0a0c', c: ['#454955', '#25272d', '#666b78'] },
};
const LIGHT_PRESETS = {
  paper:   waves('Paper', ['#4a4a4a', '#6e6e6e', '#909090', '#b0b0b0', '#cbcbcb', '#e2e2e2', '#f6f6f6']),
  lake:    waves('Lake',  ['#3f5f7f', '#557593', '#6b8ba8', '#86a3bd', '#a1bad1', '#bccfe2', '#d9e5f1']),
  petal:   waves('Petal', ['#e97fab', '#ef96ba', '#f3acc9', '#f7c2d7', '#fad5e4', '#fce5ef', '#fef3f8']),
  mist:    { name: 'Mist',    base: '#edf1f9', c: ['#86aaff', '#c39bff', '#73d9e4'] },
  blossom: { name: 'Blossom', base: '#fdeef5', c: ['#ff8cc0', '#ffb0d4', '#ff9fc8'] },
  sorbet:  { name: 'Sorbet',  base: '#fdf2ec', c: ['#ff9470', '#ffc561', '#ff7aa5'] },
  coast:   { name: 'Coast',   base: '#eaf6f8', c: ['#4fd0df', '#74a3ff', '#76e6bb'] },
  citrus:  { name: 'Citrus',  base: '#f9f8ea', c: ['#ffd24f', '#9fe063', '#ffaa5e'] },
  prism:   { name: 'Prism',   base: '#f4f2fb', c: ['#ff8ab5', '#78acff', '#8eeec4'] },
  pearl:   { name: 'Pearl',   base: '#f2f2f4', c: ['#d4d7e1', '#e8e0d6', '#cdd7e6'] },
};
// Wallpapers that were retired, mapped to the closest current one.
const RETIRED = { ember: 'sunset', dusk: 'rose', forest: 'lagoon', dawn: 'sorbet', sky: 'coast', lilac: 'prism', sage: 'coast' };

// Draws a wave wallpaper as an SVG data URL. Each band casts a soft shadow on the one
// below it and has a faint light rim, like layered paper.
const waveCache = {};
function waveParts(tones) {
  const n = tones.length, span = 1900 / n;
  // On dark wallpapers shadows need to be deeper and rims fainter to read the same.
  const dark = parseInt(tones[n - 1].slice(1, 3), 16) < 100;
  const rim = dark ? '.09' : '.22', shade = dark ? '.6' : '.32';
  const bands = [`<rect x="-800" y="-900" width="3200" height="2800" fill="${tones[0]}"/>`];
  for (let i = 1; i < n; i++) {
    const y0 = 1450 - i * span, ph = i * 1.7;
    const pts = [];
    for (let x = -800; x <= 2400; x += 12) {
      const y = y0 + 90 * Math.sin(x / 110 + ph) + 30 * Math.sin(x / 47 + ph * 2.3);
      pts.push(`${x} ${y.toFixed(1)}`);
    }
    bands.push(`<path d="M-800 -900L${pts.join('L')}L2400 -900Z" fill="${tones[i]}" filter="url(#s)" stroke="rgba(255,255,255,${rim})" stroke-width="3"/>`);
  }
  const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">`
    + `<defs><filter id="s" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="-8" dy="16" stdDeviation="16" flood-color="#000" flood-opacity="${shade}"/></filter></defs>`
    + `<g transform="rotate(30 800 500)">${inner}</g></svg>`;
  return { bands, svg };
}
function waveURL(tones) {
  const key = tones.join();
  if (waveCache[key]) return waveCache[key];
  const { bands, svg } = waveParts(tones);
  return (waveCache[key] = `url("data:image/svg+xml,${encodeURIComponent(svg(bands.join('')))}")`);
}
// Moving waves: each band is its own layer that slides gently along its curve, at its
// own pace. Layers are only moved (never redrawn), so this is cheap for the GPU.
let waveKey = '';
function drawWaves(tones) {
  const key = tones ? tones.join() : '';
  if (key === waveKey) return;
  waveKey = key;
  if (!tones) { $('#waves').replaceChildren(); return; }
  const { bands, svg } = waveParts(tones);
  $('#waves').innerHTML = bands.slice(1).map((b) => svg(b)).join('');
  $('#waves').style.background = tones[0];
}

// System fonts only, so nothing is downloaded. Mac fonts first, Windows fallbacks after.
const SYSTEM = '"SF Pro Display", -apple-system, "Segoe UI", system-ui, sans-serif';
// "variable" fonts are built from overlapping shapes; an outline would trace the
// overlaps inside each digit, so glass clocks in these fonts use a soft rim instead.
const FONTS = {
  classic:   { name: 'Classic',   stack: SYSTEM, weight: 200, variable: true },
  soft:      { name: 'Soft',      stack: '"Avenir Next", Avenir, "Segoe UI", sans-serif', weight: 300 },
  heavy:     { name: 'Heavy',     stack: SYSTEM, weight: 700, variable: true },
  editorial: { name: 'Editorial', stack: 'Didot, "Bodoni 72", Georgia, serif', weight: 400 },
  mono:      { name: 'Mono',      stack: '"SF Mono", Menlo, Consolas, monospace', weight: 200, variable: true },
  tall:      { name: 'Tall',      stack: '"Avenir Next Condensed", Bahnschrift, "Arial Narrow", sans-serif', weight: 600 },
  geometric: { name: 'Geometric', stack: 'Futura, "Century Gothic", sans-serif', weight: 500 },
};

// Soft tints only, so the clock never clashes with the wallpapers.
// Light mode uses deep ink tones instead, so the clock stays readable.
// Tints picked from the wallpapers, so there's a clock color for each family.
const CLOCK_COLORS = {
  white:    { name: 'White',  rgb: '255, 255, 255' },
  silver:   { name: 'Silver', rgb: '208, 213, 222' },
  rose:     { name: 'Pink',   rgb: '255, 168, 204' },
  warm:     { name: 'Peach',  rgb: '255, 194, 156' },
  mint:     { name: 'Aqua',   rgb: '140, 236, 226' },
  sky:      { name: 'Ice',    rgb: '166, 202, 255' },
  lavender: { name: 'Violet', rgb: '204, 172, 255' },
};
const LIGHT_CLOCK_COLORS = {
  ink:    { name: 'Ink',      rgb: '29, 29, 31' },
  slate:  { name: 'Graphite', rgb: '74, 76, 84' },
  plum:   { name: 'Berry',    rgb: '156, 34, 96' },
  cocoa:  { name: 'Ember',    rgb: '166, 64, 30' },
  forest: { name: 'Teal',     rgb: '14, 104, 112' },
  navy:   { name: 'Navy',     rgb: '34, 62, 124' },
  grape:  { name: 'Grape',    rgb: '92, 52, 156' },
};

// Sizes: S = 1 cell, M = 2 cells wide, L = 2 x 2 cells, XL = 2 x 3 cells.
// A widget only offers sizes where it shows something different:
//   Weather  S now · M + 3 days · L + details, hourly and 5 days
//   To-do    S a short list · M a few tasks · L most lists · XL long lists
//   Focus    S timer only · M + length controls and today's count
//   Top sites S 4 icons · M 4 with names · L 8 with names
//   Recent tabs and Quote: M and L (they need the width for text)
//   Notes    S to XL, like the to-do list
//   Countdown S days left · M + the date and hours
//   Calendar S next event · M next few · L the coming week
const SIZE_NAMES = { S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra large' };
const WIDGETS = {
  weather: { name: 'Weather',     sizes: ['S', 'M', 'L'],       def: 'S' },
  todo:    { name: 'To-do',       sizes: ['S', 'M', 'L', 'XL'], def: 'L' },
  focus:   { name: 'Focus timer', sizes: ['S', 'M'],            def: 'M' },
  sites:   { name: 'Top sites',   sizes: ['S', 'M', 'L'],       def: 'M' },
  recent:  { name: 'Recent tabs', sizes: ['M', 'L'],            def: 'M' },
  quote:   { name: 'Quote',       sizes: ['M', 'L'],            def: 'M' },
  notes:   { name: 'Notes',       sizes: ['S', 'M', 'L', 'XL'], def: 'M' },
  countdown: { name: 'Countdown', sizes: ['S', 'M'],            def: 'S' },
  calendar: { name: 'Calendar',   sizes: ['S', 'M', 'L'],       def: 'M' },
};

const QUOTES = [
  ['Simplicity is the ultimate sophistication.', 'Leonardo da Vinci'],
  ['Well begun is half done.', 'Aristotle'],
  ['Nothing is softer or more flexible than water, yet nothing can resist it.', 'Lao Tzu'],
  ['The secret of getting ahead is getting started.', 'Mark Twain'],
  ['What we think, we become.', 'Buddha'],
  ['Dwell on the beauty of life.', 'Marcus Aurelius'],
  ['Quality is not an act, it is a habit.', 'Aristotle'],
  ['The journey of a thousand miles begins with one step.', 'Lao Tzu'],
  ['Act as if what you do makes a difference. It does.', 'William James'],
  ['Little by little, one travels far.', 'J. R. R. Tolkien'],
  ['Do what you can, with what you have, where you are.', 'Theodore Roosevelt'],
  ['It always seems impossible until it is done.', 'Nelson Mandela'],
  ['Whatever you are, be a good one.', 'Abraham Lincoln'],
  ['Turn your face to the sun and the shadows fall behind you.', 'Maori proverb'],
  ['The best way out is always through.', 'Robert Frost'],
  ['Knowing is not enough; we must apply.', 'Johann Wolfgang von Goethe'],
  ['Begin anywhere.', 'John Cage'],
  ['In the middle of difficulty lies opportunity.', 'Albert Einstein'],
  ['The present moment always will have been.', 'Rainer Maria Rilke'],
  ['Waste no more time arguing what a good man should be. Be one.', 'Marcus Aurelius'],
  ['He who has a why to live can bear almost any how.', 'Friedrich Nietzsche'],
  ['Make each day your masterpiece.', 'John Wooden'],
  ['Simplicity is the keynote of all true elegance.', 'Coco Chanel'],
  ['What you seek is seeking you.', 'Rumi'],
  ['Done is better than perfect.', 'Sheryl Sandberg'],
  ['Energy and persistence conquer all things.', 'Benjamin Franklin'],
  ['The obstacle is the way.', 'Marcus Aurelius'],
];

const DEFAULTS = {
  appearance: 'auto', // 'auto' follows the system / Chrome setting
  wallpaper: 'aurora', wallpaperLight: 'mist', animated: true, fps: 60,
  blur: 18, tint: 10, liquid: true, solidGlass: false,
  clockStyle: 'clear', clockFont: 'tall', clockSize: 140, clockColor: 'white', clockColorLight: 'ink', hour24: false,
  name: '', greeting: true, greetingSize: 22,
  quote: 'caption', // 'off' | 'caption' | 'widget'
  layout: [{ k: 'weather', size: 'S' }, { k: 'todo', size: 'L' }, { k: 'sites', size: 'M' }],
  city: '', units: 'c', useLocation: false, coords: null, coordsName: '',
  todos: [], focusMinutes: 30, notes: '', countdown: { title: '', date: '' },
};

const $ = (s) => document.querySelector(s);
const hasChrome = typeof chrome !== 'undefined' && !!chrome.storage;
let S;
let editing = false;

// ---------- storage ----------
// Settings live in chrome.storage.sync. A copy in localStorage lets the page draw
// instantly with the right look, before the async sync storage answers.
function migrate(raw) {
  const s = { ...raw };
  if (!s.layout && Array.isArray(s.widgets)) {
    s.layout = s.widgets.filter((k) => k !== 'quote' && WIDGETS[k]).map((k) => ({ k, size: WIDGETS[k].def }));
    if (s.widgets.includes('quote')) { s.quote = 'widget'; s.layout.push({ k: 'quote', size: 'M' }); }
  }
  delete s.widgets;
  for (const k of ['wallpaper', 'wallpaperLight']) if (RETIRED[s[k]]) s[k] = RETIRED[s[k]];
  const merged = { ...DEFAULTS, ...s };
  merged.layout = merged.layout.filter((w) => WIDGETS[w.k] && WIDGETS[w.k].sizes.includes(w.size));
  return merged;
}

function loadMirror() {
  try { return migrate(JSON.parse(localStorage.getItem('glassTab') || '{}')); } catch { return migrate({}); }
}
function mirror() { try { localStorage.setItem('glassTab', JSON.stringify(S)); } catch {} }

let saveTimer, lastSave = 0;
function save() {
  mirror();
  if (!hasChrome) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { lastSave = Date.now(); chrome.storage.sync.set(S); }, 300);
}

async function cacheGet(key) {
  if (hasChrome) return (await chrome.storage.local.get(key))[key];
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
function cacheSet(key, value) {
  if (hasChrome) return chrome.storage.local.set({ [key]: value });
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ---------- helpers ----------
function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else e.setAttribute(k, v);
  }
  e.append(...kids.flat().filter((k) => k != null));
  return e;
}

function favicon(url) {
  return `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${encodeURIComponent(url)}&size=32`;
}

// A new quote on every new tab, never the same one twice in a row.
const pageQuote = (() => {
  let last = -1;
  try { last = Number(localStorage.getItem('glassTabQuote') ?? -1); } catch {}
  let i = Math.floor(Math.random() * QUOTES.length);
  if (i === last) i = (i + 1) % QUOTES.length;
  try { localStorage.setItem('glassTabQuote', String(i)); } catch {}
  return QUOTES[i];
})();
function todaysQuote() {
  return pageQuote;
}

// ---------- look ----------
// ---------- appearance ----------
const lightQuery = matchMedia('(prefers-color-scheme: light)');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
function mode() {
  return S.appearance === 'auto' ? (lightQuery.matches ? 'light' : 'dark') : S.appearance;
}
// Per-mode choices: wallpaper list, saved wallpaper key, clock colors, saved clock color key.
function modeSet(m = mode()) {
  return m === 'light'
    ? { presets: LIGHT_PRESETS, wpKey: 'wallpaperLight', colors: LIGHT_CLOCK_COLORS, colorKey: 'clockColorLight' }
    : { presets: PRESETS, wpKey: 'wallpaper', colors: CLOCK_COLORS, colorKey: 'clockColor' };
}
function presetFor(m) {
  const set = modeSet(m);
  return set.presets[S[set.wpKey]] || Object.values(set.presets)[0];
}
function varsFor(m) {
  const set = modeSet(m), p = presetFor(m);
  const f = FONTS[S.clockFont] || FONTS.tall;
  // Thin strokes leave no surface to show glass, so glass styles get a heavier weight.
  const weight = S.clockStyle !== 'solid' && f.weight < 400 ? 400 : f.weight;
  return {
    '--base': p.base, '--c1': p.c[0], '--c2': p.c[1], '--c3': p.c[2],
    '--wave': p.tones ? waveURL(p.tones) : 'none', '--blob-display': p.tones ? 'none' : 'block',
    '--blur': `${S.blur}px`, '--tint': String(S.tint / 100),
    '--clock-font': f.stack, '--clock-weight': String(weight), '--clock-size': `${S.clockSize}px`, '--greeting-size': `${S.greetingSize}px`,
    '--clock-rgb': (set.colors[S[set.colorKey]] || Object.values(set.colors)[0]).rgb,
  };
}

function applyLook() {
  const m = mode();
  const base = [S.animated && 'animated', S.liquid && 'liquid', S.solidGlass && 'solid'].filter(Boolean).join(' ');
  const root = document.documentElement;
  for (const [k, v] of Object.entries(varsFor(m))) root.style.setProperty(k, v);
  root.className = `${base}${m === 'light' ? ' light' : ''}`;
  $('#clock').className = `${S.clockStyle}${(FONTS[S.clockFont] || FONTS.tall).variable ? ' rim' : ''}`;
  const p = presetFor(m);
  drawWaves(moving() && p.tones ? p.tones : null);
  updateMotion();
  // boot.js applies this before the next page draws, for whichever mode is active then.
  try {
    localStorage.setItem('glassTabLook', JSON.stringify({ auto: S.appearance === 'auto', mode: m, cls: base, vars: { dark: varsFor('dark'), light: varsFor('light') } }));
  } catch {}
  // Shared with the Glass Google content script, which picks the mode Google is in.
  const pd = presetFor('dark'), pl = presetFor('light');
  const wave = (p) => (p.tones ? waveURL(p.tones) : null);
  const look = { dark: { base: pd.base, c: pd.c, wave: wave(pd) }, light: { base: pl.base, c: pl.c, wave: wave(pl) }, blur: S.blur, tint: S.tint, solid: S.solidGlass };
  if (hasChrome && JSON.stringify(look) !== lastLook) { lastLook = JSON.stringify(look); chrome.storage.local.set({ look }); }
}
lightQuery.addEventListener('change', () => { if (S.appearance === 'auto') { applyLook(); syncPanel(); } });
reduceMotion.addEventListener('change', applyLook);

// ---------- motion ----------
// Background motion runs here rather than in CSS so it can be held to the frame rate the
// user picked: fewer frames means less work and longer battery. Only transforms change,
// so each frame is cheap.
const BLOB_SECONDS = { b1: 22, b2: 28, b3: 34, b4: 18, b5: 26 };
const blobs = Object.keys(BLOB_SECONDS).map((k) => [document.querySelector(`.${k}`), BLOB_SECONDS[k]]);
let motionTimer = 0;
function moving() { return S.animated && !reduceMotion.matches; }
// The page sleeps until just before the next frame is due, then draws it in step with
// the screen, so lower rates really do less work.
function scheduleMotion(last = performance.now()) {
  const due = last + 1000 / S.fps;
  const frame = (now) => {
    if (!motionTimer) return;
    if (now < due - 3) { requestAnimationFrame(frame); return; }
    stepMotion(now);
    scheduleMotion(now);
  };
  motionTimer = setTimeout(() => requestAnimationFrame(frame), Math.max(0, due - performance.now() - 6));
}
function stepMotion(now) {
  const t = now / 1000;
  // Blobs drift out and back; wave bands slide back and forth along their curves,
  // each at its own pace (seconds per sweep, start offset).
  for (const [el, sec] of blobs) {
    const d = (1 - Math.cos(2 * Math.PI * t / sec)) / 2;
    el.style.transform = `translate(${6 * d}vmax, ${-4 * d}vmax) scale(${1 + 0.12 * d})`;
  }
  document.querySelectorAll('#waves svg').forEach((el, i) => {
    const [sec, start] = (i + 1) % 3 === 0 ? [20, 9] : (i + 1) % 2 === 0 ? [16, 5] : [12, 0];
    const v = -Math.cos(Math.PI * (t + start) / sec);
    el.style.transform = `translate(${4.3 * v}vmax, ${2.5 * v}vmax)`;
  });
}
function updateMotion() {
  clearTimeout(motionTimer);
  motionTimer = 0;
  if (moving()) scheduleMotion();
  else for (const [el] of blobs) el.style.transform = '';
}
let lastLook = '';

// ---------- glass Google search (helpers in gg.js) ----------
async function setGlassGoogle(on) {
  const box = $('#glassGoogle');
  if (!hasChrome) { box.checked = false; return; }
  try {
    if (on) {
      // ggTurnOn shows Chrome's prompt, so it must run straight from the click.
      if (await ggTurnOn()) $('#googleNote').textContent = 'On. Reload any open Google search tabs to see it.';
    } else {
      await ggTurnOff();
    }
  } catch (err) {
    $('#googleNote').textContent = `Couldn't turn this on: ${err.message}`;
  }
  box.checked = await ggIsOn();
}

// ---------- clock ----------
function updateClock() {
  const d = new Date();
  let hr = d.getHours();
  const part = hr < 5 ? 'evening' : hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
  if (!S.hour24) hr = hr % 12 || 12;
  $('#clock').textContent = `${hr}:${String(d.getMinutes()).padStart(2, '0')}`;
  $('#date').textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  $('#greeting').textContent = S.greeting ? `Good ${part}${S.name ? `, ${S.name}` : ''}` : '';
  const [text, who] = todaysQuote();
  $('#quoteCaption').textContent = S.quote === 'caption' ? `"${text}" — ${who}` : '';
}
function tick() {
  updateClock();
  setTimeout(tick, 1000 - (Date.now() % 1000));
}

// ---------- widgets ----------
// Simple text symbols (not emoji), so they take the widget's color like the text does.
function wxIcon(code) {
  if (code === 0) return '☀\uFE0E';
  if (code <= 2) return '⛅\uFE0E';
  if (code <= 48) return '☁\uFE0E';
  if (code <= 67 || (code >= 80 && code <= 82)) return '☂\uFE0E';
  if (code <= 86) return '❄\uFE0E';
  return '⚡\uFE0E';
}
function wxLabel(code) {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorms';
}

// Finds a typed city. "London, ON", "London ON" or "Paris, France" pick the right
// one: the last part is matched against the region (name, start of it, or its
// initials, so ON = Ontario and BC = British Columbia) and the country.
async function findCity(text) {
  const search = async (name) => (await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=20`)).json()).results || [];
  const parts = text.includes(',') ? text.split(',').map((x) => x.trim()) : [text];
  let name = parts[0], region = parts.slice(1).join(' ');
  let results = await search(name);
  if (!results.length && !region && /\s/.test(text)) {
    // "London ON": try the last word as the region.
    name = text.replace(/\s+\S+$/, '');
    region = text.split(/\s+/).pop();
    results = await search(name);
  }
  if (region) {
    const want = region.toLowerCase().replace(/\./g, '');
    const alias = { uk: 'gb', usa: 'us' }[want] || want;
    const initials = (x = '') => x.split(/\s+/).map((w) => w[0]).join('').toLowerCase();
    const fits = (r) => [r.admin1, r.country].some((x) => x && (x.toLowerCase() === want || x.toLowerCase().startsWith(want) || initials(x) === want))
      || r.country_code?.toLowerCase() === alias;
    results = results.filter(fits);
  }
  const r = results[0];
  if (!r) throw new Error('City not found');
  return { lat: r.latitude, lon: r.longitude, place: r.admin1 && r.admin1 !== r.name ? `${r.name}, ${r.admin1}` : r.name };
}

// Name for a spot on the map ("London, ON"), from BigDataCloud's free lookup.
async function placeName({ lat, lon }) {
  try {
    const j = await (await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)).json();
    const town = j.city || j.locality;
    const region = j.principalSubdivisionCode?.split('-')[1] || j.principalSubdivision;
    return town ? [town, region].filter(Boolean).join(', ') : '';
  } catch { return ''; }
}

function locate(options) {
  return new Promise((res, rej) => navigator.geolocation.getCurrentPosition(
    (p) => res({ lat: p.coords.latitude, lon: p.coords.longitude }), rej,
    { enableHighAccuracy: false, timeout: 20000, maximumAge: 10 * 60e3, ...options }));
}

// When you've moved since last time, follow you, quietly: only if location is
// already allowed, so this never shows a prompt.
async function refreshCoords() {
  try {
    if ((await navigator.permissions.query({ name: 'geolocation' })).state !== 'granted') return;
    const c = await locate({ timeout: 8000, maximumAge: 30 * 60e3 });
    const moved = Math.hypot(c.lat - S.coords.lat, c.lon - S.coords.lon) > 0.02; // about 2 km
    if (!moved) return;
    S.coords = c;
    S.coordsName = await placeName(c);
    save();
  } catch {}
}

async function getWeather() {
  const here = S.useLocation && S.coords;
  if (here) {
    const cached = await cacheGet('weather');
    if (!cached || Date.now() - cached.at > 30 * 60e3) await refreshCoords();
  }
  const key = `v3|${here ? `${S.coords.lat.toFixed(2)},${S.coords.lon.toFixed(2)}` : S.city}|${S.units}`;
  const cached = await cacheGet('weather');
  if (cached && cached.key === key && Date.now() - cached.at < 30 * 60e3) return cached.data;

  let lat, lon, place;
  if (here) {
    ({ lat, lon } = S.coords);
    place = S.coordsName || 'Your location';
  } else {
    ({ lat, lon, place } = await findCity(S.city));
  }
  const unit = S.units === 'f' ? '&temperature_unit=fahrenheit&wind_speed_unit=mph' : '';
  const j = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code'
    + '&hourly=temperature_2m,weather_code&forecast_hours=7'
    + `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=5${unit}`)).json();
  const c = j.current;
  const data = {
    place,
    temp: c.temperature_2m,
    code: c.weather_code,
    label: wxLabel(c.weather_code),
    feels: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    wind: c.wind_speed_10m,
    windUnit: S.units === 'f' ? 'mph' : 'km/h',
    hours: j.hourly.time.slice(1).map((t, i) => ({ t, temp: j.hourly.temperature_2m[i + 1], code: j.hourly.weather_code[i + 1] })),
    days: j.daily.time.map((t, i) => ({ t, max: j.daily.temperature_2m_max[i], min: j.daily.temperature_2m_min[i], code: j.daily.weather_code[i], rain: j.daily.precipitation_probability_max?.[i] })),
  };
  cacheSet('weather', { key, at: Date.now(), data });
  return data;
}

function weatherWidget(size) {
  const body = h('div', { class: 'wx' }, S.city || S.useLocation ? 'Loading…' : null);
  if (!S.city && !S.useLocation) {
    // Empty state: one click takes you straight to the weather settings.
    body.append(h('button', { class: 'chip', onclick: (e) => { e.stopPropagation(); openWeatherSettings(); } }, 'Set your city'));
  }
  if (S.city || S.useLocation) {
    getWeather()
      .then((d) => {
        const deg = (t) => `${Math.round(t)}°`;
        const day = (t, i) => (i === 0 ? 'Today' : new Date(`${t}T12:00`).toLocaleDateString(undefined, { weekday: 'short' }));
        const now = h('div', {},
          h('div', { class: 'wx-temp' }, deg(d.temp)),
          h('div', {}, d.label),
          h('div', { class: 'muted' }, d.place));
        if (size === 'S') { body.replaceChildren(now); return; }
        if (size === 'M') {
          body.replaceChildren(now, h('div', { class: 'wx-days' }, ...d.days.slice(0, 3).flatMap((x, i) => [
            h('span', {}, day(x.t, i)), h('span', {}, `${deg(x.max)} / ${deg(x.min)}`)])));
          return;
        }
        // Large: current details, the next few hours and five days.
        const hour = (t) => new Date(t).toLocaleTimeString(undefined, { hour: 'numeric' });
        body.className = 'wx wx-l';
        body.replaceChildren(
          h('div', { class: 'wx-now' }, now, h('div', { class: 'wx-facts' },
            h('span', {}, `Feels like ${deg(d.feels)}`),
            h('span', {}, `Humidity ${Math.round(d.humidity)}%`),
            h('span', {}, `Wind ${Math.round(d.wind)} ${d.windUnit}`),
            h('span', {}, `High ${deg(d.days[0].max)} · Low ${deg(d.days[0].min)}`))),
          h('div', { class: 'wx-strip' }, ...d.hours.map((x) => h('div', {}, h('span', { class: 'muted' }, hour(x.t)), h('b', {}, wxIcon(x.code)), h('span', {}, deg(x.temp))))),
          h('div', { class: 'wx-strip' }, ...d.days.map((x, i) => h('div', {}, h('span', { class: 'muted' }, day(x.t, i)), h('b', {}, wxIcon(x.code)), h('span', {}, `${deg(x.max)} ${deg(x.min)}`)))),
        );
      })
      .catch(() => { body.textContent = "Couldn't load weather. Check the city name."; });
  }
  return h('div', {}, h('h3', {}, 'Weather'), body);
}

// Chrome's synced storage allows 8 KB per setting, so lists and notes are capped to fit.
const TODO_MAX = 50, NOTES_MAX = 6000;

// To-do: unfinished tasks stay on top, finished ones sink to the bottom and can be
// cleared in one go. Click a task to edit it; empty it to delete. Enter keeps adding.
function todoWidget(size) {
  const list = h('ul', { class: 'todo' });
  const left = h('span', { class: 'muted' });
  const clear = h('button', { class: 'linkish', onclick: () => { S.todos = S.todos.filter((t) => !t.done); save(); draw(); } });
  const draw = () => {
    const open = S.todos.filter((t) => !t.done), done = S.todos.filter((t) => t.done);
    left.textContent = S.todos.length ? (open.length ? `${open.length} left` : 'All done') : '';
    clear.textContent = `Clear ${done.length} done`;
    clear.hidden = !done.length;
    list.replaceChildren(...[...open, ...done].map((t) => {
      const text = h('span', { tabindex: '0', title: 'Click to edit' }, t.text);
      text.addEventListener('click', () => {
        if (text.isContentEditable) return;
        text.contentEditable = 'plaintext-only';
        text.focus();
        getSelection().selectAllChildren(text);
      });
      text.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); text.blur(); }
        if (e.key === 'Escape') { text.textContent = t.text; text.blur(); }
      });
      text.addEventListener('blur', () => {
        text.contentEditable = 'false';
        const v = text.textContent.trim();
        if (v === t.text) return;
        if (v) t.text = v.slice(0, 120); else S.todos.splice(S.todos.indexOf(t), 1);
        save();
        draw();
      });
      return h('li', { class: t.done ? 'done' : '' },
        h('button', { class: 'check', 'aria-label': t.done ? 'Mark not done' : 'Mark done', onclick: () => { t.done = !t.done; save(); draw(); } }),
        text,
        h('button', { class: 'del', 'aria-label': 'Delete task', onclick: () => { S.todos.splice(S.todos.indexOf(t), 1); save(); draw(); } }, '×'));
    }));
  };
  draw();
  const input = h('input', { placeholder: size === 'S' ? 'Add a task' : 'Add a task and press Enter', maxlength: '120', 'aria-label': 'Add a task' });
  const form = h('form', { onsubmit: (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || S.todos.length >= TODO_MAX) return;
    S.todos.push({ text, done: false });
    input.value = '';
    save();
    draw();
    list.lastElementChild && [...list.children].filter((li) => !li.classList.contains('done')).pop()?.scrollIntoView({ block: 'nearest' });
  } }, input);
  return h('div', { class: 'todo-w' }, h('div', { class: 'whead' }, h('h3', {}, 'Today'), left, clear), list, form);
}

// Focus timer state lives in chrome.storage.local so every tab shows the same timer.
// The background worker fires the "done" notification even if no tab is open.
// Lengths to choose from: 15-minute steps up to an hour, then 30-minute steps.
const FOCUS_LENGTHS = [15, 30, 45, 60, 90, 120];
const focusSeconds = () => S.focusMinutes * 60;
let focusState = null;
const focusViews = new Set();

function freshFocus(f) {
  const today = new Date().toDateString();
  const s = { endAt: null, left: focusSeconds(), len: focusSeconds(), day: today, done: 0, ...f };
  if (s.day !== today) { s.day = today; s.done = 0; }
  return s;
}
function focusLeft(f) {
  return f.endAt ? Math.max(0, Math.ceil((f.endAt - Date.now()) / 1000)) : f.left;
}
async function setFocus(next) {
  focusState = next;
  await cacheSet('focus', next);
  if (hasChrome && chrome.alarms) {
    if (next.endAt) chrome.alarms.create('focus', { when: next.endAt });
    else chrome.alarms.clear('focus');
  }
  drawFocus();
}
function drawFocus() { focusViews.forEach((draw) => draw()); }

function focusWidget(size) {
  const time = h('div', { class: 'focus-time' });
  const start = h('button', { class: 'chip' });
  const reset = h('button', { class: 'chip', onclick: () => setFocus({ ...focusState, endAt: null, left: focusSeconds(), len: focusSeconds() }) }, 'Reset');
  // − and + pick the session length while the timer isn't running.
  const step = (dir) => {
    const i = FOCUS_LENGTHS.indexOf(S.focusMinutes);
    const next = FOCUS_LENGTHS[Math.min(FOCUS_LENGTHS.length - 1, Math.max(0, (i < 0 ? 1 : i) + dir))];
    if (next === S.focusMinutes) return;
    S.focusMinutes = next;
    save();
    setFocus({ ...focusState, endAt: null, left: focusSeconds(), len: focusSeconds() });
  };
  const less = h('button', { class: 'adj', 'aria-label': 'Shorter session', onclick: () => step(-1) }, '−');
  const more = h('button', { class: 'adj', 'aria-label': 'Longer session', onclick: () => step(1) }, '+');
  const count = h('div', { class: 'muted' });
  start.onclick = () => {
    const f = focusState;
    if (f.endAt) setFocus({ ...f, endAt: null, left: focusLeft(f) });
    else setFocus({ ...f, endAt: Date.now() + f.left * 1000 });
  };
  const el = h('div', { class: 'center' }, h('h3', {}, 'Focus'), h('div', { class: 'focus-set' }, size === 'S' ? null : less, time, size === 'S' ? null : more), h('div', { class: 'row' }, start, reset), size === 'M' ? count : null);
  const draw = () => {
    if (!el.isConnected && focusViews.has(draw) && el.dataset.drawn) { focusViews.delete(draw); return; }
    el.dataset.drawn = '1';
    if (!focusState) return;
    let left = focusLeft(focusState);
    // Without Chrome (preview), finish the session here instead of in the background worker.
    if (!hasChrome && focusState.endAt && left === 0) {
      focusState = freshFocus({ ...focusState, endAt: null, left: focusSeconds(), done: focusState.done + 1 });
      left = focusSeconds();
    }
    const hrs = Math.floor(left / 3600), mins = Math.floor(left / 60) % 60, secs = String(left % 60).padStart(2, '0');
    time.textContent = hrs ? `${hrs}:${String(mins).padStart(2, '0')}:${secs}` : `${mins}:${secs}`;
    // Lengths can only change before a session starts or after Reset.
    const idle = !focusState.endAt && left === (focusState.len || focusSeconds());
    less.hidden = more.hidden = !idle;
    less.disabled = S.focusMinutes <= FOCUS_LENGTHS[0];
    more.disabled = S.focusMinutes >= FOCUS_LENGTHS[FOCUS_LENGTHS.length - 1];
    start.textContent = focusState.endAt ? 'Pause' : 'Start';
    count.textContent = `${focusState.done} ${focusState.done === 1 ? 'session' : 'sessions'} today`;
  };
  focusViews.add(draw);
  draw();
  return el;
}
setInterval(drawFocus, 1000);

function sitesWidget(size) {
  const grid = h('div', { class: 'sites' });
  if (hasChrome && chrome.topSites) {
    chrome.topSites.get((list) => grid.replaceChildren(...list.slice(0, size === 'L' ? 8 : 4).map((s) =>
      h('a', { class: 'site', href: s.url, title: s.title }, h('img', { src: favicon(s.url), alt: '' }), h('span', {}, s.title)))));
  } else { grid.className = ''; grid.textContent = 'Available when installed in Chrome.'; }
  return h('div', {}, h('h3', {}, 'Top sites'), grid);
}

function recentWidget(size) {
  const list = h('div', {});
  if (hasChrome && chrome.sessions) {
    chrome.sessions.getRecentlyClosed({ maxResults: 10 }, (items) => {
      // Skip closed new tab pages: they're not worth reopening.
      const tabs = items.filter((i) => i.tab && /^https?:/.test(i.tab.url)).slice(0, size === 'L' ? 7 : 3);
      if (!tabs.length) { list.textContent = 'Nothing closed yet.'; return; }
      list.replaceChildren(...tabs.map(({ tab }) => h('button', { class: 'recent', title: tab.url, onclick: () => chrome.sessions.restore(tab.sessionId) },
        h('img', { src: favicon(tab.url), alt: '' }), h('span', {}, tab.title || tab.url))));
    });
  } else list.textContent = 'Available when installed in Chrome.';
  return h('div', {}, h('h3', {}, 'Recently closed'), list);
}

function quoteWidget() {
  const [text, who] = todaysQuote();
  return h('div', { class: 'quote-w' }, h('div', { class: 'quote' }, `"${text}"`), h('div', { class: 'muted' }, who));
}

// Notes: one free-form page, saved as you type.
function notesWidget(size) {
  const area = h('textarea', { placeholder: 'Jot something down…', maxlength: String(NOTES_MAX), 'aria-label': 'Notes', spellcheck: 'true' });
  area.value = S.notes;
  const count = h('span', { class: 'muted' });
  const showCount = () => { count.textContent = S.notes.length > NOTES_MAX - 500 ? `${NOTES_MAX - S.notes.length} left` : ''; };
  area.addEventListener('input', () => { S.notes = area.value; showCount(); save(); });
  showCount();
  return h('div', { class: 'notes-w' }, h('div', { class: 'whead' }, h('h3', {}, 'Notes'), count), area);
}

// Countdown to a date the user picks, like an exam, a trip or a birthday.
function countdownWidget(size) {
  const el = h('div', { class: 'cd-w' });
  const draw = () => {
    const c = S.countdown;
    if (!c.date) {
      el.replaceChildren(h('h3', {}, 'Countdown'), h('button', { class: 'chip', onclick: (e) => { e.stopPropagation(); edit(); } }, 'Set a date'));
      return;
    }
    const target = new Date(`${c.date}T00:00`);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Math.round((target - today) / 864e5);
    const big = days === 0 ? 'Today' : String(Math.abs(days));
    const unit = days === 0 ? '' : `${Math.abs(days) === 1 ? 'day' : 'days'}${days < 0 ? ' ago' : ''}`;
    const when = target.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: target.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
    const weeks = days > 13 ? `${Math.floor(days / 7)} weeks, ${days % 7} ${days % 7 === 1 ? 'day' : 'days'}` : null;
    el.replaceChildren(
      h('div', { class: 'whead' }, h('h3', {}, c.title || 'Countdown'), h('button', { class: 'linkish', onclick: (e) => { e.stopPropagation(); edit(); } }, 'Edit')),
      h('div', { class: 'cd-num' }, big, h('span', {}, ` ${unit}`)),
      ...(size === 'M' ? [h('div', { class: 'muted' }, [when, weeks].filter(Boolean).join(' · '))] : []));
  };
  const edit = () => {
    const title = h('input', { placeholder: 'What for?', maxlength: '40', value: S.countdown.title });
    const date = h('input', { type: 'date', value: S.countdown.date, 'aria-label': 'Date' });
    el.replaceChildren(h('form', { class: 'cd-form', onsubmit: (e) => {
      e.preventDefault();
      S.countdown = { title: title.value.trim(), date: date.value };
      save();
      draw();
    } }, title, date, h('div', { class: 'row' }, h('button', { class: 'chip' }, 'Save'), h('button', { class: 'chip', type: 'button', onclick: draw }, 'Cancel'))));
    title.focus();
  };
  draw();
  return el;
}

// ---------- calendar ----------
// Reads Google Calendar or iCloud through the calendar's private iCal link, so no
// sign-in is needed and nothing leaves this computer. The link is kept in local
// storage only (not synced), because anyone with it can read the calendar.
const CAL_ORIGINS = ['https://calendar.google.com/*', 'https://*.icloud.com/*'];

// Minimal iCal reader: events, all-day events, time zones as local time, and the
// common repeat rules (daily, weekly by weekday, monthly, yearly; count/until/except).
function parseICS(text, from, to) {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const out = [];
  let ev = null;
  const toDate = (v, params) => {
    const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);
    if (!m) return null;
    const [, y, mo, d, hh, mm, ss, z] = m;
    if (!hh) return { date: new Date(+y, mo - 1, +d), allDay: true };
    const date = z ? new Date(Date.UTC(+y, mo - 1, +d, +hh, +mm, +ss)) : new Date(+y, mo - 1, +d, +hh, +mm, +ss);
    return { date, allDay: /VALUE=DATE(;|$)/.test(params) };
  };
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { ev = { ex: [] }; continue; }
    if (line === 'END:VEVENT') { if (ev?.start) expand(ev); ev = null; continue; }
    if (!ev) continue;
    const i = line.indexOf(':');
    const [name, ...rest] = line.slice(0, i).split(';');
    const params = rest.join(';'), value = line.slice(i + 1);
    if (name === 'SUMMARY') ev.title = value.replace(/\\([,;\\])/g, '$1').replace(/\\n/gi, ' ');
    else if (name === 'DTSTART') ev.start = toDate(value, params);
    else if (name === 'DTEND') ev.end = toDate(value, params)?.date;
    else if (name === 'RRULE') ev.rule = Object.fromEntries(value.split(';').map((kv) => kv.split('=')));
    else if (name === 'EXDATE') value.split(',').forEach((v) => { const d = toDate(v, params); if (d) ev.ex.push(d.date.getTime()); });
    else if (name === 'STATUS' && value === 'CANCELLED') ev.cancelled = true;
  }
  function expand(e) {
    if (e.cancelled) return;
    const len = (e.end || e.start.date) - e.start.date;
    const add = (d) => { if (d >= from - len && d < to && !e.ex.includes(d.getTime())) out.push({ title: e.title || '(No title)', start: d, end: new Date(+d + len), allDay: e.start.allDay }); };
    const r = e.rule;
    if (!r) { add(e.start.date); return; }
    const step = +(r.INTERVAL || 1), until = r.UNTIL ? toDate(r.UNTIL, '').date : null;
    let left = r.COUNT ? +r.COUNT : Infinity;
    const days = r.BYDAY ? r.BYDAY.split(',').map((x) => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(x.slice(-2))) : null;
    let d = new Date(e.start.date);
    // Old daily or weekly repeats with no count: jump straight to the coming week.
    const period = { DAILY: 1, WEEKLY: 7 }[r.FREQ] * step;
    if (period && left === Infinity && d < from) d.setDate(d.getDate() + Math.floor((from - d) / (period * 864e5)) * period);
    for (let n = 0; n < 5000 && left > 0; n++) {
      if (until && d > until) break;
      if (d >= to) break;
      if (r.FREQ === 'WEEKLY' && days) {
        // Walk each day of this week, then jump ahead by the interval.
        const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
        for (let k = 0; k < 7 && left > 0; k++) {
          const day = new Date(weekStart); day.setDate(weekStart.getDate() + k);
          if (day < e.start.date || !days.includes(k)) continue;
          if ((until && day > until) || day >= to) break;
          add(day); left--;
        }
        d = new Date(weekStart);
        d.setDate(weekStart.getDate() + 7 * step);
        continue;
      }
      add(new Date(d)); left--;
      if (r.FREQ === 'DAILY') d.setDate(d.getDate() + step);
      else if (r.FREQ === 'WEEKLY') d.setDate(d.getDate() + 7 * step);
      else if (r.FREQ === 'MONTHLY') d.setMonth(d.getMonth() + step);
      else if (r.FREQ === 'YEARLY') d.setFullYear(d.getFullYear() + step);
      else break;
    }
  }
  return out;
}

const calLink = (u) => u.trim().replace(/^webcal:/i, 'https:');
async function getCalendar() {
  const links = ((await cacheGet('calLinks')) || []).map(calLink).filter(Boolean);
  if (!links.length) return null;
  const cached = await cacheGet('calCache');
  if (cached && cached.key === links.join() && Date.now() - cached.at < 15 * 60e3) return cached.events.map((x) => ({ ...x, start: new Date(x.start), end: new Date(x.end) }));
  const from = new Date(); from.setHours(0, 0, 0, 0);
  const to = new Date(+from + 8 * 864e5);
  const lists = await Promise.all(links.map(async (u) => parseICS(await (await fetch(u, { cache: 'no-store' })).text(), from, to)));
  const now = Date.now();
  const events = lists.flat().filter((x) => +x.end > now || x.allDay).sort((a, b) => a.start - b.start || a.allDay - b.allDay);
  cacheSet('calCache', { key: links.join(), at: Date.now(), events });
  return events;
}

function calendarWidget(size) {
  const body = h('div', { class: 'cal' }, 'Loading…');
  const today = new Date();
  const head = h('div', { class: 'whead' }, h('h3', {}, 'Calendar'), h('span', { class: 'muted' }, today.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })));
  const time = (e) => (e.allDay ? 'All day' : e.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }));
  const dayName = (d) => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - t) / 864e5);
    return diff <= 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  };
  const row = (e, withDay) => h('div', { class: 'cal-ev' }, h('span', { class: 'cal-t' }, withDay && dayName(e.start) !== 'Today' ? `${dayName(e.start).split(',')[0]} ${time(e)}` : time(e)), h('span', { class: 'cal-n' }, e.title));
  getCalendar().then((events) => {
    if (!events) {
      body.replaceChildren(h('button', { class: 'chip', onclick: (e) => { e.stopPropagation(); openCalendarSettings(); } }, 'Link a calendar'));
      return;
    }
    if (!events.length) { body.textContent = 'Nothing coming up this week.'; return; }
    if (size === 'S') { body.replaceChildren(h('div', { class: 'muted' }, `Next · ${dayName(events[0].start)}`), h('div', { class: 'cal-next' }, events[0].title), h('div', { class: 'muted' }, time(events[0]))); return; }
    if (size === 'M') { body.replaceChildren(...events.slice(0, 3).map((e) => row(e, true))); return; }
    // Large: the coming week, grouped by day.
    const groups = new Map();
    for (const e of events) { const k = dayName(e.start); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e); }
    body.className = 'cal cal-l';
    body.replaceChildren(...[...groups].flatMap(([k, list]) => [h('div', { class: 'cal-day' }, k), ...list.map((e) => row(e, false))]));
  }).catch(() => { body.textContent = "Couldn't load your calendar. Check the link in Customize."; });
  return h('div', { class: 'cal-w' }, head, body);
}

function openCalendarSettings() {
  $('#panel').hidden = false;
  $('#gear').setAttribute('aria-expanded', 'true');
  $('#calLinks').scrollIntoView({ block: 'center' });
  $('#calLinks').focus();
}

// Saving the link asks Chrome for access to that calendar service (it has to come
// straight from the click), then shows the widget.
async function saveCalendarLinks() {
  const links = $('#calLinks').value.split(/\s+/).map(calLink).filter((u) => /^https:\/\//.test(u));
  const note = $('#calNote');
  if (!links.length) {
    await cacheSet('calLinks', []);
    note.textContent = 'Calendar unlinked.';
    renderWidgets();
    return;
  }
  const ok = await chrome.permissions.request({ origins: CAL_ORIGINS }).catch(() => false);
  if (!ok) { note.textContent = 'Glass Tab needs permission to read your calendar link.'; return; }
  await cacheSet('calLinks', links);
  await cacheSet('calCache', null);
  if (!S.layout.some((w) => w.k === 'calendar')) { S.layout.push({ k: 'calendar', size: WIDGETS.calendar.def }); update(); }
  note.textContent = `Linked ${links.length} ${links.length === 1 ? 'calendar' : 'calendars'}.`;
  renderWidgets();
}

const RENDER = { weather: weatherWidget, todo: todoWidget, focus: focusWidget, sites: sitesWidget, recent: recentWidget, quote: quoteWidget, notes: notesWidget, countdown: countdownWidget, calendar: calendarWidget };

// ---------- layout and edit mode ----------
// Widgets are identified by key (each widget appears at most once).
function removeWidget(k) {
  S.layout = S.layout.filter((w) => w.k !== k);
  if (k === 'quote') S.quote = 'off';
  update();
  renderWidgets();
}
function setSize(k, size) {
  const w = S.layout.find((x) => x.k === k);
  if (!w || w.size === size) return;
  w.size = size;
  update();
  renderWidgets();
}

// One row of size buttons, used on the widget in edit mode and in Customize.
function sizePicker(k, current, long) {
  return h('div', { class: 'sizes', role: 'group', 'aria-label': `${WIDGETS[k].name} size` },
    ...WIDGETS[k].sizes.map((z) => h('button', {
      class: z === current ? 'on' : '', title: SIZE_NAMES[z], 'aria-pressed': String(z === current),
      onclick: (e) => { e.stopPropagation(); setSize(k, z); },
    }, long ? SIZE_NAMES[z] : z)));
}

function buildWidget({ k, size }) {
  const el = RENDER[k](size);
  el.classList.add('widget', 'glass', `size-${size}`);
  el.dataset.k = k;
  const ctl = h('div', { class: 'wctl' });
  if (WIDGETS[k].sizes.length > 1) ctl.append(sizePicker(k, size));
  ctl.append(h('button', { class: 'wdel', 'aria-label': `Remove ${WIDGETS[k].name}`, onclick: () => removeWidget(k) }, '×'));
  el.append(ctl);
  return el;
}

// Dragging uses pointer events (not HTML drag and drop): the widget follows the
// pointer and the others move out of the way live, like the iOS home screen.
let drag = null;

function place(e) {
  drag.el.style.transform = `translate(${e.clientX - drag.offX - drag.base.left}px, ${e.clientY - drag.offY - drag.base.top}px) scale(1.04)`;
}
function startDrag(el, e) {
  const base = el.getBoundingClientRect();
  drag = { el, id: e.pointerId, offX: e.clientX - base.left, offY: e.clientY - base.top, base, last: null };
  el.classList.add('dragging');
  try { el.setPointerCapture(e.pointerId); } catch {}
  place(e);
}
function moveDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const { el } = drag;
  place(e);
  el.style.pointerEvents = 'none';
  const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('.widget');
  el.style.pointerEvents = '';
  // Only swap once per widget entered, so neighbours don't flip back and forth.
  if (!over || over === el) { drag.last = null; return; }
  if (over === drag.last) return;
  drag.last = over;
  const grid = $('#widgets');
  const kids = [...grid.children];
  grid.insertBefore(el, kids.indexOf(el) < kids.indexOf(over) ? over.nextSibling : over);
  // The grid reflowed: measure the new slot so the widget stays under the pointer.
  el.style.transform = 'none';
  drag.base = el.getBoundingClientRect();
  place(e);
}
function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  drag.el.classList.remove('dragging');
  drag.el.style.transform = '';
  S.layout = [...$('#widgets').children].map((c) => S.layout.find((w) => w.k === c.dataset.k));
  save();
  drag = null;
}

function renderWidgets() {
  focusViews.clear();
  $('#widgets').replaceChildren(...S.layout.map(buildWidget));
}

function setEditing(on) {
  editing = on;
  document.body.classList.toggle('editing', on);
  $('#doneEdit').hidden = !on;
  if (on) $('#panel').hidden = true;
}

// Press and hold a widget to start editing, then keep holding to drag it, like iOS.
// While editing, any widget can be dragged straight away.
let press = null;
const grid = $('#widgets');
grid.addEventListener('pointerdown', (e) => {
  const w = e.target.closest('.widget');
  if (!w || e.button !== 0) return;
  if (editing) {
    if (e.target.closest('.wctl')) return;
    e.preventDefault();
    startDrag(w, e);
    return;
  }
  if (e.target.closest('input, button')) return;
  press = { x: e.clientX, y: e.clientY, timer: setTimeout(() => { press = null; setEditing(true); startDrag(w, e); }, 500) };
});
grid.addEventListener('pointermove', (e) => {
  if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) { clearTimeout(press.timer); press = null; }
  moveDrag(e);
});
for (const t of ['pointerup', 'pointercancel']) grid.addEventListener(t, (e) => {
  if (press) { clearTimeout(press.timer); press = null; }
  endDrag(e);
});
// No browser drag of links or icons (that was the stray globe), and while editing,
// clicks only reach the size and remove buttons.
grid.addEventListener('dragstart', (e) => e.preventDefault());
grid.addEventListener('click', (e) => { if (editing && !e.target.closest('.wctl')) e.preventDefault(); }, true);
$('#doneEdit').addEventListener('click', () => setEditing(false));

// ---------- search ----------
$('#search').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $('#q').value.trim();
  if (!q) return;
  if (/^https?:\/\//i.test(q)) { location.href = q; return; }
  if (!/\s/.test(q) && /^[^.]+\.[^.]{2,}/.test(q)) { location.href = `https://${q}`; return; }
  if (hasChrome && chrome.search) chrome.search.query({ text: q, disposition: 'CURRENT_TAB' });
  else location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
});

// The glass bar shortcut can't inject into this page, so it focuses the search box instead.
if (hasChrome) chrome.runtime.onMessage.addListener((msg) => { if (msg.type === 'focus-search') $('#q').focus(); });

// ---------- settings panel ----------
function openWeatherSettings() {
  $('#panel').hidden = false;
  $('#gear').setAttribute('aria-expanded', true);
  $('#city').scrollIntoView({ block: 'center' });
  $('#city').focus();
}

// Chrome shows its normal location prompt for the new tab page; no manifest
// permission (and no install warning) needed. If finding you fails, the city you
// had stays, and the note says why.
const LOCATION_ERRORS = {
  1: 'Location is blocked. Allow it when Chrome asks, and check System Settings › Privacy & Security › Location Services is on for Chrome.',
  2: "Your computer couldn't work out where you are. Check Wi-Fi is on, then try again.",
  3: 'Finding your location took too long. Try again.',
};
async function useMyLocation() {
  const btn = $('#useLocation'), note = $('#locNote');
  if (S.useLocation) { // already on: tapping again turns it off
    S.useLocation = false;
    note.textContent = S.city ? `Showing ${S.city}.` : 'Type a city to see its weather.';
    update();
    renderWidgets();
    return;
  }
  btn.textContent = 'Finding you…';
  btn.disabled = true;
  note.textContent = '';
  try {
    let c;
    // Macs often fail the first quick try, so give it one more, slower one.
    try { c = await locate(); } catch (e) { if (e.code === 1) throw e; c = await locate({ maximumAge: 0, timeout: 30000 }); }
    S.coords = c;
    S.coordsName = await placeName(c);
    S.useLocation = true;
    S.city = '';
    note.textContent = S.coordsName ? `Found you in ${S.coordsName}.` : '';
    update();
    renderWidgets();
  } catch (e) {
    note.textContent = `${LOCATION_ERRORS[e.code] || "Couldn't get your location."}${S.city ? ` Still showing ${S.city}.` : ''}`;
    syncPanel();
  } finally {
    btn.disabled = false;
    syncPanel();
  }
}

function setQuoteMode(mode) {
  S.quote = mode;
  const i = S.layout.findIndex((w) => w.k === 'quote');
  if (mode === 'widget' && i < 0) S.layout.push({ k: 'quote', size: WIDGETS.quote.def });
  if (mode !== 'widget' && i >= 0) S.layout.splice(i, 1);
  update();
  renderWidgets();
}

// Customize > Widgets: each widget on its own row, with an on/off switch and its sizes.
function drawWidgetRows() {
  $('#widgetRows').replaceChildren(...Object.entries(WIDGETS).map(([key, w]) => {
    const placed = S.layout.find((x) => x.k === key);
    const toggle = () => {
      if (key === 'quote') { setQuoteMode(placed ? 'caption' : 'widget'); return; }
      if (placed) S.layout.splice(S.layout.indexOf(placed), 1);
      else S.layout.push({ k: key, size: w.def });
      update();
      renderWidgets();
    };
    return h('div', { class: `wrow${placed ? ' on' : ''}` },
      h('label', { class: 'toggle' }, h('input', { type: 'checkbox', ...(placed ? { checked: '' } : {}), onchange: toggle }), ` ${w.name}`),
      placed && w.sizes.length > 1 ? sizePicker(key, placed.size) : null);
  }));
}

function buildPanel() {
  $('#calSave').addEventListener('click', saveCalendarLinks);
  cacheGet('calLinks').then((l) => { if (l?.length) $('#calLinks').value = l.join('\n'); });
  $('#appearance').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { S.appearance = b.dataset.mode; update(); }));
  for (const [key, f] of Object.entries(FONTS)) {
    $('#fonts').append(h('button', { 'data-key': key, style: `font-family: ${f.stack.replaceAll('"', "'")}`, onclick: () => { S.clockFont = key; update(); } }, f.name));
  }
  $('#styles').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { S.clockStyle = b.dataset.style; update(); }));
  $('#quoteModes').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => setQuoteMode(b.dataset.mode)));

  const bind = (id, key, prop, cast = (v) => v) => $(id).addEventListener('input', (e) => { S[key] = cast(e.target[prop]); update(); });
  $('#motion').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    const fps = Number(b.dataset.fps);
    S.animated = fps > 0;
    if (fps) S.fps = fps;
    update();
  }));
  bind('#liquid', 'liquid', 'checked');
  bind('#solid', 'solidGlass', 'checked');
  bind('#hour24', 'hour24', 'checked');
  bind('#blur', 'blur', 'value', Number);
  bind('#tint', 'tint', 'value', Number);
  bind('#size', 'clockSize', 'value', Number);
  bind('#greetingOn', 'greeting', 'checked');
  bind('#greetingSize', 'greetingSize', 'value', Number);
  bind('#name', 'name', 'value', (v) => v.trim());
  $('#city').addEventListener('change', (e) => { S.city = e.target.value.trim(); S.useLocation = false; update(); renderWidgets(); });
  $('#units').addEventListener('change', (e) => { S.units = e.target.value; update(); renderWidgets(); });
  $('#useLocation').addEventListener('click', useMyLocation);
  $('#glassGoogle').addEventListener('change', (e) => setGlassGoogle(e.target.checked));
  if (hasChrome) ggIsOn().then((on) => { $('#glassGoogle').checked = on; });
  $('#editLayout').addEventListener('click', () => setEditing(true));

  const panel = $('#panel'), gear = $('#gear');
  const setOpen = (open) => { panel.hidden = !open; gear.setAttribute('aria-expanded', open); };
  gear.addEventListener('click', () => setOpen(panel.hidden));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (editing) setEditing(false);
    else setOpen(false);
  });
  document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target) && !gear.contains(e.target)) setOpen(false); });
}

// Wallpaper and clock color swatches depend on the mode, so rebuild them when it changes.
let swatchMode = '';
function buildSwatches() {
  const m = mode();
  if (m === swatchMode) return;
  swatchMode = m;
  const set = modeSet(m);
  $('#swatches').replaceChildren(...Object.entries(set.presets).map(([key, p]) => h('button', {
    'data-key': key, title: p.name, 'aria-label': p.name,
    style: p.tones ? `background: linear-gradient(135deg, ${p.tones.join(', ')})` : `background: conic-gradient(${p.c[0]}, ${p.c[1]}, ${p.c[2]}, ${p.c[0]})`,
    onclick: () => { S[modeSet().wpKey] = key; update(); },
  })));
  $('#clockColors').replaceChildren(...Object.entries(set.colors).map(([key, c]) => h('button', {
    'data-key': key, title: c.name, 'aria-label': `${c.name} clock`,
    style: `background: rgb(${c.rgb})`,
    onclick: () => { S[modeSet().colorKey] = key; update(); },
  })));
}

function syncPanel() {
  buildSwatches();
  const set = modeSet();
  const mark = (sel, active) => document.querySelectorAll(`${sel} button`).forEach((b) => b.classList.toggle('on', active(b)));
  mark('#swatches', (b) => b.dataset.key === S[set.wpKey]);
  mark('#clockColors', (b) => b.dataset.key === S[set.colorKey]);
  mark('#appearance', (b) => b.dataset.mode === S.appearance);
  mark('#fonts', (b) => b.dataset.key === S.clockFont);
  drawWidgetRows();
  mark('#styles', (b) => b.dataset.style === S.clockStyle);
  mark('#quoteModes', (b) => b.dataset.mode === S.quote);
  mark('#motion', (b) => Number(b.dataset.fps) === (S.animated ? S.fps : 0));
  $('#liquid').checked = S.liquid;
  $('#solid').checked = S.solidGlass;
  $('#hour24').checked = S.hour24;
  $('#blur').value = S.blur;
  $('#tint').value = S.tint;
  $('#size').value = S.clockSize;
  $('#greetingOn').checked = S.greeting;
  $('#greetingSize').value = S.greetingSize;
  if (document.activeElement !== $('#name')) $('#name').value = S.name;
  $('#city').value = S.city;
  $('#units').value = S.units;
  if (!$('#useLocation').disabled) $('#useLocation').textContent = S.useLocation ? `Using your location${S.coordsName ? ` (${S.coordsName})` : ''} · Turn off` : 'Use my location';
}

function update() {
  applyLook();
  syncPanel();
  updateClock();
  save();
}

function renderAll() {
  applyLook();
  syncPanel();
  updateClock();
  renderWidgets();
}

// ---------- init ----------
S = loadMirror();
buildPanel();
renderAll();
tick();

(async () => {
  focusState = freshFocus(await cacheGet('focus'));
  drawFocus();
  if (!hasChrome) return;
  const stored = migrate(await chrome.storage.sync.get(null));
  if (JSON.stringify(stored) !== JSON.stringify(S)) { S = stored; mirror(); renderAll(); }
  chrome.storage.sync.remove('widgets'); // replaced by "layout"

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.focus) { focusState = freshFocus(changes.focus.newValue); drawFocus(); }
    // Another tab changed settings. Ignore the echo of this tab's own recent save.
    if (area === 'sync' && Date.now() - lastSave > 1500) {
      const next = { ...S };
      for (const [k, { newValue }] of Object.entries(changes)) next[k] = newValue;
      const merged = migrate(next);
      if (JSON.stringify(merged) !== JSON.stringify(S)) { S = merged; mirror(); renderAll(); }
    }
  });
})();

// ---------- first-run tour ----------
// A short walk-through on the first new tab: each step lights up one part of the page
// with a glass card beside it. Shown once; "Take the tour" in Customize replays it.
const SHORTCUT = /Mac/i.test(navigator.platform) ? '⌘⇧K' : 'Ctrl+Shift+K';
const TOUR = [
  { title: 'Welcome to Glass Tab', text: 'A quick look around. It takes about 30 seconds.', next: 'Show me' },
  { el: '#search', title: 'Search', text: `Search Google or type a website here. On any other site, press ${SHORTCUT} to bring up the same glass search bar.` },
  { el: '#clock', title: 'Your clock', text: 'Give it clear or frosted glass, and pick its font, color and size in Customize. The greeting and quote can be changed or turned off there too.' },
  { el: '#widgets', title: 'Widgets', text: 'Press and hold any widget to move it. While editing, the S, M and L buttons change its size and × removes it.' },
  { el: '#gear', title: 'Customize', text: 'Wallpapers, light or dark, motion, glass, widgets, your calendar and weather all live here. You can also make your Google searches glass.' },
  { title: "You're all set", text: 'Make it yours. You can take this tour again any time from Customize.', next: 'Done' },
];
let tourStep = -1;
function startTour() {
  $('#panel').hidden = true;
  $('#gear').setAttribute('aria-expanded', 'false');
  setEditing(false);
  $('#footerTip').hidden = true;
  $('#tour').hidden = false;
  showTourStep(0);
}
function endTour() {
  $('#tour').hidden = true;
  tourStep = -1;
  try { localStorage.setItem('glassTabTour', '1'); } catch {}
  showFooterTip();
}
function showTourStep(i) {
  tourStep = i;
  const step = TOUR[i], ring = $('#tourRing'), card = $('#tourCard');
  const target = step.el && $(step.el);
  target?.scrollIntoView({ block: 'nearest' });
  const box = target && target.offsetHeight ? target.getBoundingClientRect() : null;
  const pad = 10;
  if (box) {
    const r = parseFloat(getComputedStyle(target).borderRadius) || 16;
    Object.assign(ring.style, { left: `${box.left - pad}px`, top: `${box.top - pad}px`, width: `${box.width + pad * 2}px`, height: `${box.height + pad * 2}px`, borderRadius: `${r + pad}px` });
  } else {
    Object.assign(ring.style, { left: '50%', top: '45%', width: '0px', height: '0px', borderRadius: '50%' });
  }
  $('#tourCount').textContent = `${i + 1} of ${TOUR.length}`;
  $('#tourTitle').textContent = step.title;
  $('#tourText').textContent = step.text;
  $('#tourNext').textContent = step.next || 'Next';
  $('#tourBack').hidden = i === 0;
  $('#tourSkip').hidden = i === TOUR.length - 1;
  // Card goes below the lit-up part if there's room, otherwise above; centered otherwise.
  const w = Math.min(340, innerWidth - 32);
  card.style.width = `${w}px`;
  const h = card.offsetHeight;
  let left = innerWidth / 2 - w / 2, top = innerHeight * 0.45 - h / 2;
  if (box) {
    left = Math.min(innerWidth - w - 16, Math.max(16, box.left + box.width / 2 - w / 2));
    top = box.bottom + pad + 14 + h < innerHeight ? box.bottom + pad + 14 : box.top - pad - 14 - h;
    top = Math.max(16, top);
  }
  Object.assign(card.style, { left: `${left}px`, top: `${top}px` });
  $('#tourNext').focus({ preventScroll: true });
}
$('#tourNext').addEventListener('click', () => (tourStep < TOUR.length - 1 ? showTourStep(tourStep + 1) : endTour()));
$('#tourBack').addEventListener('click', () => showTourStep(Math.max(0, tourStep - 1)));
$('#tourSkip').addEventListener('click', endTour);
$('#replayTour').addEventListener('click', startTour);
addEventListener('resize', () => { if (tourStep >= 0) showTourStep(tourStep); });
document.addEventListener('keydown', (e) => {
  if (tourStep < 0) return;
  if (e.key === 'Escape') endTour();
  if (e.key === 'ArrowRight') $('#tourNext').click();
  if (e.key === 'ArrowLeft' && tourStep > 0) showTourStep(tourStep - 1);
}, true);

// ---------- footer hint ----------
// Chrome adds its own footer to extension new tab pages. Show a one-time hint on
// how to hide it (after the tour); "Got it" dismisses it for good.
function showFooterTip() {
  try { if (!localStorage.getItem('glassTabFooterTip')) $('#footerTip').hidden = false; } catch {}
}
$('#footerTipClose').addEventListener('click', () => {
  $('#footerTip').hidden = true;
  try { localStorage.setItem('glassTabFooterTip', '1'); } catch {}
});
try {
  // Wait a moment so the widgets have drawn before the tour measures them.
  if (!localStorage.getItem('glassTabTour')) setTimeout(startTour, 600);
  else showFooterTip();
} catch {}
