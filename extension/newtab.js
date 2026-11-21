// Layered wave wallpapers: each band is one tone. Tones go from the bottom-left band
// to the top-right band, so the last tone sits next to the toolbar and is the base color.
function waves(name, tones) {
  return { name, tones, base: tones[tones.length - 1], c: [tones[1], tones[2], tones[3]] };
}
// Dunes are waves laid flat: sand bands, darkest at the bottom, the sky color at the top.
const dunes = (name, tones) => ({ ...waves(name, tones), scene: 'dunes' });
// Silk and Northern lights are drawn from a background color and three colors, like the
// glow wallpapers (so the same color picker works); Lava is a glow wallpaper that moves more.
const scene = (name, kind, base, c) => ({ name, scene: kind, base, c });

// Curated presets per mode, so every wallpaper blends into the toolbar.
const PRESETS = {
  ink:      waves('Ink',    ['#6c6c72', '#57575c', '#45454a', '#36363a', '#29292c', '#1e1e20', '#141415']),
  tide:     waves('Tide',   ['#4b7bb0', '#3d6797', '#30547d', '#244264', '#19314c', '#112337', '#0b1726']),
  velvet:   waves('Velvet', ['#e0488a', '#c23a76', '#9f2d61', '#7c214c', '#5a1738', '#3a0f25', '#200815']),
  dunes:    dunes('Dunes',  ['#c07a4a', '#9a5a36', '#764227', '#55301d', '#3a2115', '#24150e', '#140c08']),
  silk:     scene('Silk', 'silk', '#0b0614', ['#ff5ea8', '#7a3cff', '#20d4c4']),
  lights:   scene('Northern lights', 'lights', '#030914', ['#3de6aa', '#8a6bff', '#2f8cff']),
  lava:     scene('Lava', 'lava', '#14051d', ['#ff4f7b', '#ff9a3c', '#9646ff']),
  aurora:   { name: 'Aurora',   base: '#05080d', c: ['#12a4b8', '#6a30d8', '#1db87f'] },
  sunset:   { name: 'Sunset',   base: '#0e0707', c: ['#ff6a3d', '#c4195e', '#ffad42'] },
  neon:     { name: 'Neon',     base: '#07050f', c: ['#ff2e93', '#6200ff', '#00d9ff'] },
};
const LIGHT_PRESETS = {
  paper:   waves('Paper', ['#4a4a4a', '#6e6e6e', '#909090', '#b0b0b0', '#cbcbcb', '#e2e2e2', '#f6f6f6']),
  lake:    waves('Lake',  ['#3f5f7f', '#557593', '#6b8ba8', '#86a3bd', '#a1bad1', '#bccfe2', '#d9e5f1']),
  petal:   waves('Petal', ['#e97fab', '#ef96ba', '#f3acc9', '#f7c2d7', '#fad5e4', '#fce5ef', '#fef3f8']),
  dunes:   dunes('Dunes', ['#b9824b', '#cf9f66', '#dfbb88', '#ecd3ac', '#f3dfc0', '#f8ead6', '#fcf4ea']),
  silk:    scene('Silk', 'silk', '#f7f3fb', ['#ff8fbd', '#9d84ff', '#5fcfe0']),
  lights:  scene('Northern lights', 'lights', '#eef4fb', ['#2fc79a', '#8b78ff', '#4a9cff']),
  lava:    scene('Lava', 'lava', '#fdf0f3', ['#ff8fae', '#ffb877', '#b796ff']),
  mist:    { name: 'Mist',    base: '#edf1f9', c: ['#86aaff', '#c39bff', '#73d9e4'] },
  prism:   { name: 'Prism',   base: '#f4f2fb', c: ['#ff8ab5', '#78acff', '#8eeec4'] },
};
// Wallpapers that were retired, mapped to the closest current one. Dark and light keys
// never share a name, so one list covers both modes.
const RETIRED = {
  ember: 'sunset', dusk: 'neon', forest: 'aurora', dawn: 'prism', sky: 'mist', lilac: 'prism', sage: 'mist',
  midnight: 'aurora', rose: 'neon', lagoon: 'aurora', graphite: 'ink',
  blossom: 'petal', sorbet: 'prism', coast: 'mist', citrus: 'prism', pearl: 'paper',
};

