// Curated dark presets only: every one blends into the themed toolbar.
const PRESETS = {
  aurora:   { name: 'Aurora',   base: '#07080d', c: ['#1d6f8a', '#4a2b7c', '#1e7f62'] },
  midnight: { name: 'Midnight', base: '#05060b', c: ['#1b2a6a', '#0d3f78', '#2a1a52'] },
  ember:    { name: 'Ember',    base: '#0c0707', c: ['#8a2e1e', '#9c5a18', '#4e1628'] },
  dusk:     { name: 'Dusk',     base: '#0c0710', c: ['#8a2f5c', '#4f2a80', '#9a4a62'] },
  forest:   { name: 'Forest',   base: '#050a07', c: ['#1f5e36', '#0f4a46', '#4a6420'] },
  graphite: { name: 'Graphite', base: '#0a0a0c', c: ['#34373f', '#22242a', '#4a4d55'] },
};

// System fonts only, so nothing is downloaded. Mac fonts first, Windows fallbacks after.
const SYSTEM = '"SF Pro Display", -apple-system, "Segoe UI", system-ui, sans-serif';
const FONTS = {
  classic:   { name: 'Classic',   stack: SYSTEM, weight: 200 },
  soft:      { name: 'Soft',      stack: '"Avenir Next", Avenir, "Segoe UI", sans-serif', weight: 300 },
  heavy:     { name: 'Heavy',     stack: SYSTEM, weight: 700 },
  editorial: { name: 'Editorial', stack: 'Didot, "Bodoni 72", Georgia, serif', weight: 400 },
  mono:      { name: 'Mono',      stack: '"SF Mono", Menlo, Consolas, monospace', weight: 200 },
  tall:      { name: 'Tall',      stack: '"Avenir Next Condensed", Bahnschrift, "Arial Narrow", sans-serif', weight: 600 },
  geometric: { name: 'Geometric', stack: 'Futura, "Century Gothic", sans-serif', weight: 500 },
};

// Soft tints only, so the clock never clashes with the wallpapers.
const CLOCK_COLORS = {
  white:    { name: 'White',    rgb: '255, 255, 255' },
  warm:     { name: 'Warm',     rgb: '255, 226, 196' },
  rose:     { name: 'Rose',     rgb: '255, 209, 224' },
  mint:     { name: 'Mint',     rgb: '200, 245, 228' },
  sky:      { name: 'Sky',      rgb: '206, 226, 255' },
  lavender: { name: 'Lavender', rgb: '226, 214, 255' },
};

// Sizes: S = 1 cell, M = 2 cells wide, L = 2 x 2 cells. First size is the default.
const WIDGETS = {
  weather: { name: 'Weather',     sizes: ['S', 'M'] },
  todo:    { name: 'To-do',       sizes: ['M', 'L'] },
  focus:   { name: 'Focus timer', sizes: ['S', 'M'] },
  sites:   { name: 'Top sites',   sizes: ['M', 'L'] },
  recent:  { name: 'Recent tabs', sizes: ['M', 'L'] },
  quote:   { name: 'Quote',       sizes: ['M', 'L'] },
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
  wallpaper: 'aurora', animated: true,
  blur: 18, tint: 10, liquid: true, solidGlass: false,
  clockStyle: 'clear', clockFont: 'tall', clockSize: 140, clockColor: 'white', hour24: false,
  name: '',
  quote: 'caption', // 'off' | 'caption' | 'widget'
  layout: [{ k: 'weather', size: 'S' }, { k: 'todo', size: 'M' }, { k: 'sites', size: 'M' }],
  city: '', units: 'c', useLocation: false, coords: null,
  todos: [],
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
    s.layout = s.widgets.filter((k) => k !== 'quote' && WIDGETS[k]).map((k) => ({ k, size: WIDGETS[k].sizes[0] }));
    if (s.widgets.includes('quote')) { s.quote = 'widget'; s.layout.push({ k: 'quote', size: 'M' }); }
  }
  delete s.widgets;
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
function applyLook() {
  const p = PRESETS[S.wallpaper] || PRESETS.aurora;
  const f = FONTS[S.clockFont] || FONTS.tall;
  // Thin strokes leave no surface to show glass, so glass styles get a heavier weight.
  const weight = S.clockStyle !== 'solid' && f.weight < 400 ? 400 : f.weight;
  const vars = {
    '--base': p.base, '--c1': p.c[0], '--c2': p.c[1], '--c3': p.c[2],
    '--blur': `${S.blur}px`, '--tint': String(S.tint / 100),
    '--clock-font': f.stack, '--clock-weight': String(weight), '--clock-size': `${S.clockSize}px`,
    '--clock-rgb': (CLOCK_COLORS[S.clockColor] || CLOCK_COLORS.white).rgb,
  };
  const cls = [S.animated && 'animated', S.liquid && 'liquid', S.solidGlass && 'solid'].filter(Boolean).join(' ');
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.className = cls;
  $('#clock').className = S.clockStyle;
  try { localStorage.setItem('glassTabLook', JSON.stringify({ vars, cls })); } catch {}
  // Shared with the Glass Google content script.
  const look = { base: p.base, c: p.c, blur: S.blur, tint: S.tint, solid: S.solidGlass };
  if (hasChrome && JSON.stringify(look) !== lastLook) { lastLook = JSON.stringify(look); chrome.storage.local.set({ look }); }
}
let lastLook = '';

