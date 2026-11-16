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

const WIDGETS = { weather: 'Weather', todo: 'To-do', focus: 'Focus timer', sites: 'Top sites', recent: 'Recent tabs', quote: 'Quote' };
const MAX_WIDGETS = 4;

const QUOTES = [
  ['Simplicity is the ultimate sophistication.', 'Leonardo da Vinci'],
  ['Well begun is half done.', 'Aristotle'],
  ['Nothing is softer or more flexible than water, yet nothing can resist it.', 'Lao Tzu'],
  ['The secret of getting ahead is getting started.', 'Mark Twain'],
  ['What we think, we become.', 'Buddha'],
  ['Dwell on the beauty of life.', 'Marcus Aurelius'],
  ['Quality is not an act, it is a habit.', 'Aristotle'],
];

const DEFAULTS = {
  wallpaper: 'aurora', animated: true,
  blur: 18, tint: 10, liquid: true,
  clockStyle: 'clear', clockFont: 'tall', clockSize: 140, hour24: false,
  widgets: ['weather', 'todo', 'sites'],
  city: '', units: 'c',
  todos: [],
};

const $ = (s) => document.querySelector(s);
const hasChrome = typeof chrome !== 'undefined' && !!chrome.storage;
let S;

// ---------- storage ----------
async function load() {
  if (hasChrome) return { ...DEFAULTS, ...(await chrome.storage.sync.get(null)) };
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('glassTab') || '{}') }; } catch { return { ...DEFAULTS }; }
}

let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (hasChrome) chrome.storage.sync.set(S);
    else try { localStorage.setItem('glassTab', JSON.stringify(S)); } catch {}
  }, 300);
}

async function cacheGet(key) {
  if (hasChrome) return (await chrome.storage.local.get(key))[key];
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
function cacheSet(key, value) {
  if (hasChrome) chrome.storage.local.set({ [key]: value });
  else try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
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

// ---------- look ----------
function applyLook() {
  const root = document.documentElement.style;
  const p = PRESETS[S.wallpaper] || PRESETS.aurora;
  root.setProperty('--base', p.base);
  p.c.forEach((c, i) => root.setProperty(`--c${i + 1}`, c));
  root.setProperty('--blur', `${S.blur}px`);
  root.setProperty('--tint', S.tint / 100);

  const f = FONTS[S.clockFont] || FONTS.tall;
  // Thin strokes leave no surface to show glass, so glass styles get a heavier weight.
  const weight = S.clockStyle !== 'solid' && f.weight < 400 ? 400 : f.weight;
  root.setProperty('--clock-font', f.stack);
  root.setProperty('--clock-weight', weight);
  root.setProperty('--clock-size', `${S.clockSize}px`);
  $('#clock').className = S.clockStyle;

  document.body.classList.toggle('animated', S.animated);
  document.body.classList.toggle('liquid', S.liquid);
}

// ---------- clock ----------
function tick() {
  const d = new Date();
  let hr = d.getHours();
  if (!S.hour24) hr = hr % 12 || 12;
  $('#clock').textContent = `${hr}:${String(d.getMinutes()).padStart(2, '0')}`;
  $('#date').textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  setTimeout(tick, 1000 - d.getMilliseconds());
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
  const key = `${S.city}|${S.units}`;
  const cached = await cacheGet('weather');
  if (cached && cached.key === key && Date.now() - cached.at < 30 * 60e3) return cached.data;

  const geo = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(S.city)}&count=1`)).json();
  const place = geo.results?.[0];
  if (!place) throw new Error('City not found');
  const unit = S.units === 'f' ? '&temperature_unit=fahrenheit' : '';
  const j = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1${unit}`)).json();
  const data = {
    place: place.name,
    temp: j.current.temperature_2m,
    label: wxLabel(j.current.weather_code),
    max: j.daily.temperature_2m_max[0],
    min: j.daily.temperature_2m_min[0],
  };
  cacheSet('weather', { key, at: Date.now(), data });
  return data;
}

function weatherWidget() {
  const body = h('div', {}, S.city ? 'Loading…' : 'Add your city in settings.');
  if (S.city) {
    getWeather()
      .then((d) => body.replaceChildren(
        h('div', { class: 'wx-temp' }, `${Math.round(d.temp)}°`),
        h('div', {}, d.label),
        h('div', { class: 'muted' }, `${d.place} · H ${Math.round(d.max)}° L ${Math.round(d.min)}°`),
      ))
      .catch(() => { body.textContent = "Couldn't load weather. Check the city name."; });
  }
  return h('div', { class: 'widget glass' }, h('h3', {}, 'Weather'), body);
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
  return h('div', { class: 'widget glass' }, h('h3', {}, 'Today'), list, form);
}

const FOCUS_SECONDS = 25 * 60;
const focus = { left: FOCUS_SECONDS, timer: null, draw: () => {} };
function stopFocus() { clearInterval(focus.timer); focus.timer = null; }

function focusWidget() {
  const time = h('div', { class: 'focus-time' });
  const start = h('button', { class: 'chip' });
  const reset = h('button', { class: 'chip', onclick: () => { stopFocus(); focus.left = FOCUS_SECONDS; focus.draw(); } }, 'Reset');
  focus.draw = () => {
    time.textContent = `${Math.floor(focus.left / 60)}:${String(focus.left % 60).padStart(2, '0')}`;
    start.textContent = focus.timer ? 'Pause' : 'Start';
  };
  start.onclick = () => {
    if (focus.timer) stopFocus();
    else focus.timer = setInterval(() => {
      focus.left -= 1;
      if (focus.left <= 0) { stopFocus(); focus.left = FOCUS_SECONDS; }
      focus.draw();
    }, 1000);
    focus.draw();
  };
  focus.draw();
  return h('div', { class: 'widget glass center' }, h('h3', {}, 'Focus'), time, h('div', { class: 'row' }, start, reset));
}