// Layered wallpapers (waves, dunes, silk, northern lights) are drawn as SVG: a background
// color plus layers. Still, they're one picture; moving, each layer is its own picture
// that only slides (never redrawn), so motion is cheap for the GPU.
const isDark = (hex) => parseInt(hex.slice(1, 3), 16) * 0.3 + parseInt(hex.slice(3, 5), 16) * 0.59 + parseInt(hex.slice(5, 7), 16) * 0.11 < 110;
const svgOf = (defs, inner, wrap = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>`
  + (wrap ? `<g transform="${wrap}">${inner}</g>` : inner) + '</svg>';
// Each band casts a soft shadow on the one below it and has a faint light rim, like
// layered paper. Waves run diagonally; dunes lie flat, with longer, lazier swells.
function bandParts(tones, flat) {
  const n = tones.length, span = (flat ? 1000 : 1900) / n;
  // On dark wallpapers shadows need to be deeper and rims fainter to read the same.
  const dark = isDark(tones[n - 1]);
  const rim = dark ? '.09' : '.22', shade = dark ? '.6' : '.32';
  const layers = [];
  for (let i = 1; i < n; i++) {
    const y0 = flat ? 1080 - i * span : 1450 - i * span, ph = i * 1.7;
    const pts = [];
    for (let x = -800; x <= 2400; x += 12) {
      const y = flat
        ? y0 + 55 * Math.sin(x / 230 + ph) + 22 * Math.sin(x / 91 + ph * 2.3) + 8 * Math.sin(x / 37 + ph)
        : y0 + 90 * Math.sin(x / 110 + ph) + 30 * Math.sin(x / 47 + ph * 2.3);
      pts.push(`${x} ${y.toFixed(1)}`);
    }
    layers.push(`<path d="M-800 -900L${pts.join('L')}L2400 -900Z" fill="${tones[i]}" filter="url(#s)" stroke="rgba(255,255,255,${rim})" stroke-width="3"/>`);
  }
  const defs = `<filter id="s" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="${flat ? 0 : -8}" dy="16" stdDeviation="16" flood-color="#000" flood-opacity="${shade}"/></filter>`;
  return { bg: tones[0], defs, layers, wrap: flat ? '' : 'rotate(30 800 500)' };
}
// Silk: wide ribbons that ripple across the page, each blending from one color to the next.
function silkParts(base, c) {
  const dark = isDark(base), pairs = [[0, 1], [1, 2], [2, 0], [0, 2]];
  const defs = pairs.map(([a, b], i) => `<linearGradient id="g${i}" x1="0" x2="1"><stop offset="0" stop-color="${c[a]}"/><stop offset="1" stop-color="${c[b]}"/></linearGradient>`).join('');
  const layers = pairs.map((_, i) => {
    const top = [], bot = [];
    for (let x = -500; x <= 2100; x += 20) {
      const y = 120 + i * 210 + 120 * Math.sin(x / 330 + i * 1.7) + 30 * Math.sin(x / 140 + i);
      top.push(`${x} ${y.toFixed(1)}`);
      bot.unshift(`${x} ${(y + 130 + 70 * Math.sin(x / 210 + i * 2.1)).toFixed(1)}`);
    }
    return `<path d="M${top.join('L')}L${bot.join('L')}Z" fill="url(#g${i})" opacity="${dark ? 0.8 : 0.7}"/>`;
  });
  return { bg: base, defs, layers, blend: dark ? 'screen' : 'multiply' };
}
// Northern lights: soft curtains of light, brightest along their wavy lower edge and
// fading upward, in three colors.
function lightsParts(base, c) {
  const dark = isDark(base);
  const defs = '<filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>'
    + c.map((col, i) => `<linearGradient id="l${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity="0"/><stop offset=".72" stop-color="${col}" stop-opacity="${dark ? 0.5 : 0.35}"/><stop offset=".93" stop-color="${col}" stop-opacity="${dark ? 0.95 : 0.7}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient>`).join('');
  const layers = c.map((_, i) => {
    let rays = '';
    for (let x = -400; x <= 2000; x += 14) {
      const b = (Math.sin(x / 70 + i * 2) + Math.sin(x / 29 + i) + 2) / 4;
      const bottom = 560 + i * 80 + 120 * Math.sin(x / 260 + i * 1.3);
      const len = 300 + 280 * b;
      rays += `<rect x="${x}" y="${(bottom - len).toFixed(0)}" width="16" height="${len.toFixed(0)}" fill="url(#l${i})" opacity="${(0.35 + 0.65 * b).toFixed(2)}"/>`;
    }
    return `<g filter="url(#b)">${rays}</g>`;
  });
  return { bg: base, defs, layers, blend: dark ? 'screen' : 'multiply' };
}
function sceneParts(p) {
  if (p.tones) return bandParts(p.tones, p.scene === 'dunes');
  if (p.scene === 'silk') return silkParts(p.base, p.c);
  if (p.scene === 'lights') return lightsParts(p.base, p.c);
  return null; // glow wallpapers (and Lava) are the blurred blobs
}
const layered = (p) => !!(p.tones || p.scene === 'silk' || p.scene === 'lights');
// The still picture, as an SVG data URL (also Glass Google's background and the swatch).
const waveCache = {};
function waveURL(p) {
  const key = JSON.stringify([p.tones, p.scene, p.base, p.c]);
  if (waveCache[key]) return waveCache[key];
  // Dragging a color picker makes a new picture per step; keep only recent ones.
  const keys = Object.keys(waveCache);
  if (keys.length > 12) delete waveCache[keys[0]];
  const { bg, defs, layers, wrap, blend } = sceneParts(p);
  const inner = `<rect x="-800" y="-900" width="3200" height="2800" fill="${bg}"/>`
    + (blend ? `<g style="mix-blend-mode:${blend}">${layers.join('')}</g>` : layers.join(''));
  return (waveCache[key] = `url("data:image/svg+xml,${encodeURIComponent(svgOf(defs, inner, wrap))}")`);
}
// Moving: each layer is its own picture that stepMotion slides at its own pace.
let waveKey = '', sceneKind = '', lava = false;
function drawWaves(p) {
  const key = p ? JSON.stringify([p.tones, p.scene, p.base, p.c]) : '';
  if (key === waveKey) return;
  waveKey = key;
  sceneKind = p ? p.scene || 'waves' : '';
  if (!p) { $('#waves').replaceChildren(); return; }
  const { bg, defs, layers, wrap, blend } = sceneParts(p);
  $('#waves').innerHTML = layers.map((l) => svgOf(defs, l, wrap)).join('');
  $('#waves').style.background = bg;
  $('#waves').style.setProperty('--layer-blend', blend || 'normal');
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

// Clock colors the user adds are kept as hex ('#rrggbb'); a clock color key is either a
// preset's name or one of those.
const HEX = /^#[0-9a-f]{6}$/i;
const MAX_CLOCK_CUSTOM = 8;
const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');

// Sizes: S = 1 cell, M = 2 cells wide, L = 2 x 2 cells, XL = 2 x 3 cells.
// A widget only offers sizes where it shows something different:
//   Weather  S now · M + 3 days · L + details, hourly and 5 days
//   To-do    S a short list · M a few tasks · L most lists · XL long lists
//   Focus    S timer only · M + length controls and today's count
//   Top sites S 4 icons · M 4 with names · L up to 12 with names
//   Recent tabs and Quote: M and L (they need the width for text)
//   Notes    S to XL, like the to-do list
//   Countdown S days left · M + the date and hours
//   Calendar S next event · M next few · L the coming week
const SIZE_NAMES = { S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra large' };

// A tidy arrangement for a set of widgets. The grid is four columns and fills row by
// row, so it's built from blocks with no holes: a Large (left half, two rows) with two
// Mediums stacked beside it, two Larges side by side, or two Mediums in a row. List
// widgets get the Large spots, everything else is Medium. Just enough Larges shrink to
// Medium for every block (and the last row) to come out full.
const TIDY_BIG = ['todo', 'calendar', 'notes'];
const TIDY_ORDER = ['todo', 'weather', 'calendar', 'sites', 'notes', 'focus', 'countdown', 'recent', 'quote'];
function tidyLayout(keys) {
  const sorted = TIDY_ORDER.filter((k) => keys.includes(k));
  let big = sorted.filter((k) => TIDY_BIG.includes(k));
  const nSmall = sorted.length - big.length;
  // d = how many Larges to shrink: the fewest that work, preferring a full last row.
  const works = (d) => (big.length - d) % 2 === 0 || nSmall + d >= 2;
  const options = [...Array(big.length + 1).keys()].filter(works);
  const d = options.find((x) => (nSmall + x) % 2 === 0) ?? options[0];
  big = big.slice(0, big.length - d);
  const small = sorted.filter((k) => !big.includes(k));
  const L = (k) => ({ k, size: 'L' }), M = (k) => ({ k, size: 'M' });
  const out = [];
  if (big.length % 2) out.push(L(big.shift()), M(small.shift()), M(small.shift()));
  while (big.length) out.push(L(big.shift()), L(big.shift()));
  out.push(...small.map(M));
  return out;
}
// Turning a widget on or off: a layout that's still tidy stays tidy; one the user has
// arranged by hand only gains (or loses) that widget.
function setWidgetOn(k, on) {
  const keys = S.layout.map((w) => w.k);
  if (on === keys.includes(k)) return;
  const tidy = JSON.stringify(S.layout) === JSON.stringify(tidyLayout(keys));
  const next = on ? [...keys, k] : keys.filter((x) => x !== k);
  if (tidy) S.layout = tidyLayout(next);
  else if (on) S.layout.push({ k, size: WIDGETS[k].def });
  else S.layout = S.layout.filter((w) => w.k !== k);
}
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
  wallpaper: 'lights', wallpaperLight: 'silk', animated: true, fps: 60, speed: 1, topBar: 'chrome',
  blur: 18, tint: 10, liquid: true, solidGlass: false,
  clockStyle: 'clear', clockFont: 'tall', clockSize: 140, clockColor: 'white', clockColorLight: 'ink', hour24: false,
  name: '', greeting: true, greetingSize: 22,
  quote: 'caption', // 'off' | 'caption' | 'widget'
  layout: [{ k: 'todo', size: 'L' }, { k: 'weather', size: 'M' }, { k: 'sites', size: 'M' }], // = tidyLayout of these three
  city: '', units: 'c', useLocation: false, coords: null, coordsName: '',
  todos: [], focusMinutes: 30, notes: '', countdown: { title: '', date: '' },
  wpColors: {}, // wallpaper key -> { from, to } for waves, { base, c: [3] } for glows (see wpColorKey)
  clockCustom: { dark: [], light: [] }, // clock colors the user added, per mode, as '#rrggbb'
  pins: [], // sites the user pinned to Top sites: [{ url, title }]
  glassGoogle: false, // turned on on any computer; Chrome's permission for it is per computer
};
// Where "Share an idea" and the page after uninstalling go. Keep in step with background.js.
const FEEDBACK_URL = 'https://github.com/KamaldeepGhotra/glass-tab/issues/new';
const STORE_REVIEWS = 'https://chromewebstore.google.com/detail/fhjfmkjhchflbbgklhabbgomnkadcmlp/reviews';

const $ = (s) => document.querySelector(s);
const hasChrome = typeof chrome !== 'undefined' && !!chrome.storage;
let S;
let editing = false;

// ---------- storage ----------
// Settings live in chrome.storage.sync. A copy in localStorage lets the page draw
// instantly with the right look, before the async sync storage answers.
function migrate(raw) {
  const s = { ...raw };
  // A setting removed from sync (cleared in Chrome) comes back as undefined: use the default.
  for (const k of Object.keys(s)) if (s[k] === undefined) delete s[k];
  if (!s.layout && Array.isArray(s.widgets)) {
    s.layout = s.widgets.filter((k) => k !== 'quote' && WIDGETS[k]).map((k) => ({ k, size: WIDGETS[k].def }));
    if (s.widgets.includes('quote')) { s.quote = 'widget'; s.layout.push({ k: 'quote', size: 'M' }); }
  }
  delete s.widgets;
  // The defaults changed in 1.0.7. People still on the old ones move to the new ones once;
  // anyone who picked another wallpaper keeps theirs.
  if (!s.defaults107) {
    if (s.wallpaper === 'aurora') s.wallpaper = DEFAULTS.wallpaper;
    if (s.wallpaperLight === 'mist') s.wallpaperLight = DEFAULTS.wallpaperLight;
    s.defaults107 = true;
  }
  for (const k of ['wallpaper', 'wallpaperLight']) if (RETIRED[s[k]]) s[k] = RETIRED[s[k]];
  const merged = { ...DEFAULTS, ...s };
  const hexes = (a) => (Array.isArray(a) ? a.filter((x) => HEX.test(x)).slice(0, MAX_CLOCK_CUSTOM) : []);
  merged.clockCustom = { dark: hexes(merged.clockCustom?.dark), light: hexes(merged.clockCustom?.light) };
  merged.speed = Math.min(3, Math.max(0.25, Number(merged.speed) || 1));
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

// Your own wallpaper photo. It stays on this computer: chrome.storage.local holds it, and
// a copy in localStorage lets boot.js draw it before anything else loads. Never synced.
let photo = null; // { thumb, base, c: [3] }
let photoData = '';  // the picture itself, as a data URL
try { photo = JSON.parse(localStorage.getItem('glassTabPhoto') || 'null'); photoData = localStorage.getItem('glassTabPhotoData') || ''; } catch {}
if (!photoData) photo = null;
function mirrorPhoto() {
  try {
    if (!photo) { localStorage.removeItem('glassTabPhoto'); localStorage.removeItem('glassTabPhotoData'); return; }
    localStorage.setItem('glassTabPhoto', JSON.stringify(photo));
    localStorage.setItem('glassTabPhotoData', photoData);
  } catch { try { localStorage.removeItem('glassTabPhotoData'); } catch {} } // too big for the copy: it loads a moment later instead
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

// ---------- undo toast ----------
// After deleting something, a short glass note with Undo shows for six seconds.
let toastTimer = 0, toastUndo = null, toastKind = '';
function toast(text, undo, kind = '') {
  clearTimeout(toastTimer);
  toastUndo = undo;
  toastKind = kind;
  $('#toastText').textContent = text;
  $('#toastUndo').hidden = !undo;
  $('#toast').hidden = false;
  toastTimer = setTimeout(closeToast, 6000);
}
function closeToast() {
  clearTimeout(toastTimer);
  toastUndo = null;
  toastKind = '';
  $('#toast').hidden = true;
}
$('#toastUndo').addEventListener('click', () => { const undo = toastUndo; closeToast(); undo?.(); });

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
    ? { mode: 'light', presets: LIGHT_PRESETS, wpKey: 'wallpaperLight', colors: LIGHT_CLOCK_COLORS, colorKey: 'clockColorLight' }
    : { mode: 'dark', presets: PRESETS, wpKey: 'wallpaper', colors: CLOCK_COLORS, colorKey: 'clockColor' };
}
// "Match wallpaper": the most colorful of the wallpaper's colors, lifted toward white in
// dark mode and deepened toward ink in light mode, so the clock stays readable.
function matchRgb(m) {
  const p = presetFor(m);
  const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const vivid = p.c.map(rgbOf).sort((a, b) => (Math.max(...b) - Math.min(...b)) - (Math.max(...a) - Math.min(...a)))[0];
  // Start at a gentle mix, then go further only if the color is still hard to read.
  const light = m === 'light', to = light ? [29, 29, 31] : [255, 255, 255];
  const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
  let mix = vivid;
  for (let amount = light ? 0.45 : 0.5; amount <= 0.9; amount += 0.05) {
    mix = vivid.map((v, i) => Math.round(v + (to[i] - v) * amount));
    if (light ? lum(mix) <= 110 : lum(mix) >= 150) break;
  }
  return mix.join(', ');
}
// The clock color for a mode: a preset, one the user added, or matched to the wallpaper.
function clockRgb(m) {
  const set = modeSet(m), key = S[set.colorKey];
  if (key === 'match') return matchRgb(m);
  if (HEX.test(key)) return hexRgb(key);
  return (set.colors[key] || Object.values(set.colors)[0]).rgb;
}
// The saved wallpaper key for a mode (the first one if the saved key is unknown).
function wallpaperKey(m) {
  const set = modeSet(m);
  // "photo" synced from another computer, where the photo isn't: use the default.
  if (S[set.wpKey] === 'photo') return photo ? 'photo' : DEFAULTS[set.wpKey];
  return set.presets[S[set.wpKey]] ? S[set.wpKey] : Object.keys(set.presets)[0];
}
// Blends two colors into n tones, front to back, for a wave wallpaper.
function ramp(from, to, n) {
  const rgb = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
  const a = rgb(from), b = rgb(to);
  return Array.from({ length: n }, (_, i) => `#${a.map((v, j) => Math.round(v + (b[j] - v) * i / (n - 1)).toString(16).padStart(2, '0')).join('')}`);
}
// Where a wallpaper's own colors are saved. Wallpapers in both modes (like Dunes) keep
// separate colors per mode, so light mode's are saved as "light:dunes".
const wpColorKey = (m, key) => (m === 'light' && PRESETS[key] ? `light:${key}` : key);
// A wallpaper with the user's own colors, if they changed them in Customize.
function presetOf(m, key) {
  if (key === 'photo' && photo) return { name: 'Your photo', base: photo.base, c: photo.c, photo: true };
  const p = modeSet(m).presets[key], o = S.wpColors?.[wpColorKey(m, key)];
  if (!o) return p;
  if (p.tones && o.from && o.to) return { ...waves(p.name, ramp(o.from, o.to, p.tones.length)), scene: p.scene };
  if (!p.tones && o.base && o.c?.length === 3) return { ...p, base: o.base, c: o.c };
  return p;
}
function presetFor(m) {
  return presetOf(m, wallpaperKey(m));
}
// The top of the page fades into Chrome's toolbar. Without a theme that's Chrome's
// own charcoal or pale gray (switching with the system); with one of the Glass Tab
// themes it's their navy or white.
const TOP_BAR = { chrome: { dark: '#282828', light: '#eef2f9' }, theme: { dark: '#161a26', light: '#ffffff' } };
function varsFor(m) {
  const set = modeSet(m), p = presetFor(m);
  const f = FONTS[S.clockFont] || FONTS.tall;
  // Thin strokes leave no surface to show glass, so glass styles get a heavier weight.
  const weight = S.clockStyle !== 'solid' && f.weight < 400 ? 400 : f.weight;
  return {
    '--base': p.base, '--c1': p.c[0], '--c2': p.c[1], '--c3': p.c[2], '--bar': (TOP_BAR[S.topBar] || TOP_BAR.chrome)[m],
    '--wave': layered(p) ? waveURL(p) : 'none', '--blob-display': layered(p) || p.photo ? 'none' : 'block', '--photo-display': p.photo ? 'block' : 'none',
    '--blur': `${S.blur}px`, '--tint': String(S.tint / 100),
    '--clock-font': f.stack, '--clock-weight': String(weight), '--clock-size': `${S.clockSize}px`, '--greeting-size': `${S.greetingSize}px`,
    '--clock-rgb': clockRgb(m),
  };
}