// ---------- glass Google search (opt-in, per device) ----------
const GOOGLE = { id: 'glass-google', origins: ['https://www.google.com/*'] };

async function glassGoogleOn() {
  if (!hasChrome) return false;
  const [registered] = await chrome.scripting.getRegisteredContentScripts({ ids: [GOOGLE.id] });
  return !!registered && (await chrome.permissions.contains({ origins: GOOGLE.origins }));
}

async function setGlassGoogle(on) {
  const box = $('#glassGoogle');
  if (!hasChrome) { box.checked = false; return; }
  try {
    if (on) {
      // Must be requested straight from the click, before any other await.
      if (!(await chrome.permissions.request({ origins: GOOGLE.origins }))) { box.checked = false; return; }
      await chrome.scripting.unregisterContentScripts({ ids: [GOOGLE.id] }).catch(() => {});
      await chrome.scripting.registerContentScripts([{
        id: GOOGLE.id, matches: ['https://www.google.com/search*'], css: ['google.css'], js: ['google.js'], runAt: 'document_start',
      }]);
      $('#googleNote').textContent = 'On. Reload any open Google search tabs to see it.';
    } else {
      await chrome.scripting.unregisterContentScripts({ ids: [GOOGLE.id] }).catch(() => {});
      await chrome.permissions.remove({ origins: GOOGLE.origins }).catch(() => {});
    }
  } catch (err) {
    $('#googleNote').textContent = `Couldn't turn this on: ${err.message}`;
  }
  box.checked = await glassGoogleOn();
}

// ---------- clock ----------
function updateClock() {
  const d = new Date();
  let hr = d.getHours();
  const part = hr < 5 ? 'evening' : hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
  if (!S.hour24) hr = hr % 12 || 12;
  $('#clock').textContent = `${hr}:${String(d.getMinutes()).padStart(2, '0')}`;
  $('#date').textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  $('#greeting').textContent = S.name ? `Good ${part}, ${S.name}` : '';
  const [text, who] = todaysQuote();
  $('#quoteCaption').textContent = S.quote === 'caption' ? `"${text}" — ${who}` : '';
}
function tick() {
  updateClock();
  setTimeout(tick, 1000 - (Date.now() % 1000));
}

// ---------- widgets ----------
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

async function getWeather() {
  const here = S.useLocation && S.coords;
  const key = here ? `${S.coords.lat.toFixed(2)},${S.coords.lon.toFixed(2)}|${S.units}` : `${S.city}|${S.units}`;
  const cached = await cacheGet('weather');
  if (cached && cached.key === key && Date.now() - cached.at < 30 * 60e3) return cached.data;

  let lat, lon, place;
  if (here) {
    ({ lat, lon } = S.coords);
    place = 'Current location';
  } else {
    const geo = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(S.city)}&count=1`)).json();
    const r = geo.results?.[0];
    if (!r) throw new Error('City not found');
    lat = r.latitude; lon = r.longitude; place = r.name;
  }
  const unit = S.units === 'f' ? '&temperature_unit=fahrenheit' : '';
  const j = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=3${unit}`)).json();
  const data = {
    place,
    temp: j.current.temperature_2m,
    label: wxLabel(j.current.weather_code),
    days: j.daily.time.map((t, i) => ({ t, max: j.daily.temperature_2m_max[i], min: j.daily.temperature_2m_min[i] })),
  };
  cacheSet('weather', { key, at: Date.now(), data });
  return data;
}