function sitesWidget() {
  const grid = h('div', { class: 'sites' });
  if (hasChrome && chrome.topSites) {
    chrome.topSites.get((list) => grid.replaceChildren(...list.slice(0, 8).map((s) =>
      h('a', { class: 'site', href: s.url, title: s.title }, h('img', { src: favicon(s.url), alt: '' }), h('span', {}, s.title)))));
  } else { grid.className = ''; grid.textContent = 'Available when installed in Chrome.'; }
  return h('div', { class: 'widget glass' }, h('h3', {}, 'Top sites'), grid);
}

function recentWidget() {
  const list = h('div', {});
  if (hasChrome && chrome.sessions) {
    chrome.sessions.getRecentlyClosed({ maxResults: 6 }, (items) => {
      const tabs = items.filter((i) => i.tab).slice(0, 5);
      if (!tabs.length) { list.textContent = 'Nothing closed yet.'; return; }
      list.replaceChildren(...tabs.map(({ tab }) => h('button', { class: 'recent', title: tab.url, onclick: () => chrome.sessions.restore(tab.sessionId) },
        h('img', { src: favicon(tab.url), alt: '' }), h('span', {}, tab.title || tab.url))));
    });
  } else list.textContent = 'Available when installed in Chrome.';
  return h('div', { class: 'widget glass' }, h('h3', {}, 'Recently closed'), list);
}

function quoteWidget() {
  const day = Math.floor(Date.now() / 86400000);
  const [text, who] = QUOTES[day % QUOTES.length];
  return h('div', { class: 'widget glass' }, h('div', { class: 'quote' }, `"${text}"`), h('div', { class: 'muted' }, who));
}

const RENDER = { weather: weatherWidget, todo: todoWidget, focus: focusWidget, sites: sitesWidget, recent: recentWidget, quote: quoteWidget };

function renderWidgets() {
  $('#widgets').replaceChildren(...S.widgets.filter((k) => RENDER[k]).map((k) => RENDER[k]()));
}

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
function buildPanel() {
  for (const [key, p] of Object.entries(PRESETS)) {
    $('#swatches').append(h('button', {
      'data-key': key, title: p.name, 'aria-label': p.name,
      style: `background: conic-gradient(${p.c[0]}, ${p.c[1]}, ${p.c[2]}, ${p.c[0]})`,
      onclick: () => { S.wallpaper = key; update(); },
    }));
  }
  for (const [key, f] of Object.entries(FONTS)) {
    $('#fonts').append(h('button', { 'data-key': key, style: `font-family: ${f.stack.replaceAll('"', "'")}`, onclick: () => { S.clockFont = key; update(); } }, f.name));
  }
  for (const [key, name] of Object.entries(WIDGETS)) {
    const btn = h('button', { 'data-key': key, onclick: () => {
      const i = S.widgets.indexOf(key);
      if (i >= 0) S.widgets.splice(i, 1);
      else if (S.widgets.length < MAX_WIDGETS) S.widgets.push(key);
      else { btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); return; }
      update(); renderWidgets();
    } }, name);
    $('#widgetChips').append(btn);
  }
  $('#styles').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { S.clockStyle = b.dataset.style; update(); }));

  const bind = (id, key, prop, cast = (v) => v) => $(id).addEventListener('input', (e) => { S[key] = cast(e.target[prop]); update(); });
  bind('#animated', 'animated', 'checked');
  bind('#liquid', 'liquid', 'checked');
  bind('#hour24', 'hour24', 'checked');
  bind('#blur', 'blur', 'value', Number);
  bind('#tint', 'tint', 'value', Number);
  bind('#size', 'clockSize', 'value', Number);
  $('#city').addEventListener('change', (e) => { S.city = e.target.value.trim(); save(); renderWidgets(); });
  $('#units').addEventListener('change', (e) => { S.units = e.target.value; save(); renderWidgets(); });

  const panel = $('#panel'), gear = $('#gear');
  const setOpen = (open) => { panel.hidden = !open; gear.setAttribute('aria-expanded', open); };
  gear.addEventListener('click', () => setOpen(panel.hidden));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target) && !gear.contains(e.target)) setOpen(false); });
}

function syncPanel() {
  const mark = (sel, active) => document.querySelectorAll(`${sel} button`).forEach((b) => b.classList.toggle('on', active(b)));
  mark('#swatches', (b) => b.dataset.key === S.wallpaper);
  mark('#fonts', (b) => b.dataset.key === S.clockFont);
  mark('#widgetChips', (b) => S.widgets.includes(b.dataset.key));
  mark('#styles', (b) => b.dataset.style === S.clockStyle);
  $('#animated').checked = S.animated;
  $('#liquid').checked = S.liquid;
  $('#hour24').checked = S.hour24;
  $('#blur').value = S.blur;
  $('#tint').value = S.tint;
  $('#size').value = S.clockSize;
  $('#city').value = S.city;
  $('#units').value = S.units;
}

function update() {
  applyLook();
  syncPanel();
  save();
}

// ---------- init ----------
(async () => {
  S = await load();
  buildPanel();
  applyLook();
  syncPanel();
  tick();
  renderWidgets();
})();