function applyLook() {
  const m = mode();
  // "animated" means the wallpaper is really moving: off with Reduce motion too, so widgets get liquid glass.
  const base = [moving() && 'animated', S.liquid && 'liquid', S.solidGlass && 'solid'].filter(Boolean).join(' ');
  const root = document.documentElement;
  for (const [k, v] of Object.entries(varsFor(m))) root.style.setProperty(k, v);
  // The photo is large, so it's set only when it changes.
  if (photoShown !== photoData) { photoShown = photoData; root.style.setProperty('--photo', photoData ? `url("${photoData}")` : 'none'); }
  root.className = `${base}${m === 'light' ? ' light' : ''}`;
  $('#clock').className = `${S.clockStyle}${(FONTS[S.clockFont] || FONTS.tall).variable ? ' rim' : ''}`;
  const p = presetFor(m);
  drawWaves(moving() && layered(p) ? p : null);
  lava = p.scene === 'lava';
  updateMotion();
  // boot.js applies this before the next page draws, for whichever mode is active then.
  try {
    localStorage.setItem('glassTabLook', JSON.stringify({ auto: S.appearance === 'auto', mode: m, cls: base, vars: { dark: varsFor('dark'), light: varsFor('light') } }));
  } catch {}
  // Shared with the Glass Google content script, which picks the mode Google is in.
  const pd = presetFor('dark'), pl = presetFor('light');
  const wave = (p) => (layered(p) ? waveURL(p) : null);
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
// The wallpaper's own clock, in seconds. It runs at the speed the user picked, and only
// moves forward by the time since the last frame, so changing the speed never makes the
// wallpaper jump (and a long sleep doesn't either).
let motionClock = performance.now() / 1000, lastStep = 0;
function stepMotion(now) {
  if (lastStep) motionClock += Math.min(now - lastStep, 250) / 1000 * S.speed;
  lastStep = now;
  const t = motionClock, TAU = 2 * Math.PI;
  // Blobs drift out and back. Lava's wander much further, each on its own loop, so they
  // melt into one another and pull apart.
  blobs.forEach(([el, sec], i) => {
    if (lava) {
      const a = TAU * t / (sec * 0.8);
      el.style.transform = `translate(${14 * Math.sin(a + i)}vmax, ${10 * Math.sin(a * 1.37 + i * 2)}vmax) scale(${1 + 0.22 * Math.sin(a * 0.71 + i)})`;
      return;
    }
    const d = (1 - Math.cos(TAU * t / sec)) / 2;
    el.style.transform = `translate(${6 * d}vmax, ${-4 * d}vmax) scale(${1 + 0.12 * d})`;
  });
  // Layers slide back and forth, each at its own pace (seconds per sweep, start offset).
  document.querySelectorAll('#waves svg').forEach((el, i) => {
    if (sceneKind === 'dunes') {
      // Far bands (near the top) drift slower, like distant hills.
      const v = Math.sin(TAU * t / (16 + i * 3) + i);
      el.style.transform = `translateX(${(7 - i * 0.7) * v}vmax)`;
    } else if (sceneKind === 'silk') {
      const sec = 22 + i * 5;
      el.style.transform = `translate(${7 * Math.sin(TAU * t / sec + i)}vmax, ${2.5 * Math.sin(TAU * t / (sec * 1.4) + i * 2)}vmax)`;
    } else if (sceneKind === 'lights') {
      // Curtains sway sideways and slowly stretch and shrink, like they're breathing.
      const sec = 16 + i * 5;
      el.style.transform = `translateX(${4 * Math.sin(TAU * t / sec + i * 2)}vmax) scaleY(${1 + 0.12 * Math.sin(TAU * t / (sec * 0.7) + i)})`;
    } else {
      const [sec, start] = (i + 1) % 3 === 0 ? [20, 9] : (i + 1) % 2 === 0 ? [16, 5] : [12, 0];
      const v = -Math.cos(Math.PI * (t + start) / sec);
      el.style.transform = `translate(${4.3 * v}vmax, ${2.5 * v}vmax)`;
    }
  });
}
function updateMotion() {
  clearTimeout(motionTimer);
  motionTimer = 0;
  lastStep = 0;
  if (moving()) scheduleMotion();
  else for (const [el] of blobs) el.style.transform = '';
}
let lastLook = '', photoShown = null;

// ---------- glass Google search (helpers in gg.js) ----------
async function setGlassGoogle(on, opts) {
  const box = $('#glassGoogle');
  if (!hasChrome) { box.checked = false; return; }
  try {
    if (on) {
      // ggTurnOn shows Chrome's prompt, so it must run straight from the click.
      if (await ggTurnOn(opts)) $('#googleNote').textContent = 'On. Reload any open Google search tabs to see it.';
    } else {
      await ggTurnOff();
    }
  } catch (err) {
    $('#googleNote').textContent = `Couldn't turn this on: ${err.message}`;
  }
  box.checked = googleOn = await ggIsOn();
  ggState = on ? (googleOn ? 'on' : ggState) : 'off';
  // Synced, so another computer can offer to turn it on there too.
  if (S.glassGoogle !== googleOn) { S.glassGoogle = googleOn; save(); }
  if (googleOn) $('#ggNudge').hidden = true;
  syncPanel();
  return googleOn;
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
    if (!S.coordsName) { S.coordsName = await placeName(S.coords); save(); }
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
    if (!cached || Date.now() - cached.at > 30 * 60e3 || !S.coordsName) await refreshCoords();
  }
  const key = `v4|${here ? `${S.coords.lat.toFixed(2)},${S.coords.lon.toFixed(2)},${S.coordsName}` : S.city}|${S.units}`;
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
    + '&hourly=temperature_2m,weather_code,precipitation_probability&forecast_hours=25'
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
    hours: j.hourly.time.slice(1).map((t, i) => ({ t, temp: j.hourly.temperature_2m[i + 1], code: j.hourly.weather_code[i + 1], rain: j.hourly.precipitation_probability?.[i + 1] })),
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
        // Large: current details, the next 24 hours (scroll sideways) and five days.
        const hour = (t) => new Date(t).toLocaleTimeString(undefined, { hour: 'numeric' });
        const hours = h('div', { class: 'wx-strip wx-hours', 'aria-label': 'Next 24 hours' }, ...d.hours.map((x) => h('div', {},
          h('span', { class: 'muted' }, hour(x.t)), h('b', {}, wxIcon(x.code)), h('span', {}, deg(x.temp)),
          h('span', { class: 'wx-rain' }, x.rain >= 20 ? `${x.rain}%` : ''))));
        // A mouse wheel scrolls the hours sideways.
        hours.addEventListener('wheel', (e) => {
          if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
          e.preventDefault();
          hours.scrollLeft += e.deltaY;
        }, { passive: false });
        body.className = 'wx wx-l';
        body.replaceChildren(
          h('div', { class: 'wx-now' }, now, h('div', { class: 'wx-facts' },
            h('span', {}, `Feels like ${deg(d.feels)}`),
            h('span', {}, `Humidity ${Math.round(d.humidity)}%`),
            h('span', {}, `Wind ${Math.round(d.wind)} ${d.windUnit}`),
            h('span', {}, `High ${deg(d.days[0].max)} · Low ${deg(d.days[0].min)}`))),
          hours,
          h('div', { class: 'wx-strip' }, ...d.days.map((x, i) => h('div', {}, h('span', { class: 'muted' }, day(x.t, i)), h('b', {}, wxIcon(x.code)), h('span', {}, `${deg(x.max)} ${deg(x.min)}`)))),
        );
      })
      .catch(() => { body.textContent = "Couldn't load weather. Check the city name."; });
  }
  return h('div', {}, h('h3', {}, 'Weather'), body);
}

// Chrome's synced storage allows 8 KB per setting, so lists and notes are capped to fit.
const TODO_MAX = 50, NOTES_MAX = 6000;

// ---------- to-do sync ----------
// Optional: the to-do widget can show a list from Todoist, Microsoft To Do or Google
// Tasks instead of the list kept in Chrome. Sign-in details and the copy of the tasks
// stay on this computer (chrome.storage.local); none of it goes into synced settings.
// Changes show at once and are sent to the service in the background.
//
// Microsoft and Google sign in through Chrome's sign-in window (chrome.identity) with
// Glass Tab's own app registration; their client IDs go in SYNC_CLIENT_IDS. A service
// whose ID is empty isn't offered. See docs/todo-sync.md.
const SYNC_CLIENT_IDS = { microsoft: '', google: '544432589627-msj23kilqev2gkv59cjf64b6i5gqirpj.apps.googleusercontent.com' };