function weatherWidget(size) {
  const body = h('div', { class: 'wx' }, S.city || S.useLocation ? 'Loading…' : 'Add a city or use your location in settings.');
  if (S.city || S.useLocation) {
    getWeather()
      .then((d) => {
        const now = h('div', {},
          h('div', { class: 'wx-temp' }, `${Math.round(d.temp)}°`),
          h('div', {}, d.label),
          h('div', { class: 'muted' }, d.place));
        if (size === 'S') { body.replaceChildren(now); return; }
        const days = h('div', { class: 'wx-days' }, ...d.days.flatMap((day, i) => [
          h('span', {}, i === 0 ? 'Today' : new Date(`${day.t}T12:00`).toLocaleDateString(undefined, { weekday: 'short' })),
          h('span', {}, `${Math.round(day.max)}° / ${Math.round(day.min)}°`),
        ]));
        body.replaceChildren(now, days);
      })
      .catch(() => { body.textContent = "Couldn't load weather. Check the city name."; });
  }
  return h('div', {}, h('h3', {}, 'Weather'), body);
}

function todoWidget() {
  const list = h('ul', { class: 'todo' });
  const draw = () => list.replaceChildren(...S.todos.map((t, i) => h('li', { class: t.done ? 'done' : '' },
    h('button', { class: 'check', 'aria-label': t.done ? 'Mark not done' : 'Mark done', onclick: () => { t.done = !t.done; save(); draw(); } }),
    h('span', {}, t.text),
    h('button', { class: 'del', 'aria-label': 'Delete task', onclick: () => { S.todos.splice(i, 1); save(); draw(); } }, '×'),
  )));
  draw();
  const input = h('input', { placeholder: 'Add a task', maxlength: '80', 'aria-label': 'Add a task' });
  const form = h('form', { onsubmit: (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || S.todos.length >= 20) return;
    S.todos.push({ text, done: false });
    input.value = '';
    save();
    draw();
  } }, input);
  return h('div', {}, h('h3', {}, 'Today'), list, form);
}

// Focus timer state lives in chrome.storage.local so every tab shows the same timer.
// The background worker fires the "done" notification even if no tab is open.
const FOCUS_SECONDS = 25 * 60;
let focusState = null;
const focusViews = new Set();

function freshFocus(f) {
  const today = new Date().toDateString();
  const s = { endAt: null, left: FOCUS_SECONDS, day: today, done: 0, ...f };
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
  const reset = h('button', { class: 'chip', onclick: () => setFocus({ ...focusState, endAt: null, left: FOCUS_SECONDS }) }, 'Reset');
  const count = h('div', { class: 'muted' });
  start.onclick = () => {
    const f = focusState;
    if (f.endAt) setFocus({ ...f, endAt: null, left: focusLeft(f) });
    else setFocus({ ...f, endAt: Date.now() + f.left * 1000 });
  };
  const el = h('div', { class: 'center' }, h('h3', {}, 'Focus'), time, h('div', { class: 'row' }, start, reset), size === 'M' ? count : null);
  const draw = () => {
    if (!el.isConnected && focusViews.has(draw) && el.dataset.drawn) { focusViews.delete(draw); return; }
    el.dataset.drawn = '1';
    if (!focusState) return;
    let left = focusLeft(focusState);
    // Without Chrome (preview), finish the session here instead of in the background worker.
    if (!hasChrome && focusState.endAt && left === 0) {
      focusState = freshFocus({ ...focusState, endAt: null, left: FOCUS_SECONDS, done: focusState.done + 1 });
      left = FOCUS_SECONDS;
    }
    time.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
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

const RENDER = { weather: weatherWidget, todo: todoWidget, focus: focusWidget, sites: sitesWidget, recent: recentWidget, quote: quoteWidget };

// ---------- layout and edit mode ----------
// Widgets are identified by key (each widget appears at most once).
function removeWidget(k) {
  S.layout = S.layout.filter((w) => w.k !== k);
  if (k === 'quote') S.quote = 'off';
  update();
  renderWidgets();
}
function cycleSize(k) {
  const w = S.layout.find((x) => x.k === k);
  const sizes = WIDGETS[k].sizes;
  w.size = sizes[(sizes.indexOf(w.size) + 1) % sizes.length];
  save();
  renderWidgets();
}

function buildWidget({ k, size }) {
  const el = RENDER[k](size);
  el.classList.add('widget', 'glass', `size-${size}`);
  el.dataset.k = k;
  const ctl = h('div', { class: 'wctl' });
  if (WIDGETS[k].sizes.length > 1) ctl.append(h('button', { 'aria-label': `Change ${WIDGETS[k].name} size`, onclick: () => cycleSize(k) }, size));
  ctl.append(h('button', { 'aria-label': `Remove ${WIDGETS[k].name}`, onclick: () => removeWidget(k) }, '×'));
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
async function useMyLocation() {
  const btn = $('#useLocation');
  try {
    // Chrome shows its normal location prompt for the new tab page; no manifest
    // permission (and no install warning) needed.
    btn.textContent = 'Finding you…';
    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 60000 }));
    S.coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    S.useLocation = true;
    S.city = '';
    update();
    renderWidgets();
  } catch {
    btn.textContent = "Couldn't get your location";
  }
}