const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const randomString = () => b64url(crypto.getRandomValues(new Uint8Array(32)));
const syncError = (status, msg) => Object.assign(new Error(msg || `The service answered ${status}`), { status });
async function jsonFetch(url, { method = 'GET', body, form, token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  if (form) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  const r = await fetch(url, { method, headers, body: form ? new URLSearchParams(form) : body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw syncError(r.status);
  return r.status === 204 ? null : r.json().catch(() => null);
}
// Opens Chrome's sign-in window and returns the page it came back to.
// Closing the window, or a quiet sign-in that needs the user, counts as "not signed in".
async function webAuth(url, interactive) {
  let back;
  try { back = await chrome.identity.launchWebAuthFlow({ url, interactive }); } catch (e) { throw syncError(401, e.message); }
  if (!back) throw syncError(401, 'Sign-in was closed');
  return new URL(back);
}

// Each service: how to sign in, keep the sign-in fresh, and work with one list.
// tasks() returns the list's open, top-level tasks in the service's own order.
const SYNC = {
  todoist: {
    name: 'Todoist',
    origins: ['https://api.todoist.com/*'],
    api: 'https://api.todoist.com/api/v1',
    async signIn(token) { return { token }; },
    async token(auth) { return auth.token; },
    async pages(path) {
      const out = [];
      let cursor = null;
      for (let i = 0; i < 5; i++) {
        const r = await syncFetch(`${this.api}${path}${path.includes('?') ? '&' : '?'}limit=200${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
        out.push(...r.results);
        cursor = r.next_cursor;
        if (!cursor) break;
      }
      return out;
    },
    async lists() {
      return (await this.pages('/projects')).filter((p) => !p.is_archived && !p.is_deleted)
        .map((p) => ({ id: p.id, name: p.name, main: !!p.inbox_project }));
    },
    async tasks(list) {
      return (await this.pages(`/tasks?project_id=${encodeURIComponent(list)}`))
        .filter((t) => !t.parent_id && !t.checked && !t.is_deleted)
        .sort((a, b) => a.child_order - b.child_order).map((t) => ({ id: t.id, text: t.content }));
    },
    async add(list, text) { return (await syncFetch(`${this.api}/tasks`, { method: 'POST', body: { content: text, project_id: list } })).id; },
    done(list, id, done) { return syncFetch(`${this.api}/tasks/${id}/${done ? 'close' : 'reopen'}`, { method: 'POST' }); },
    edit(list, id, text) { return syncFetch(`${this.api}/tasks/${id}`, { method: 'POST', body: { content: text } }); },
    remove(list, id) { return syncFetch(`${this.api}/tasks/${id}`, { method: 'DELETE' }); },
  },

  // Microsoft To Do through Microsoft Graph. Sign-in uses the code flow with PKCE;
  // the refresh token keeps it signed in, and a quiet sign-in covers it if that lapses.
  microsoft: {
    name: 'Microsoft To Do',
    origins: ['https://graph.microsoft.com/*', 'https://login.microsoftonline.com/*'],
    api: 'https://graph.microsoft.com/v1.0/me/todo',
    login: 'https://login.microsoftonline.com/common/oauth2/v2.0',
    scope: 'Tasks.ReadWrite offline_access',
    async signIn(_, interactive = true) {
      const verifier = randomString(), state = randomString();
      const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
      const redirect = chrome.identity.getRedirectURL('microsoft');
      const q = new URLSearchParams({ client_id: SYNC_CLIENT_IDS.microsoft, response_type: 'code', redirect_uri: redirect, scope: this.scope,
        code_challenge: challenge, code_challenge_method: 'S256', state, ...(interactive ? { prompt: 'select_account' } : { prompt: 'none' }) });
      const back = await webAuth(`${this.login}/authorize?${q}`, interactive);
      if (back.searchParams.get('state') !== state || !back.searchParams.get('code')) throw syncError(401, back.searchParams.get('error_description') || 'Sign-in failed');
      return this.tokens({ grant_type: 'authorization_code', code: back.searchParams.get('code'), redirect_uri: redirect, code_verifier: verifier });
    },
    async tokens(grant) {
      const r = await jsonFetch(`${this.login}/token`, { method: 'POST', form: { client_id: SYNC_CLIENT_IDS.microsoft, scope: this.scope, ...grant } });
      return { access: r.access_token, refresh: r.refresh_token || grant.refresh_token, expires: Date.now() + (r.expires_in - 60) * 1000 };
    },
    async token(auth, force) {
      if (!force && auth.access && Date.now() < auth.expires) return auth.access;
      let next;
      try { next = await this.tokens({ grant_type: 'refresh_token', refresh_token: auth.refresh }); } catch { next = await this.signIn(null, false); }
      Object.assign(auth, next);
      saveSyncConfig();
      return auth.access;
    },
    async pages(url) {
      const out = [];
      for (let i = 0; url && i < 10; i++) { const r = await syncFetch(url); out.push(...r.value); url = r['@odata.nextLink']; }
      return out;
    },
    async lists() {
      return (await this.pages(`${this.api}/lists`)).map((l) => ({ id: l.id, name: l.displayName, main: l.wellknownListName === 'defaultList' }));
    },
    async tasks(list) {
      return (await this.pages(`${this.api}/lists/${list}/tasks?$filter=${encodeURIComponent("status ne 'completed'")}&$top=100`))
        .map((t) => ({ id: t.id, text: t.title }));
    },
    async add(list, text) { return (await syncFetch(`${this.api}/lists/${list}/tasks`, { method: 'POST', body: { title: text } })).id; },
    done(list, id, done) { return syncFetch(`${this.api}/lists/${list}/tasks/${id}`, { method: 'PATCH', body: { status: done ? 'completed' : 'notStarted' } }); },
    edit(list, id, text) { return syncFetch(`${this.api}/lists/${list}/tasks/${id}`, { method: 'PATCH', body: { title: text } }); },
    remove(list, id) { return syncFetch(`${this.api}/lists/${list}/tasks/${id}`, { method: 'DELETE' }); },
  },

  // Google Tasks. Google's sign-in gives an access token for an hour; after that a quiet
  // sign-in gets a new one without showing anything, while the user is signed in to Google.
  google: {
    name: 'Google Tasks',
    origins: ['https://tasks.googleapis.com/*'],
    api: 'https://tasks.googleapis.com/tasks/v1',
    scope: 'https://www.googleapis.com/auth/tasks',
    async signIn(_, interactive = true) {
      const state = randomString();
      const q = new URLSearchParams({ client_id: SYNC_CLIENT_IDS.google, response_type: 'token', redirect_uri: chrome.identity.getRedirectURL('google'),
        scope: this.scope, state, ...(interactive ? { prompt: 'select_account' } : { prompt: 'none' }) });
      const back = await webAuth(`https://accounts.google.com/o/oauth2/v2/auth?${q}`, interactive);
      const p = new URLSearchParams(back.hash.slice(1));
      if (p.get('state') !== state || !p.get('access_token')) throw syncError(401, p.get('error') || 'Sign-in failed');
      return { access: p.get('access_token'), expires: Date.now() + (Number(p.get('expires_in') || 3600) - 60) * 1000 };
    },
    async token(auth, force) {
      if (!force && auth.access && Date.now() < auth.expires) return auth.access;
      Object.assign(auth, await this.signIn(null, false));
      saveSyncConfig();
      return auth.access;
    },
    async pages(url) {
      const out = [];
      let page = null;
      for (let i = 0; i < 10; i++) {
        const r = await syncFetch(`${url}${url.includes('?') ? '&' : '?'}maxResults=100${page ? `&pageToken=${encodeURIComponent(page)}` : ''}`);
        out.push(...(r.items || []));
        page = r.nextPageToken;
        if (!page) break;
      }
      return out;
    },
    async lists() {
      return (await this.pages(`${this.api}/users/@me/lists`)).map((l, i) => ({ id: l.id, name: l.title, main: i === 0 }));
    },
    async tasks(list) {
      return (await this.pages(`${this.api}/lists/${list}/tasks?showCompleted=false&showHidden=false`))
        .filter((t) => !t.parent && t.status !== 'completed' && !t.deleted)
        .sort((a, b) => (a.position < b.position ? -1 : 1)).map((t) => ({ id: t.id, text: t.title }));
    },
    async add(list, text) { return (await syncFetch(`${this.api}/lists/${list}/tasks`, { method: 'POST', body: { title: text } })).id; },
    done(list, id, done) { return syncFetch(`${this.api}/lists/${list}/tasks/${id}`, { method: 'PATCH', body: done ? { status: 'completed' } : { status: 'needsAction', completed: null } }); },
    edit(list, id, text) { return syncFetch(`${this.api}/lists/${list}/tasks/${id}`, { method: 'PATCH', body: { title: text } }); },
    remove(list, id) { return syncFetch(`${this.api}/lists/${list}/tasks/${id}`, { method: 'DELETE' }); },
  },
};
// Services still in testing with Microsoft or Google (only their test users can sign in)
// are offered only in an unpacked copy. A copy installed from the Chrome Web Store has
// an update_url in its manifest; an unpacked one doesn't. Set to false once approved.
const SYNC_TESTING = { microsoft: true, google: true };
const fromStore = hasChrome && !!chrome.runtime.getManifest?.().update_url;
const syncOffered = (k) => k === 'todoist' || (!!SYNC_CLIENT_IDS[k] && !(SYNC_TESTING[k] && fromStore));

let todoSync = null;     // { provider, auth, list, listName, lists } while connected
let syncTasks = [];      // [{ id, text, done }]; done ones stay until "Clear done"
let syncProblem = '';     // 'signin' (needs signing in again) or 'offline'
const todoViews = new Set(); // redraw functions of the to-do widgets on the page
const drawTodos = () => todoViews.forEach((f) => f());
const usingSync = () => !!todoSync && syncProblem !== 'signin';
const provider = () => SYNC[todoSync.provider];
function saveSyncConfig() { if (todoSync) cacheSet('todoSync', todoSync); }

// A request to the connected service, signed in. A rejected sign-in is refreshed once.
async function syncFetch(url, opts = {}) {
  const p = provider(), auth = todoSync.auth;
  try {
    return await jsonFetch(url, { ...opts, token: await p.token(auth) });
  } catch (e) {
    if (e.status !== 401 || todoSync.provider === 'todoist') throw e;
    return jsonFetch(url, { ...opts, token: await p.token(auth, true) });
  }
}
const failure = (e) => (e.status === 401 || e.status === 403 ? 'signin' : 'offline');

function setSyncTasks(tasks) {
  syncTasks = tasks;
  cacheSet('todoSyncCache', { key: `${todoSync?.provider}:${todoSync?.list}`, tasks });
  drawTodos();
}
let syncAt = 0, syncing = null;
// Fetches the list's open tasks. Ticked ones from this computer stay listed as done
// until cleared, and new ones still being sent stay too.
function syncRefresh() {
  if (!todoSync) return Promise.resolve();
  if (syncing) return syncing;
  const for_ = `${todoSync.provider}:${todoSync.list}`;
  syncing = provider().tasks(todoSync.list).then((open) => {
    if (!todoSync || `${todoSync.provider}:${todoSync.list}` !== for_) return;
    const ids = new Set(open.map((t) => t.id));
    syncProblem = '';
    syncAt = Date.now();
    setSyncTasks([...open.map((t) => ({ ...t, done: false })), ...syncTasks.filter((t) => (t.done || t.pending) && !ids.has(t.id))]);
  }).catch((e) => { syncProblem = failure(e); drawTodos(); }).finally(() => { syncing = null; syncPanel(); });
  return syncing;
}
// Sends one change. If the service refuses it, the list is fetched again so it shows the truth.
function syncSend(task, fn) {
  if (task.pending) { task.after = [...(task.after || []), fn]; return; } // wait for its id
  fn(task.id).then(() => { if (syncProblem === 'offline') { syncProblem = ''; drawTodos(); } })
    .catch((e) => { syncProblem = failure(e); syncRefresh(); drawTodos(); });
}

// The to-do list's actions, on whichever list is in use.
const todoList = () => (usingSync() ? syncTasks : S.todos);
function todoAdd(text) {
  if (!usingSync()) {
    if (S.todos.length >= TODO_MAX) return null;
    const t = { text, done: false };
    S.todos.push(t); save(); drawTodos(); return t;
  }
  const t = { id: `new-${randomString()}`, text, done: false, pending: true };
  setSyncTasks([...syncTasks.filter((x) => !x.done), t, ...syncTasks.filter((x) => x.done)]);
  const { list } = todoSync;
  provider().add(list, text).then((id) => {
    t.id = id; delete t.pending;
    setSyncTasks(syncTasks);
    for (const fn of t.after || []) syncSend(t, fn);
    delete t.after;
  }).catch((e) => { setSyncTasks(syncTasks.filter((x) => x !== t)); syncProblem = failure(e); drawTodos(); });
  return t;
}
function todoToggle(t) {
  t.done = !t.done;
  if (!usingSync()) { save(); drawTodos(); return; }
  setSyncTasks(syncTasks);
  const { list } = todoSync, done = t.done;
  syncSend(t, (id) => provider().done(list, id, done));
}
function todoEdit(t, text) {
  if (!text) { todoRemove(t); return; }
  t.text = text.slice(0, usingSync() ? 500 : 120);
  if (!usingSync()) { save(); drawTodos(); return; }
  setSyncTasks(syncTasks);
  const { list } = todoSync, value = t.text;
  syncSend(t, (id) => provider().edit(list, id, value));
}
function todoRemove(t) {
  toast('Task deleted', undoRemove(t));
  if (!usingSync()) { S.todos.splice(S.todos.indexOf(t), 1); save(); drawTodos(); return; }
  setSyncTasks(syncTasks.filter((x) => x !== t));
  const { list } = todoSync;
  syncSend(t, (id) => provider().remove(list, id));
}
// Undo for a deleted task: back in its place on this computer's list. A connected
// service has deleted it already, so it's added there again.
function undoRemove(t) {
  const local = !usingSync(), at = todoList().indexOf(t);
  return () => {
    if (local !== !usingSync()) return; // the list changed since
    if (local) { S.todos.splice(Math.min(at, S.todos.length), 0, t); save(); drawTodos(); return; }
    const again = todoAdd(t.text);
    if (again && t.done) todoToggle(again);
  };
}
function todoClearDone() {
  // Done tasks are already completed in the service; this only tidies the widget.
  // Undo puts them back at the end, where done tasks sit anyway.
  const local = !usingSync(), cleared = todoList().filter((t) => t.done);
  toast(`Cleared ${cleared.length} done`, () => {
    if (local !== !usingSync()) return;
    if (local) { S.todos = [...S.todos, ...cleared].slice(0, TODO_MAX); save(); drawTodos(); } else setSyncTasks([...syncTasks, ...cleared]);
  });
  if (local) { S.todos = S.todos.filter((t) => !t.done); save(); drawTodos(); return; }
  setSyncTasks(syncTasks.filter((t) => !t.done));
}

// Connecting from Customize. Chrome's permission prompt has to come straight from the
// click, so it's asked for before anything else.
async function connectSync(key) {
  const p = SYNC[key], note = $('#syncNote');
  const token = key === 'todoist' ? $('#todoistToken').value.trim() : null;
  if (key === 'todoist' && !token) { note.textContent = 'Paste your Todoist API token first.'; return; }
  const allowed = await chrome.permissions.request({ origins: p.origins, ...(key === 'todoist' ? {} : { permissions: ['identity'] }) }).catch(() => false);
  if (!allowed) { note.textContent = `Glass Tab needs permission to reach ${p.name}.`; return; }
  note.textContent = key === 'todoist' ? 'Connecting…' : 'Signing in…';
  const before = todoSync;
  try {
    todoSync = { provider: key, auth: await p.signIn(token), list: '', listName: '', lists: [] };
    const lists = await p.lists();
    // Signing in again keeps the list that was showing.
    const main = (before?.provider === key && lists.find((l) => l.id === before.list)) || lists.find((l) => l.main) || lists[0];
    if (!main) throw syncError(0, 'No lists');
    Object.assign(todoSync, { list: main.id, listName: main.name, lists: lists.map(({ id, name }) => ({ id, name })) });
    if (!(before?.provider === key && before.list === main.id)) syncTasks = [];
    syncProblem = '';
    syncPick = 'local';
    saveSyncConfig();
    await syncRefresh();
    note.textContent = syncProblem ? "Connected, but your tasks didn't load. They'll appear once the service answers." : `Connected. Showing ${main.name}.`;
    if (!S.layout.some((w) => w.k === 'todo')) { setWidgetOn('todo', true); update(); }
  } catch (e) {
    todoSync = before;
    note.textContent = e.status === 401 || e.status === 403
      ? key === 'todoist' ? "Todoist didn't accept that token. Copy it again from Todoist › Settings › Integrations › Developer." : `${p.name} sign-in didn't finish. Try again.`
      : `Couldn't reach ${p.name}. Check your connection and try again.`;
  }
  syncPanel();
  renderWidgets();
}
async function disconnectSync() {
  const was = todoSync;
  todoSync = null; syncTasks = []; syncProblem = '';
  await chrome.storage.local.remove(['todoSync', 'todoSyncCache']).catch(() => {});
  if (was) chrome.permissions.remove({ origins: SYNC[was.provider].origins }).catch(() => {});
  $('#todoistToken').value = '';
  $('#syncNote').textContent = was ? `Disconnected from ${SYNC[was.provider].name}. Your list on this computer is back.` : '';
  syncPanel();
  renderWidgets();
}
function setSyncList(id) {
  const l = todoSync.lists.find((x) => x.id === id);
  if (!l) return;
  Object.assign(todoSync, { list: l.id, listName: l.name });
  saveSyncConfig();
  setSyncTasks([]);
  syncPanel();
  syncRefresh();
}
// Loads the saved connection and its last copy of the tasks, then checks for changes:
// now, every five minutes, and whenever the tab comes back into view.
async function startSync() {
  if (!hasChrome) return;
  const saved = await cacheGet('todoSync');
  if (!saved || !SYNC[saved.provider] || !syncOffered(saved.provider)) return;
  todoSync = saved;
  const cache = await cacheGet('todoSyncCache');
  if (cache?.key === `${saved.provider}:${saved.list}`) syncTasks = cache.tasks.filter((t) => !t.pending);
  drawTodos();
  syncPanel();
  syncRefresh();
  setInterval(() => { if (document.visibilityState === 'visible') syncRefresh(); }, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - syncAt > 60 * 1000) syncRefresh(); });
}
// Connecting, disconnecting or switching lists in another tab.
if (hasChrome) chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.todoSync) return;
  const next = changes.todoSync.newValue;
  if (!next) { if (todoSync) { todoSync = null; syncTasks = []; syncProblem = ''; syncPanel(); renderWidgets(); } return; }
  if (todoSync && next.provider === todoSync.provider && next.list === todoSync.list) return;
  todoSync = next; syncTasks = []; syncProblem = '';
  syncPanel(); renderWidgets(); syncRefresh();
});

// To-do: unfinished tasks stay on top, finished ones sink to the bottom and can be
// cleared in one go. Click a task to edit it; empty it to delete. Enter keeps adding.
function todoWidget(size) {
  const list = h('ul', { class: 'todo' });
  const left = h('span', { class: 'muted' });
  const clear = h('button', { class: 'linkish', onclick: todoClearDone });
  const status = h('div', { class: 'muted todo-status' });
  const title = h('h3', {}, 'Today');
  const draw = () => {
    const items = todoList();
    const open = items.filter((t) => !t.done), done = items.filter((t) => t.done);
    // With a service connected, the title is the list's name, like it is there.
    title.textContent = usingSync() ? todoSync.listName : 'Today';
    status.textContent = !todoSync ? '' : syncProblem === 'signin'
      ? `${provider().name} needs you to sign in again, so this is the list on this computer. Open Customize › To-do list.`
      : syncProblem === 'offline' ? `Can't reach ${provider().name} right now. Changes will show once it's back.` : '';
    left.textContent = items.length ? (open.length ? `${open.length} left` : 'All done') : '';
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
        todoEdit(t, v);
      });
      return h('li', { class: t.done ? 'done' : '' },
        h('button', { class: 'check', 'aria-label': t.done ? 'Mark not done' : 'Mark done', onclick: () => todoToggle(t) }),
        text,
        h('button', { class: 'del', 'aria-label': 'Delete task', onclick: () => todoRemove(t) }, '×'));
    }));
  };
  todoViews.add(draw);
  draw();
  const input = h('input', { placeholder: size === 'S' ? 'Add a task' : 'Add a task and press Enter', maxlength: '120', 'aria-label': 'Add a task' });
  const form = h('form', { onsubmit: (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || !todoAdd(text)) return;
    input.value = '';
    [...list.children].filter((li) => !li.classList.contains('done')).pop()?.scrollIntoView({ block: 'nearest' });
  } }, input);
  return h('div', { class: 'todo-w' }, h('div', { class: 'whead' }, title, left, clear), status, list, form);
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

// Large fits three rows of four; the rows spread out to fill the widget, so a shorter
// list (Chrome only knows the sites you visit often) doesn't leave a gap at the bottom.
// Sites you pin come first and stay; Chrome's most visited fill the rest.
const PIN_MAX = 12;
const siteName = (url) => new URL(url).hostname.replace(/^www\./, '');
const sameSite = (a, b) => a.replace(/\/+$/, '') === b.replace(/\/+$/, '');
function sitesWidget(size) {
  const limit = size === 'L' ? 12 : 4;
  const grid = h('div', { class: 'sites' });
  const el = h('div', { class: 'sites-w' });
  const tile = (s, pinned) => {
    const name = s.title || siteName(s.url);
    const a = h('a', { class: 'site', href: s.url, title: name }, h('img', { src: hasChrome ? favicon(s.url) : '', alt: '' }), h('span', {}, name));
    if (!pinned) return a;
    return h('div', { class: 'site-box' }, a, h('button', { class: 'unpin', 'aria-label': `Remove ${name}`, title: 'Remove', onclick: (e) => { e.stopPropagation(); unpinSite(s); } }, '×'));
  };
  const draw = (top) => {
    const pins = S.pins.slice(0, limit);
    const rest = top.filter((s) => !pins.some((p) => sameSite(p.url, s.url))).slice(0, limit - pins.length);
    if (!pins.length && !rest.length) {
      grid.className = 'muted';
      grid.textContent = hasChrome ? 'Sites you visit often show up here. Add site pins your own.' : 'Available when installed in Chrome.';
      return;
    }
    grid.className = 'sites';
    grid.replaceChildren(...pins.map((p) => tile(p, true)), ...rest.map((s) => tile(s, false)));
  };
  const show = () => {
    el.replaceChildren(h('div', { class: 'whead' }, h('h3', {}, 'Top sites'),
      h('button', { class: 'linkish', onclick: (e) => { e.stopPropagation(); edit(); } }, 'Add site')), grid);
    if (hasChrome && chrome.topSites) chrome.topSites.get(draw); else draw([]);
  };
  // Adding a site: its address, and in bigger sizes a name for it.
  const edit = () => {
    const url = h('input', { placeholder: 'Website, like example.com', maxlength: '300', 'aria-label': 'Website' });
    const name = h('input', { placeholder: 'Name (optional)', maxlength: '40', 'aria-label': 'Name' });
    const note = h('div', { class: 'muted' });
    el.replaceChildren(h('form', { class: 'pin-form', onsubmit: (e) => {
      e.preventDefault();
      const added = pinSite(url.value, name.value);
      if (added === true) { show(); return; }
      note.textContent = added;
    } }, h('h3', {}, 'Add a site'), url, size === 'S' ? null : name, note,
    h('div', { class: 'row' }, h('button', { class: 'chip' }, 'Add'), h('button', { class: 'chip', type: 'button', onclick: show }, 'Cancel'))));
    url.focus();
  };
  show();
  return el;
}
// Returns true, or what's wrong.
function pinSite(text, title) {
  let v = text.trim();
  if (!v) return 'Type a website first.';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(v)) v = `https://${v}`;
  let u;
  try { u = new URL(v); } catch { return "That doesn't look like a website."; }
  if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.') && u.hostname !== 'localhost') return "That doesn't look like a website.";
  if (S.pins.some((p) => sameSite(p.url, u.href))) return 'That site is already pinned.';
  if (S.pins.length >= PIN_MAX) return `You can pin up to ${PIN_MAX} sites.`;
  S.pins = [...S.pins, { url: u.href, title: title.trim().slice(0, 40) }];
  save();
  renderWidgets();
  return true;
}
function unpinSite(s) {
  const before = S.pins;
  S.pins = S.pins.filter((p) => p !== s);
  save();
  renderWidgets();
  toast(`${s.title || siteName(s.url)} removed`, () => { S.pins = before; save(); renderWidgets(); });
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
  area.addEventListener('input', () => {
    const was = S.notes;
    S.notes = area.value; showCount(); save();
    // Deleting a good chunk at once (or clearing it) offers Undo; typing on puts it away.
    if (was.length - S.notes.length >= 20) {
      toast('Deleted from notes', () => { S.notes = was; area.value = was; showCount(); save(); }, 'notes');
    } else if (toastKind === 'notes') closeToast();
  });
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
    else if (name === 'URL' && /^https?:\/\//i.test(value)) ev.url = value;
  }
  function expand(e) {
    if (e.cancelled) return;
    const len = (e.end || e.start.date) - e.start.date;
    const add = (d) => { if (d >= from - len && d < to && !e.ex.includes(d.getTime())) out.push({ title: e.title || '(No title)', start: d, end: new Date(+d + len), allDay: e.start.allDay, ...(e.url ? { url: e.url } : {}) }); };
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
  const cached = await cacheGet('calCache'), key = `v2|${links.join()}`;
  if (cached && cached.key === key && Date.now() - cached.at < 15 * 60e3 && cached.events.every((x) => typeof x.start === 'number')) return cached.events.map((x) => ({ ...x, start: new Date(x.start), end: new Date(x.end) }));
  const from = new Date(); from.setHours(0, 0, 0, 0);
  const to = new Date(+from + 8 * 864e5);
  // Each event remembers which service it came from, so a click can open it there.
  const lists = await Promise.all(links.map(async (u) => parseICS(await (await fetch(u, { cache: 'no-store' })).text(), from, to)
    .map((x) => ({ ...x, cal: /(^|\.)icloud\.com$/.test(new URL(u).hostname) ? 'icloud' : 'google' }))));
  const now = Date.now();
  const events = lists.flat().filter((x) => +x.end > now || x.allDay).sort((a, b) => a.start - b.start || a.allDay - b.allDay);
  // Chrome storage can't hold dates (they come back empty), so store them as numbers.
  cacheSet('calCache', { key, at: Date.now(), events: events.map((x) => ({ ...x, start: +x.start, end: +x.end })) });
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
  const row = (e) => h('a', { class: 'cal-ev', href: eventLink(e), title: e.title }, h('span', { class: 'cal-t' }, time(e)), h('span', { class: 'cal-n' }, e.title));
  getCalendar().then((events) => {
    if (!events) {
      body.replaceChildren(h('button', { class: 'chip', onclick: (e) => { e.stopPropagation(); openCalendarSettings(); } }, 'Link a calendar'));
      return;
    }
    if (!events.length) { body.textContent = 'Nothing coming up this week.'; return; }
    if (size === 'S') { body.replaceChildren(h('a', { class: 'cal-ev cal-one', href: eventLink(events[0]), title: events[0].title }, h('div', { class: 'muted' }, `Next · ${dayName(events[0].start)}`), h('div', { class: 'cal-next' }, events[0].title), h('div', { class: 'muted' }, time(events[0])))); return; }
    // Medium: the next three events; Large: the coming week. Both grouped by day.
    const groups = new Map();
    for (const e of size === 'M' ? events.slice(0, 3) : events) { const k = dayName(e.start); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e); }
    body.className = 'cal cal-l';
    body.replaceChildren(...[...groups].flatMap(([k, list]) => [h('div', { class: 'cal-day' }, k), ...list.map((e) => row(e))]));
  }).catch(() => { body.textContent = "Couldn't load your calendar. Check the link in Customize."; });
  return h('div', { class: 'cal-w' }, head, body);
}

// Clicking an event opens it: the event's own link if the calendar gives one, otherwise
// that day in the calendar it came from.
function eventLink(e) {
  if (e.url) return e.url;
  if (e.cal === 'icloud') return 'https://www.icloud.com/calendar/';
  const d = e.start;
  return `https://calendar.google.com/calendar/r/day/${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function openCalendarSettings() {
  openPanelAt('calendar', '#calLinks');
}

// Saving the link asks Chrome for access to that calendar service (it has to come
// straight from the click), then shows the widget.
async function saveCalendarLinks() {
  const links = $('#calLinks').value.split(/\s+/).map(calLink).filter((u) => /^https:\/\//.test(u));
  const note = $('#calNote');
  if (!links.length) {
    await cacheSet('calLinks', []);
    note.textContent = 'Calendar unlinked.';
    calCount = 0;
    syncPanel();
    renderWidgets();
    return;
  }
  const ok = await chrome.permissions.request({ origins: CAL_ORIGINS }).catch(() => false);
  if (!ok) { note.textContent = 'Glass Tab needs permission to read your calendar link.'; return; }
  await cacheSet('calLinks', links);
  await cacheSet('calCache', null);
  if (!S.layout.some((w) => w.k === 'calendar')) { setWidgetOn('calendar', true); update(); }
  note.textContent = `Linked ${links.length} ${links.length === 1 ? 'calendar' : 'calendars'}.`;
  calCount = links.length;
  syncPanel();
  renderWidgets();
}

const RENDER = { weather: weatherWidget, todo: todoWidget, focus: focusWidget, sites: sitesWidget, recent: recentWidget, quote: quoteWidget, notes: notesWidget, countdown: countdownWidget, calendar: calendarWidget };

// ---------- layout and edit mode ----------
// Widgets are identified by key (each widget appears at most once).
function removeWidget(k) {
  const before = { layout: S.layout.map((w) => ({ ...w })), quote: S.quote };
  S.layout = S.layout.filter((w) => w.k !== k);
  if (k === 'quote') S.quote = 'off';
  update();
  renderWidgets();
  toast(`${WIDGETS[k].name} removed`, () => { Object.assign(S, before); update(); renderWidgets(); });
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
  liquid(el);
  el.dataset.k = k;
  const ctl = h('div', { class: 'wctl' });
  if (WIDGETS[k].sizes.length > 1) ctl.append(sizePicker(k, size));
  ctl.append(h('button', { class: 'wdel', 'aria-label': `Remove ${WIDGETS[k].name}`, onclick: () => removeWidget(k) }, '×'));
  el.append(ctl);
  return el;
}

// Liquid glass: each .liquid surface gets an SVG filter made to its size. It bends the
// backdrop near the rounded edges, like light through the rim of a thick lens, and leaves
// the middle straight. Red, green and blue bend by slightly different amounts, which gives
// the rim a faint rainbow. Chrome applies SVG filters to backdrop-filter. Widgets only get
// it while motion is off (see newtab.css): with a moving wallpaper behind every widget, a 4K
// screen drops to 30 frames a second.
const lqObserver = new ResizeObserver((entries) => entries.forEach((e) => lqBuild(e.target)));
function liquid(el) { lqObserver.observe(el); }
function lqBuild(el) {
  // Widgets are rebuilt often: stop watching ones that left the page.
  if (!el.isConnected) { lqObserver.unobserve(el); return; }
  const w = el.offsetWidth, ht = el.offsetHeight;
  if (!w || !ht) return;
  const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, w / 2, ht / 2);
  // Surfaces of the same size share a filter, so widgets redrawn often don't add new ones.
  const id = `lq-${w}-${ht}-${Math.round(r)}`;
  el.style.setProperty('--lq', `url(#${id})`);
  if (document.getElementById(id)) return;
  // How far in from the edge the bending reaches, and how strong it is.
  const band = Math.min(w, ht) * 0.22, scale = Math.min(w, ht) * 0.45;
  // The map: red runs left to right and blue top to bottom (the direction of the shift),
  // under a blurred mid-gray shape that means "no shift" everywhere but the rim.
  const map = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${ht}">`
    + '<defs><linearGradient id="x" x1="1" x2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#f00"/></linearGradient>'
    + '<linearGradient id="y" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#00f"/></linearGradient></defs>'
    + `<rect width="${w}" height="${ht}" fill="url(#x)"/>`
    + `<rect width="${w}" height="${ht}" fill="url(#y)" style="mix-blend-mode:screen"/>`
    + `<rect x="${band / 2}" y="${band / 2}" width="${w - band}" height="${ht - band}" rx="${Math.max(0, r - band / 2)}" fill="#808080" style="filter:blur(${band / 3}px)"/></svg>`;
  const pass = (s, keep) => `<feDisplacementMap in="SourceGraphic" in2="map" scale="${s}" xChannelSelector="R" yChannelSelector="B"/>`
    + `<feColorMatrix type="matrix" values="${keep.map((k, i) => [0, 1, 2, 3].map((j) => (j === i ? k : 0)).join(' ') + ' 0').join(' ')} 0 0 0 1 0" result="c${keep.indexOf(1)}"/>`;
  const f = document.getElementById('lqDefs').appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'filter'));
  f.id = id;
  f.setAttribute('filterUnits', 'userSpaceOnUse');
  f.setAttribute('color-interpolation-filters', 'sRGB');
  for (const [a, v] of Object.entries({ x: 0, y: 0, width: w, height: ht })) f.setAttribute(a, v);
  f.innerHTML = `<feImage href="data:image/svg+xml,${encodeURIComponent(map)}" x="0" y="0" width="${w}" height="${ht}" result="map"/>`
    + pass(scale, [1, 0, 0]) + pass(scale * 0.93, [0, 1, 0]) + pass(scale * 0.86, [0, 0, 1])
    + '<feBlend in="c0" in2="c1" mode="screen" result="rg"/><feBlend in="rg" in2="c2" mode="screen"/>';
}
liquid($('#search'));

// Dragging uses pointer events (not HTML drag and drop): the widget follows the
// pointer and the others move out of the way live, like the iOS home screen.
let drag = null;

function place(e) {
  // Widgets sit in <main>, which is zoomed on big screens; a transform there is zoomed too.
  const z = drag.el.currentCSSZoom || 1;
  drag.el.style.transform = `translate(${(e.clientX - drag.offX - drag.base.left) / z}px, ${(e.clientY - drag.offY - drag.base.top) / z}px) scale(1.04)`;
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
  todoViews.clear();
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
// Opens Customize on one group, with a field in it focused.
function setPanel(open) {
  if (open && $('#panelFilter').value) { $('#panelFilter').value = ''; filterPanel(''); }
  $('#panel').hidden = !open;
  $('#gear').setAttribute('aria-expanded', String(open));
}
function openPanelAt(group, field) {
  setPanel(true);
  $(`#panel .group[data-group="${group}"]`).open = true;
  $(field).scrollIntoView({ block: 'center' });
  $(field).focus();
}
function openWeatherSettings() {
  openPanelAt('weather', '#city');
}
let ggChecked = Promise.resolve(); // settles once Glass Google's state is known
let calCount = 0, googleOn = false, ggState = ''; // ggState: 'off' once turned off in Customize on this computer

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
  setWidgetOn('quote', mode === 'widget');
  update();
  renderWidgets();
}