function setQuoteMode(mode) {
  S.quote = mode;
  const i = S.layout.findIndex((w) => w.k === 'quote');
  if (mode === 'widget' && i < 0) S.layout.push({ k: 'quote', size: 'M' });
  if (mode !== 'widget' && i >= 0) S.layout.splice(i, 1);
  update();
  renderWidgets();
}

function buildPanel() {
  for (const [key, p] of Object.entries(PRESETS)) {
    $('#swatches').append(h('button', {
      'data-key': key, title: p.name, 'aria-label': p.name,
      style: `background: conic-gradient(${p.c[0]}, ${p.c[1]}, ${p.c[2]}, ${p.c[0]})`,
      onclick: () => { S.wallpaper = key; update(); },
    }));
  }
  for (const [key, c] of Object.entries(CLOCK_COLORS)) {
    $('#clockColors').append(h('button', {
      'data-key': key, title: c.name, 'aria-label': `${c.name} clock`,
      style: `background: rgb(${c.rgb})`,
      onclick: () => { S.clockColor = key; update(); },
    }));
  }
  for (const [key, f] of Object.entries(FONTS)) {
    $('#fonts').append(h('button', { 'data-key': key, style: `font-family: ${f.stack.replaceAll('"', "'")}`, onclick: () => { S.clockFont = key; update(); } }, f.name));
  }
  for (const [key, w] of Object.entries(WIDGETS)) {
    if (key === 'quote') continue; // placed with its own control
    $('#widgetChips').append(h('button', { 'data-key': key, onclick: () => {
      const i = S.layout.findIndex((x) => x.k === key);
      if (i >= 0) S.layout.splice(i, 1);
      else S.layout.push({ k: key, size: w.sizes[0] });
      update();
      renderWidgets();
    } }, w.name));
  }
  $('#styles').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { S.clockStyle = b.dataset.style; update(); }));
  $('#quoteModes').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => setQuoteMode(b.dataset.mode)));

  const bind = (id, key, prop, cast = (v) => v) => $(id).addEventListener('input', (e) => { S[key] = cast(e.target[prop]); update(); });
  bind('#animated', 'animated', 'checked');
  bind('#liquid', 'liquid', 'checked');
  bind('#solid', 'solidGlass', 'checked');
  bind('#hour24', 'hour24', 'checked');
  bind('#blur', 'blur', 'value', Number);
  bind('#tint', 'tint', 'value', Number);
  bind('#size', 'clockSize', 'value', Number);
  bind('#name', 'name', 'value', (v) => v.trim());
  $('#city').addEventListener('change', (e) => { S.city = e.target.value.trim(); S.useLocation = false; update(); renderWidgets(); });
  $('#units').addEventListener('change', (e) => { S.units = e.target.value; update(); renderWidgets(); });
  $('#useLocation').addEventListener('click', useMyLocation);
  $('#glassGoogle').addEventListener('change', (e) => setGlassGoogle(e.target.checked));
  glassGoogleOn().then((on) => { $('#glassGoogle').checked = on; });
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

function syncPanel() {
  const mark = (sel, active) => document.querySelectorAll(`${sel} button`).forEach((b) => b.classList.toggle('on', active(b)));
  mark('#swatches', (b) => b.dataset.key === S.wallpaper);
  mark('#clockColors', (b) => b.dataset.key === S.clockColor);
  mark('#fonts', (b) => b.dataset.key === S.clockFont);
  mark('#widgetChips', (b) => S.layout.some((w) => w.k === b.dataset.key));
  mark('#styles', (b) => b.dataset.style === S.clockStyle);
  mark('#quoteModes', (b) => b.dataset.mode === S.quote);
  $('#animated').checked = S.animated;
  $('#liquid').checked = S.liquid;
  $('#solid').checked = S.solidGlass;
  $('#hour24').checked = S.hour24;
  $('#blur').value = S.blur;
  $('#tint').value = S.tint;
  $('#size').value = S.clockSize;
  if (document.activeElement !== $('#name')) $('#name').value = S.name;
  $('#city').value = S.city;
  $('#units').value = S.units;
  $('#useLocation').textContent = S.useLocation ? 'Using your location' : 'Use my location';
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