// Customize > Widgets: each widget on its own row, with an on/off switch and its sizes.
function drawWidgetRows() {
  $('#widgetRows').replaceChildren(...Object.entries(WIDGETS).map(([key, w]) => {
    const placed = S.layout.find((x) => x.k === key);
    const toggle = () => {
      if (key === 'quote') { setQuoteMode(placed ? 'caption' : 'widget'); return; }
      setWidgetOn(key, !placed);
      update();
      renderWidgets();
    };
    return h('div', { class: `wrow${placed ? ' on' : ''}` },
      h('label', { class: 'toggle' }, h('input', { type: 'checkbox', ...(placed ? { checked: '' } : {}), onchange: toggle }), ` ${w.name}`),
      placed && w.sizes.length > 1 ? sizePicker(key, placed.size) : null);
  }));
}

function buildPanel() {
  // Groups open and close on their own; the panel scrolls when several are open. Which
  // ones are open is remembered for next time.
  const groups = document.querySelectorAll('#panel .group');
  let open = ['wallpaper'];
  try { open = JSON.parse(localStorage.getItem('glassTabGroups')) || open; } catch {}
  groups.forEach((d) => {
    d.open = open.includes(d.dataset.group);
    d.addEventListener('toggle', () => {
      if (filterOpen) return; // searching opens sections for a moment; don't remember those
      const now = [...groups].filter((g) => g.open).map((g) => g.dataset.group);
      try { localStorage.setItem('glassTabGroups', JSON.stringify(now)); } catch {}
    });
  });
  buildColorEditor();
  buildSyncSettings();
  $('#calSave').addEventListener('click', saveCalendarLinks);
  cacheGet('calLinks').then((l) => { if (l?.length) { $('#calLinks').value = l.join('\n'); calCount = l.length; syncPanel(); } });
  $('#appearance').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { S.appearance = b.dataset.mode; update(); }));
  for (const [key, f] of Object.entries(FONTS)) {
    $('#fonts').append(h('button', { 'data-key': key, style: `font-family: ${f.stack.replaceAll('"', "'")}`, onclick: () => { S.clockFont = key; update(); } }, f.name));
  }
  $('#styles').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { S.clockStyle = b.dataset.style; update(); }));
  $('#quoteModes').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => setQuoteMode(b.dataset.mode)));

  const bind = (id, key, prop, cast = (v) => v) => $(id).addEventListener('input', (e) => { S[key] = cast(e.target[prop]); update(); });
  $('#topBar').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { S.topBar = b.dataset.bar; update(); }));
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
  bind('#speed', 'speed', 'value', Number);
  $('#clockMatch button').addEventListener('click', () => { S[modeSet().colorKey] = 'match'; update(); });
  bind('#tint', 'tint', 'value', Number);
  bind('#size', 'clockSize', 'value', Number);
  bind('#greetingOn', 'greeting', 'checked');
  bind('#greetingSize', 'greetingSize', 'value', Number);
  bind('#name', 'name', 'value', (v) => v.trim());
  $('#city').addEventListener('change', (e) => { S.city = e.target.value.trim(); S.useLocation = false; update(); renderWidgets(); });
  $('#units').addEventListener('change', (e) => { S.units = e.target.value; update(); renderWidgets(); });
  $('#useLocation').addEventListener('click', useMyLocation);
  $('#glassGoogle').addEventListener('change', (e) => setGlassGoogle(e.target.checked));
  if (hasChrome) ggChecked = Promise.all([ggIsOn(), ggGet()]).then(([on, gg]) => { $('#glassGoogle').checked = googleOn = on; ggState = gg.state || ''; if (on && !S.glassGoogle) { S.glassGoogle = true; save(); } syncPanel(); });
  $('#editLayout').addEventListener('click', () => setEditing(true));
  $('#tidyLayout').addEventListener('click', () => { S.layout = tidyLayout(S.layout.map((w) => w.k)); update(); renderWidgets(); });

  $('#panelFilter').addEventListener('input', (e) => filterPanel(e.target.value));
  for (const g of groups) {
    if (RESETS[g.dataset.group]) g.append(h('button', { class: 'linkish reset', onclick: () => resetGroup(g.dataset.group) }, 'Reset to default'));
  }
  buildPhotoSettings();
  $('#exportSettings').addEventListener('click', exportSettings);
  $('#importSettings').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importSettings(f); });

  const panel = $('#panel'), gear = $('#gear');
  gear.addEventListener('click', () => setPanel(panel.hidden));
  // Esc closes whatever is open; / jumps to the search box (unless you're typing).
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (editing) setEditing(false);
      setPanel(false);
      closeToast();
      if (!$('#rate').hidden) closeRate('later');
      if (!$('#ggNudge').hidden) $('#ggNudgeLater').click();
      return;
    }
    const t = e.target;
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && tourStep < 0 && !t.isContentEditable && !t.closest?.('input, textarea, select')) {
      e.preventDefault();
      $('#q').focus();
    }
  });
  // Tour and news buttons can open Customize themselves, so a click there doesn't count as outside;
  // nor does Undo on a reset done from the panel.
  document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target) && !gear.contains(e.target) && !e.target.closest('#tour, #toast, #newsTip')) setPanel(false); });
}

// Customize search: typing keeps only the sections that match, opens them, and lights up
// the matching rows. Clearing it puts the sections back the way they were.
const FILTER_ROWS = 'h3, label, .chips button, .swatches button, .wrow, .note, .linkish, .chip, .help summary';
let filterOpen = null; // which sections were open before searching
function filterPanel(text) {
  const q = text.trim().toLowerCase();
  const groups = [...document.querySelectorAll('#panel .group')];
  document.querySelectorAll('#panel .hit').forEach((e) => e.classList.remove('hit'));
  if (!q) {
    if (filterOpen) groups.forEach((g) => { g.hidden = false; g.open = filterOpen.includes(g.dataset.group); });
    filterOpen = null;
    $('#filterNone').hidden = true;
    return;
  }
  if (!filterOpen) filterOpen = groups.filter((g) => g.open).map((g) => g.dataset.group);
  const has = (x) => !!x && x.toLowerCase().includes(q);
  let any = false;
  for (const g of groups) {
    const rows = [...g.querySelectorAll(FILTER_ROWS)].filter((r) => has(r.textContent) || has(r.title) || has(r.getAttribute('aria-label')));
    // Light up the smallest matching row, not the box around it too.
    rows.filter((r) => !rows.some((o) => o !== r && r.contains(o))).forEach((r) => r.classList.add('hit'));
    const match = has(g.querySelector('summary span').textContent) || has(g.dataset.words) || rows.length > 0;
    g.hidden = !match;
    g.open = match;
    any ||= match;
  }
  $('#filterNone').hidden = any;
}

// Reset to default, one Customize section at a time. Undo puts it back.
const RESETS = {
  wallpaper: ['appearance', 'wallpaper', 'wallpaperLight', 'animated', 'fps', 'speed', 'wpColors'],
  glass: ['blur', 'tint', 'liquid', 'solidGlass'],
  clock: ['clockStyle', 'clockFont', 'clockSize', 'clockColor', 'clockColorLight', 'clockCustom', 'hour24'],
  greeting: ['greeting', 'name', 'greetingSize', 'quote'],
  widgets: ['layout'],
  weather: ['city', 'units', 'useLocation', 'coords', 'coordsName'],
  chrome: ['topBar'],
};
function resetGroup(g) {
  const before = JSON.parse(JSON.stringify(Object.fromEntries([...RESETS[g], 'layout', 'quote'].map((k) => [k, S[k]]))));
  for (const k of RESETS[g]) S[k] = JSON.parse(JSON.stringify(DEFAULTS[k]));
  // The quote can be a widget, so its setting and the layout move together.
  if (g === 'greeting') setWidgetOn('quote', S.quote === 'widget');
  if (g === 'widgets' && S.quote === 'widget') S.quote = 'caption';
  // Glass Google goes back to how a new install starts: off, with the card offering it.
  const hadGoogle = g === 'chrome' && googleOn;
  if (hadGoogle) setGlassGoogle(false).then(async () => { ggState = ''; if (hasChrome) await ggSet({ state: '' }); });
  colorEditorFor = '';
  update();
  renderWidgets();
  const name = $(`#panel .group[data-group="${g}"] summary span`).textContent;
  toast(`${name} reset`, () => {
    if (hadGoogle) setGlassGoogle(true); // first, so Chrome's prompt comes straight from the click
    Object.assign(S, before); colorEditorFor = ''; update(); renderWidgets();
  });
}

// ---------- your own wallpaper ----------
// The photo is shrunk to the screen's size and saved as a JPEG. Its colors tint the
// page underneath and Glass Google, like a built-in wallpaper's do.
async function readPhoto(file) {
  const img = await createImageBitmap(file);
  const dpr = devicePixelRatio || 1;
  const sw = Math.min(3840, screen.width * dpr), sh = Math.min(2400, screen.height * dpr);
  const scale = Math.min(1, Math.max(sw / img.width, sh / img.height));
  const canvas = (w, hgt) => Object.assign(document.createElement('canvas'), { width: w, height: hgt });
  const big = canvas(Math.round(img.width * scale), Math.round(img.height * scale));
  big.getContext('2d').drawImage(img, 0, 0, big.width, big.height);
  let data, q = 0.86;
  do { data = big.toDataURL('image/jpeg', q); q -= 0.12; } while (data.length > 3e6 && q > 0.4);
  // A small square for the wallpaper picker.
  const side = Math.min(img.width, img.height), thumb = canvas(64, 64);
  thumb.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 64, 64);
  // Colors: the whole picture for the background, three corners for the glows.
  const px = canvas(3, 3), ctx = px.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, 3, 3);
  const hex = (x, y) => `#${[...ctx.getImageData(x, y, 1, 1).data.slice(0, 3)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  const one = canvas(1, 1), c1 = one.getContext('2d', { willReadFrequently: true });
  c1.drawImage(img, 0, 0, 1, 1);
  const base = `#${[...c1.getImageData(0, 0, 1, 1).data.slice(0, 3)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  img.close();
  return { data, meta: { thumb: thumb.toDataURL('image/jpeg', 0.7), base, c: [hex(0, 0), hex(1, 1), hex(2, 2)] } };
}
async function setPhoto(next, data) {
  photo = next; photoData = next ? data : '';
  mirrorPhoto();
  if (hasChrome) await (next ? chrome.storage.local.set({ photo: { ...next, data } }) : chrome.storage.local.remove('photo'));
}
function buildPhotoSettings() {
  $('#photoPick').addEventListener('click', () => $('#photoFile').click());
  $('#photoFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const note = $('#photoNote');
    note.textContent = 'Getting it ready…';
    try {
      const { data, meta } = await readPhoto(file);
      await setPhoto(meta, data);
      // A new photo shows in both light and dark mode; pick another wallpaper per mode any time.
      S.wallpaper = S.wallpaperLight = 'photo';
      note.textContent = 'Your photo is the wallpaper now. It stays on this computer.';
      swatchMode = '';
      update();
    } catch {
      note.textContent = "Glass Tab couldn't open that file. Try a JPEG or PNG photo.";
    }
  });
}
// The × on your photo in the wallpaper picker. Built-in wallpapers have none.
async function removePhoto() {
  const was = { photo, photoData, wallpaper: S.wallpaper, wallpaperLight: S.wallpaperLight };
  await setPhoto(null);
  if (S.wallpaper === 'photo') S.wallpaper = DEFAULTS.wallpaper;
  if (S.wallpaperLight === 'photo') S.wallpaperLight = DEFAULTS.wallpaperLight;
  $('#photoNote').textContent = '';
  swatchMode = '';
  update();
  toast('Photo removed', async () => {
    await setPhoto(was.photo, was.photoData);
    Object.assign(S, { wallpaper: was.wallpaper, wallpaperLight: was.wallpaperLight });
    swatchMode = '';
    update();
  });
}
// The photo from storage: on a page that had no copy of it, and when another tab changes it.
async function loadPhoto() {
  if (!hasChrome) return;
  const p = (await chrome.storage.local.get('photo')).photo;
  const data = p?.data || '';
  if (data === photoData) return;
  photo = p ? { thumb: p.thumb, base: p.base, c: p.c } : null;
  photoData = data;
  mirrorPhoto();
  swatchMode = '';
  applyLook();
  syncPanel();
}

// ---------- settings backup ----------
// Export saves the settings as a file; Import reads one back. Sign-ins, calendar links
// and the photo stay on this computer and aren't in the file.
function exportSettings() {
  const day = new Date().toISOString().slice(0, 10);
  const file = { app: 'Glass Tab', version: hasChrome ? chrome.runtime.getManifest().version : '', saved: new Date().toISOString(), settings: S };
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }));
  h('a', { href: url, download: `glass-tab-settings-${day}.json` }).click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  $('#backupNote').textContent = 'Settings exported.';
}
async function importSettings(file) {
  const note = $('#backupNote');
  let got = null;
  try { got = JSON.parse(await file.text()); } catch {}
  const s = got?.app === 'Glass Tab' && got.settings;
  if (!s || typeof s !== 'object' || Array.isArray(s)) { note.textContent = "That isn't a Glass Tab settings file."; return; }
  // Only known settings, each the same kind as its default, and within the sync limits.
  const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  const clean = Object.fromEntries(Object.entries(s).filter(([k, v]) => k in DEFAULTS
    && (kind(v) === kind(DEFAULTS[k]) || (k === 'coords' && (v === null || (typeof v?.lat === 'number' && typeof v?.lon === 'number'))))));
  if (clean.todos) clean.todos = clean.todos.filter((t) => typeof t?.text === 'string').slice(0, TODO_MAX).map((t) => ({ text: t.text.slice(0, 120), done: !!t.done }));
  if (clean.pins) clean.pins = clean.pins.filter((p) => typeof p?.url === 'string' && /^https?:\/\//.test(p.url)).slice(0, PIN_MAX).map((p) => ({ url: p.url.slice(0, 300), title: String(p.title || '').slice(0, 40) }));
  if (clean.layout) clean.layout = clean.layout.filter((w) => w && typeof w === 'object');
  if (clean.notes) clean.notes = clean.notes.slice(0, NOTES_MAX);
  const before = S;
  S = migrate(clean);
  colorEditorFor = '';
  renderAll();
  save();
  note.textContent = 'Settings imported.';
  toast('Settings imported', () => { S = before; colorEditorFor = ''; renderAll(); save(); note.textContent = ''; });
}

// Wallpaper and clock color swatches depend on the mode (and the user's own wallpaper
// colors), so rebuild them when those change.
let swatchMode = '';
const swatchBg = (p) => (layered(p) ? `center / cover ${waveURL(p)}` : `conic-gradient(${p.c[0]}, ${p.c[1]}, ${p.c[2]}, ${p.c[0]})`);
function buildSwatches() {
  const m = mode();
  const sig = `${m}${JSON.stringify(S.wpColors)}${photo?.thumb.length || 0}${JSON.stringify(S.clockCustom)}`;
  if (sig === swatchMode) return;
  swatchMode = sig;
  const set = modeSet(m);
  $('#swatches').replaceChildren(...Object.keys(set.presets).map((key) => {
    const p = presetOf(m, key), custom = !!S.wpColors?.[wpColorKey(m, key)];
    return h('button', {
      'data-key': key, title: custom ? `${p.name} (your colors)` : p.name, 'aria-label': p.name,
      class: custom ? 'custom' : '', style: `background: ${swatchBg(p)}`,
      onclick: () => { S[modeSet().wpKey] = key; update(); },
    });
  }), ...(photo ? [h('span', { class: 'swatch-wrap' }, h('button', {
    'data-key': 'photo', title: 'Your photo', 'aria-label': 'Your photo', class: 'photo',
    style: `background: center / cover url("${photo.thumb}")`, onclick: () => { S[modeSet().wpKey] = 'photo'; update(); },
  }), h('button', { class: 'swatch-x', title: 'Remove your photo', 'aria-label': 'Remove your photo', onclick: (e) => { e.stopPropagation(); removePhoto(); } }))] : []));
  $('#clockColors').replaceChildren(...Object.entries(set.colors).map(([key, c]) => h('button', {
    'data-key': key, title: c.name, 'aria-label': `${c.name} clock`,
    style: `background: rgb(${c.rgb})`,
    onclick: () => { S[modeSet().colorKey] = key; update(); },
  })), ...S.clockCustom[set.mode].map((hex) => h('span', { class: 'swatch-wrap' }, h('button', {
    'data-key': hex, title: `Your color ${hex}`, 'aria-label': `Your color ${hex} clock`, class: 'own',
    style: `background: ${hex}`,
    onclick: () => { S[modeSet().colorKey] = hex; update(); },
  }), h('button', { class: 'swatch-x', title: 'Remove this color', 'aria-label': `Remove your color ${hex}`, onclick: (e) => { e.stopPropagation(); removeClockColor(set.mode, hex); } }))),
  ...(S.clockCustom[set.mode].length < MAX_CLOCK_CUSTOM ? [addClockColor(set)] : []));
}
// "+" opens Chrome's color picker. The clock follows the picker while it's open; closing
// it keeps the color as one of yours and picks it.
function addClockColor(set) {
  const input = h('input', { type: 'color', value: `#${clockRgb(set.mode).split(', ').map((v) => (+v).toString(16).padStart(2, '0')).join('')}`, 'aria-label': 'Add your own clock color' });
  input.addEventListener('input', () => document.documentElement.style.setProperty('--clock-rgb', hexRgb(input.value)));
  input.addEventListener('change', () => {
    const hex = input.value.toLowerCase(), list = S.clockCustom[set.mode];
    if (!list.includes(hex)) S.clockCustom = { ...S.clockCustom, [set.mode]: [...list, hex].slice(-MAX_CLOCK_CUSTOM) };
    S[set.colorKey] = hex;
    update();
  });
  return h('label', { class: 'add-color', title: 'Add your own color' }, input);
}
function removeClockColor(m, hex) {
  const before = { list: S.clockCustom[m], key: S[modeSet(m).colorKey] };
  S.clockCustom = { ...S.clockCustom, [m]: before.list.filter((x) => x !== hex) };
  if (before.key === hex) S[modeSet(m).colorKey] = DEFAULTS[modeSet(m).colorKey];
  update();
  toast('Color removed', () => { S.clockCustom = { ...S.clockCustom, [m]: before.list }; S[modeSet(m).colorKey] = before.key; update(); });
}

// Customize > Wallpaper > colors: a wave wallpaper has a front and a back color (the
// bands blend between them); a glow wallpaper has a background and three glows.
const WAVE_FIELDS = [['from', 'Front'], ['to', 'Back']];
const GLOW_FIELDS = [['base', 'Background'], [0, 'Glow 1'], [1, 'Glow 2'], [2, 'Glow 3']];
let colorEditorFor = '';
function currentColors(p) {
  return p.tones ? { from: p.tones[0], to: p.tones[p.tones.length - 1] } : { base: p.base, c: [...p.c] };
}
function buildColorEditor() {
  $('#wpReset').addEventListener('click', () => {
    const { [wpColorKey(mode(), wallpaperKey(mode()))]: _, ...rest } = S.wpColors;
    S.wpColors = rest;
    colorEditorFor = '';
    update();
  });
}
function drawColorEditor() {
  const m = mode(), key = wallpaperKey(m), p = presetFor(m);
  const sig = `${m}:${key}`;
  // A photo keeps its own colors.
  $('.colors-box').hidden = key === 'photo';
  $('#wpColorsFor').textContent = key === 'photo' ? '' : `· ${presetOf(m, key).name}`;
  $('#wpReset').hidden = !S.wpColors[wpColorKey(m, key)];
  if (sig === colorEditorFor) return; // don't rebuild under a picker that's being dragged
  colorEditorFor = sig;
  const now = currentColors(p);
  const fields = p.tones ? WAVE_FIELDS : GLOW_FIELDS;
  $('#wpColors').replaceChildren(...fields.map(([f, label]) => {
    const input = h('input', { type: 'color', value: typeof f === 'number' ? now.c[f] : now[f], 'aria-label': `${p.name} ${label.toLowerCase()} color` });
    input.addEventListener('input', () => {
      const next = currentColors(presetFor(m));
      if (typeof f === 'number') next.c[f] = input.value; else next[f] = input.value;
      S.wpColors = { ...S.wpColors, [wpColorKey(m, key)]: next };
      update();
    });
    return h('label', {}, input, label);
  }));
}

// Customize > To-do list: pick where the tasks live. Picking a service shows how to
// connect it; once connected, which of its lists to show.
let syncPick = 'local';
function buildSyncSettings() {
  $('#todoSource').querySelectorAll('button').forEach((b) => {
    if (b.dataset.src !== 'local' && !syncOffered(b.dataset.src)) { b.remove(); return; }
    b.addEventListener('click', () => {
      const src = b.dataset.src;
      $('#syncNote').textContent = '';
      if (src === 'local') { syncPick = 'local'; if (todoSync) disconnectSync(); else syncPanel(); return; }
      syncPick = src;
      syncPanel();
      if (src === 'todoist' && !todoSync) $('#todoistToken').focus();
    });
  });
  $('#syncConnect').addEventListener('click', () => connectSync(syncPick));
  $('#todoistToken').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); connectSync('todoist'); } });
  $('#syncList').addEventListener('change', (e) => setSyncList(e.target.value));
  $('#syncDisconnect').addEventListener('click', disconnectSync);
}
function drawSyncSettings() {
  const on = todoSync?.provider || 'local';
  // The lit chip is the one just picked, or else where the tasks live now. Picking a
  // service that isn't connected (even while another is) shows how to connect it.
  const shown = syncPick === 'local' ? on : syncPick;
  const again = shown === on && syncProblem === 'signin'; // connected, but signed out
  const setup = shown !== on || again;
  document.querySelectorAll('#todoSource button').forEach((b) => b.classList.toggle('on', b.dataset.src === shown));
  $('#syncSetup').hidden = !setup;
  $('#todoistSetup').hidden = shown !== 'todoist';
  const who = { todoist: 'Todoist', microsoft: 'Microsoft', google: 'Google' }[shown];
  if (setup) $('#syncConnect').textContent = shown === 'todoist' ? (again ? 'Connect Todoist again' : 'Connect Todoist') : `Sign in ${again ? 'again ' : ''}with ${who}`;
  $('#syncConnected').hidden = on === 'local' || setup;
  if (on !== 'local') {
    const sel = $('#syncList');
    const sig = todoSync.lists.map((l) => l.id).join();
    if (sel.dataset.sig !== sig) { sel.replaceChildren(...todoSync.lists.map((l) => h('option', { value: l.id }, l.name))); sel.dataset.sig = sig; }
    sel.value = todoSync.list;
  }
}

// What each closed group in Customize shows on its row.
function drawSummaries() {
  const m = mode(), p = presetFor(m);
  const fps = S.animated ? `${S.fps} fps${S.speed !== 1 ? ` · ${S.speed}× speed` : ''}` : 'still';
  const set = (id, text) => { $(id).textContent = text; };
  set('#sumWallpaper', `${p.name}${S.wpColors[wpColorKey(m, wallpaperKey(m))] ? ' (yours)' : ''} · ${S.appearance === 'auto' ? 'auto' : S.appearance} · ${fps}`);
  set('#sumGlass', S.solidGlass ? 'Less transparent' : S.liquid ? 'Liquid' : 'Frosted');
  set('#sumClock', `${(FONTS[S.clockFont] || FONTS.tall).name} · ${{ solid: 'solid', clear: 'clear glass', frost: 'frosted' }[S.clockStyle]}`);
  set('#sumGreeting', `${S.greeting ? 'Greeting on' : 'Greeting off'} · quote ${{ off: 'off', caption: 'under clock', widget: 'widget' }[S.quote]}`);
  set('#sumWidgets', `${S.layout.length} on`);
  set('#sumTodo', todoSync ? `${SYNC[todoSync.provider].name}${syncProblem === 'signin' ? ' · sign in again' : ''}` : 'On this computer');
  set('#sumCalendar', calCount ? `${calCount} linked` : 'Not linked');
  set('#sumWeather', S.useLocation ? S.coordsName || 'Your location' : S.city || 'No city yet');
  set('#sumChrome', `Glass Google ${googleOn ? 'on' : 'off'}`);
  set('#sumBackup', 'Export or import');
}

function syncPanel() {
  buildSwatches();
  drawColorEditor();
  drawSyncSettings();
  $('#wallpaperTitle').textContent = mode() === 'light' ? 'Light mode wallpaper' : 'Dark mode wallpaper';
  drawSummaries();
  const set = modeSet();
  const mark = (sel, active) => document.querySelectorAll(`${sel} button`).forEach((b) => b.classList.toggle('on', active(b)));
  mark('#swatches', (b) => b.dataset.key === S[set.wpKey]);
  mark('#clockColors', (b) => b.dataset.key === S[set.colorKey]);
  mark('#clockMatch', (b) => b.dataset.key === S[set.colorKey]);
  mark('#appearance', (b) => b.dataset.mode === S.appearance);
  mark('#fonts', (b) => b.dataset.key === S.clockFont);
  drawWidgetRows();
  $('#photoPick').textContent = photo ? 'Choose a different photo' : 'Use your own photo';
  mark('#styles', (b) => b.dataset.style === S.clockStyle);
  mark('#quoteModes', (b) => b.dataset.mode === S.quote);
  mark('#topBar', (b) => b.dataset.bar === S.topBar);
  mark('#motion', (b) => Number(b.dataset.fps) === (S.animated ? S.fps : 0));
  $('#liquid').checked = S.liquid;
  $('#solid').checked = S.solidGlass;
  $('#hour24').checked = S.hour24;
  $('#blur').value = S.blur;
  $('#speed').value = S.speed;
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
startSync();
loadPhoto();

(async () => {
  focusState = freshFocus(await cacheGet('focus'));
  drawFocus();
  if (!hasChrome) return;
  const stored = migrate(await chrome.storage.sync.get(null));
  if (JSON.stringify(stored) !== JSON.stringify(S)) { S = stored; mirror(); renderAll(); }
  chrome.storage.sync.remove('widgets'); // replaced by "layout"

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.focus) { focusState = freshFocus(changes.focus.newValue); drawFocus(); }
    if (area === 'local' && changes.photo) loadPhoto();
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
const placed = (k) => S.layout.some((w) => w.k === k);
const widgetEl = (k) => `.widget[data-k="${k}"]`;

// Small setup forms shown inside the tour card. Each returns the elements to show.
const TOUR_SETUP = {
  pick() {
    const keys = ['weather', 'calendar', 'todo', 'notes', 'focus', 'countdown', 'sites', 'recent'];
    const chips = h('div', { class: 'chips' }, ...keys.map((k) => h('button', {
      class: placed(k) ? 'on' : '',
      onclick: (e) => {
        // Re-arrange the whole set each time, so it stays tidy whatever is picked.
        const keys = S.layout.map((w) => w.k);
        S.layout = tidyLayout(placed(k) ? keys.filter((x) => x !== k) : [...keys, k]);
        e.currentTarget.classList.toggle('on', placed(k));
        update();
        renderWidgets();
        showTourStep(tourStep); // re-measure around the new widgets
      },
    }, WIDGETS[k].name)));
    return [chips];
  },
  weather() {
    const status = h('div', { class: 'muted tour-status' }, S.useLocation && S.coordsName ? `Showing ${S.coordsName}.` : S.city ? `Showing ${S.city}.` : '');
    const city = h('input', { placeholder: 'Your city, like London, ON', value: S.city, 'aria-label': 'City' });
    const setCity = () => {
      const v = city.value.trim();
      if (!v || v === S.city) return;
      S.city = v; S.useLocation = false;
      update(); renderWidgets();
      status.textContent = `Showing ${v}.`;
    };
    city.addEventListener('change', setCity);
    city.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); setCity(); } });
    const here = h('button', { class: 'chip', onclick: async () => {
      if (S.useLocation) { status.textContent = `Showing ${S.coordsName || 'your location'}.`; return; }
      status.textContent = 'Finding you…';
      await useMyLocation();
      status.textContent = S.useLocation ? `Showing ${S.coordsName || 'your location'}.` : $('#locNote').textContent;
    } }, 'Use my location');
    return [h('div', { class: 'tour-form' }, city, here), status];
  },
  calendar() {
    const status = h('div', { class: 'muted tour-status' });
    const link = h('input', { placeholder: "Paste your calendar's iCal link", 'aria-label': 'Calendar link' });
    cacheGet('calLinks').then((l) => { if (l?.length) { link.value = l[0]; status.textContent = 'Calendar linked.'; } });
    const go = h('button', { class: 'chip', onclick: async () => {
      $('#calLinks').value = link.value;
      await saveCalendarLinks();
      status.textContent = $('#calNote').textContent;
    } }, 'Link');
    const help = h('details', { class: 'help' }, h('summary', {}, 'Where do I find it?'),
      h('p', {}, 'Google Calendar: Settings › your calendar › "Secret address in iCal format".'),
      h('p', {}, 'iCloud: in the Calendar app, share the calendar as a Public Calendar and copy the link.'));
    return [h('div', { class: 'tour-form' }, link, go), status, help];
  },
  todo() {
    const status = h('div', { class: 'muted tour-status' });
    const task = h('input', { placeholder: 'Your first task, then press Enter', maxlength: '120', 'aria-label': 'Task' });
    task.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const text = task.value.trim();
      if (!text || !todoAdd(text)) return;
      task.value = '';
      status.textContent = `Added. ${todoList().filter((t) => !t.done).length} on your list.`;
    });
    // Tasks already in Todoist, Microsoft To Do or Google Tasks can show here instead.
    const sync = h('button', { class: 'linkish', onclick: () => { endTour(); openPanelAt('todo', '#todoSource'); } }, 'Use Todoist, Microsoft To Do or Google Tasks instead');
    return [task, status, sync];
  },
  google() {
    const status = h('div', { class: 'muted tour-status' });
    const btn = h('button', { class: 'chip primary', onclick: async () => {
      status.textContent = 'Chrome will ask you to allow it…';
      status.textContent = (await setGlassGoogle(true, { remind: true })) ? 'Glass Google is on. Reload any open Google tabs to see it.' : 'Not turned on. You can turn it on any time in Customize › Chrome and Google.';
      if (googleOn) btn.remove();
    } }, 'Turn on glass Google');
    return [btn, status];
  },
};

// The tour: what each part is, then a quick setup for the widgets that need it.
// Steps with "when" only appear if that widget is on.
const TOUR = [
  { title: 'Welcome to Glass Tab', text: "Let's set things up. It takes about a minute, and you can skip any step.", next: "Let's go", skip: 'Skip setup' },
  { el: '#widgets', title: 'Pick your widgets', text: 'Choose what you want on your new tab. You can change this any time.', setup: 'pick' },
  { el: widgetEl('weather'), when: () => placed('weather'), title: 'Weather', text: 'Type your city, or let Glass Tab use your location.', setup: 'weather' },
  { el: widgetEl('calendar'), when: () => placed('calendar'), title: 'Calendar', text: 'Link your Google or iCloud calendar to see what\'s coming up. The link stays on this computer. It updates every 15 minutes.', setup: 'calendar' },
  { el: widgetEl('todo'), when: () => placed('todo'), title: 'To-do', text: 'Add a task or two. Click a task later to edit it.', setup: 'todo' },
  { el: widgetEl('sites'), when: () => placed('sites'), title: 'Top sites', text: 'The sites you visit most show up here. Add site pins your own, and pinned sites always come first.' },
  { el: '#widgets', title: 'Move and resize', text: 'Press and hold any widget to move it. While editing, the S, M and L buttons change its size and × removes it. Removed something by mistake? Undo shows for a few seconds.' },
  { el: '#search', title: 'Search', text: `Search Google or type a website here. Press / to jump here. On any other site, press ${SHORTCUT} to bring up the same glass search bar.` },
  { el: '#gear', title: 'Customize', text: 'This round button in the corner opens Customize: wallpapers (or your own photo), light or dark, motion, glass, the clock, widgets and more. The box at the top finds any setting.' },
  { when: () => !googleOn && ggState !== 'off', title: 'Make Google glass too', get text() { return GG_PITCH(); }, setup: 'google' },
  { el: '#gear', title: 'A seamless top bar', text: "If the top of the page doesn't blend into Chrome's top bar, open Customize and change Top bar under Chrome and Google: Chrome's own if you have no theme, Glass Tab theme if you added ours." },
  { title: "Chrome's footer", text: 'If Chrome shows a bar along the bottom of this page, you can hide it: right-click the bar and choose "Hide footer on New Tab page". The steps are also in Customize under Chrome and Google.' },
  { title: "You're all set", text: 'Make it yours. You can take this tour again any time from Customize.', next: 'Done' },
];
// What's new: one quiet line after an update, offered once to people who already took the
// setup tour. Raise NEWS_ID (and change the line in newtab.html) when there's something new.
const NEWS_ID = '1.0.7';
let activeTour = TOUR;
const tourSteps = () => activeTour.filter((s) => !s.when || s.when());
let tourStep = -1;
function startTour(steps = TOUR) {
  activeTour = steps;
  tourShown = null;
  $('#panel').hidden = true;
  $('#gear').setAttribute('aria-expanded', 'false');
  setEditing(false);
  $('#footerTip').hidden = true;
  $('#newsTip').hidden = true;
  $('#rate').hidden = true;
  $('#ggNudge').hidden = true;
  closeToast();
  $('#tour').hidden = false;
  showTourStep(0);
}
function endTour() {
  $('#tour').hidden = true;
  tourStep = -1;
  // Finishing either tour covers this update's news, so new users don't see it too.
  try { localStorage.setItem('glassTabTour', '1'); localStorage.setItem('glassTabNews', NEWS_ID); } catch {}
  showFooterTip();
}
let tourShown = null;
function showTourStep(i) {
  const steps = tourSteps();
  i = Math.min(i, steps.length - 1);
  tourStep = i;
  const step = steps[i], ring = $('#tourRing'), card = $('#tourCard');
  // Only rebuild the setup form when the step changes, so typing isn't lost on re-measure.
  if (tourShown !== step) {
    tourShown = step;
    $('#tourExtra').replaceChildren(...(step.setup ? TOUR_SETUP[step.setup]() : []));
    $('#tourTitle').textContent = step.title;
    $('#tourText').textContent = step.text;
  }
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
  $('#tourCount').textContent = `${i + 1} of ${steps.length}`;
  $('#tourNext').textContent = step.next || (i === steps.length - 1 ? 'Done' : 'Next');
  $('#tourSkip').textContent = step.skip || 'Skip tour';
  $('#tourBack').hidden = i === 0;
  $('#tourSkip').hidden = i === steps.length - 1;
  // Card goes below the lit-up part if there's room, otherwise above, otherwise beside.
  const w = Math.min(step.setup ? 380 : 340, innerWidth - 32);
  card.style.width = `${w}px`;
  const h = card.offsetHeight;
  let left = innerWidth / 2 - w / 2, top = innerHeight * 0.45 - h / 2;
  if (box) {
    left = Math.min(innerWidth - w - 16, Math.max(16, box.left + box.width / 2 - w / 2));
    const below = box.bottom + pad + 14, above = box.top - pad - 14 - h;
    if (below + h < innerHeight) top = below;
    else if (above > 16) top = above;
    else {
      // Tall target: sit beside it instead.
      top = Math.max(16, Math.min(innerHeight - h - 16, box.top));
      left = box.right + pad + 14 + w < innerWidth ? box.right + pad + 14 : Math.max(16, box.left - pad - 14 - w);
    }
  }
  Object.assign(card.style, { left: `${left}px`, top: `${top}px` });
  const first = $('#tourExtra input');
  (first && !first.value ? first : $('#tourNext')).focus({ preventScroll: true });
}
$('#tourNext').addEventListener('click', () => (tourStep < tourSteps().length - 1 ? showTourStep(tourStep + 1) : endTour()));
$('#tourBack').addEventListener('click', () => showTourStep(Math.max(0, tourStep - 1)));
$('#tourSkip').addEventListener('click', endTour);
$('#replayTour').addEventListener('click', () => startTour());
addEventListener('resize', () => { if (tourStep >= 0) showTourStep(tourStep); });
document.addEventListener('keydown', (e) => {
  if (tourStep < 0) return;
  if (e.key === 'Escape') endTour();
  if (e.target.closest?.('input, textarea')) return; // arrows move the text cursor there
  if (e.key === 'ArrowRight') $('#tourNext').click();
  if (e.key === 'ArrowLeft' && tourStep > 0) showTourStep(tourStep - 1);
}, true);

// ---------- footer hint ----------
// Chrome adds its own footer to extension new tab pages. Show a one-time hint on
// how to hide it (after the tour); "Got it" dismisses it for good.
function closeNews() {
  $('#newsTip').hidden = true;
  try { localStorage.setItem('glassTabNews', NEWS_ID); } catch {}
}
$('#newsTipLook').addEventListener('click', () => { closeNews(); openPanelAt('wallpaper', '#swatches'); });
$('#newsTipClose').addEventListener('click', closeNews);
function showFooterTip() {
  try { if (!localStorage.getItem('glassTabFooterTip')) $('#footerTip').hidden = false; } catch {}
}
$('#footerTipClose').addEventListener('click', () => {
  $('#footerTip').hidden = true;
  try { localStorage.setItem('glassTabFooterTip', '1'); } catch {}
});

// ---------- glass Google nudge ----------
// Glass Google needs Chrome's permission for google.com, which Chrome only asks for after
// a click, so it can't come on by itself (and each computer asks once). While it's off,
// a card asks people to turn it on. "Not now" asks again in 3 days. Turning it off in
// Customize is a choice, so then the card stays away.
const GG_PITCH = () => (S.glassGoogle
  ? "You use glass Google on another computer. Turn it on here too, so your searches match this page. It's one click."
  : "Give your Google searches the same glass look as this page. It's one click, it's private, and you can turn it off any time.");
const GG_SNOOZE = 3 * 864e5;
async function maybeNudgeGoogle() {
  if (!hasChrome) return false;
  await ggChecked;
  if (googleOn || ggState === 'off' || tourStep >= 0) return false;
  if (Date.now() < ((await cacheGet('ggNudge'))?.next || 0)) return false;
  $('#ggNudgeText').textContent = GG_PITCH();
  $('#ggNudge').hidden = false;
  return true;
}
$('#ggNudgeOn').addEventListener('click', async () => {
  if (await setGlassGoogle(true)) toast('Glass Google is on. Reload Google to see it.');
});
$('#ggNudgeLater').addEventListener('click', () => {
  $('#ggNudge').hidden = true;
  cacheSet('ggNudge', { next: Date.now() + GG_SNOOZE });
});

// ---------- rating and ideas ----------
// After two weeks of use, once: a small card asking for a rating on the Chrome Web
// Store and for ideas. Both are links; nothing is sent from Glass Tab. "Not now" asks
// again in two weeks, "Never" (or using either link) ends it. The dates stay on this computer.
const RATE_AFTER = 14 * 864e5;
let rateState = null;
async function maybeAskRating() {
  if (!hasChrome) return;
  rateState = (await cacheGet('rate')) || null;
  if (!rateState?.since) { rateState = { since: Date.now() }; cacheSet('rate', rateState); return; }
  if (rateState.done || Date.now() < (rateState.next || rateState.since + RATE_AFTER)) return;
  if (tourStep >= 0 || !$('#footerTip').hidden) return; // never over a tour or the footer hint
  $('#rate').hidden = false;
}
function closeRate(how) {
  $('#rate').hidden = true;
  rateState = how === 'later' ? { ...rateState, next: Date.now() + RATE_AFTER } : { ...rateState, done: true };
  cacheSet('rate', rateState);
}
$('#rateStore').href = STORE_REVIEWS;
$('#rateIdea').href = FEEDBACK_URL;
$('#rateStore').addEventListener('click', () => closeRate('done'));
$('#rateIdea').addEventListener('click', () => closeRate('done'));
$('#rateLater').addEventListener('click', () => closeRate('later'));
$('#rateNever').addEventListener('click', () => closeRate('never'));

try {
  // Wait a moment so the widgets have drawn before the tour measures them.
  if (!localStorage.getItem('glassTabTour')) setTimeout(startTour, 600);
  else if (localStorage.getItem('glassTabNews') !== NEWS_ID) $('#newsTip').hidden = false;
  else { showFooterTip(); maybeNudgeGoogle().then((shown) => { if (!shown) maybeAskRating(); }); }
} catch {}
