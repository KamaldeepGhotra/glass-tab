// Injected into the current tab when the shortcut is pressed.
// Runs again on every press, so it toggles the bar if it already exists.
(() => {
  if (window.__glassBar) { window.__glassBar.toggle(); return; }

  const host = document.createElement('glass-bar-host');
  host.style.cssText = 'all: initial; position: fixed; inset: 0; z-index: 2147483647; display: none;';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `
<style>
  :host { all: initial; }
  * { box-sizing: border-box; }
  .scrim { position: fixed; inset: 0; }
  .bar {
    position: fixed; left: 50%; top: 18vh; transform: translateX(-50%);
    width: min(680px, 90vw); border-radius: 26px; padding: 6px;
    font: 15px -apple-system, "SF Pro Text", "Segoe UI", system-ui, sans-serif;
    color: var(--fg);
    background: var(--glass);
    backdrop-filter: blur(var(--blur)) saturate(180%);
    border: 1px solid var(--edge);
    box-shadow: inset 0 1px 0 var(--shine), inset 0 -1px 0 rgba(255,255,255,.06), 0 24px 60px rgba(0,0,0,.28), 0 2px 8px rgba(0,0,0,.12);
    animation: pop .22s cubic-bezier(.2,.9,.3,1.2);
  }
  /* Less blur in liquid mode so the bending stays visible, like iOS. */
  .liquid .bar { backdrop-filter: url(#gb-liquid) blur(calc(var(--blur) / 3)) saturate(180%); }
  .solid .bar { backdrop-filter: none; }
  @keyframes pop { from { opacity: 0; transform: translateX(-50%) scale(.96); } }
  @media (prefers-reduced-motion: reduce) { .bar { animation: none; } }
  .light { --fg: #111; --sub: rgba(0,0,0,.55); --edge: rgba(255,255,255,.7); --shine: rgba(255,255,255,.9); --hover: rgba(0,0,0,.07); }
  .dark  { --fg: #fff; --sub: rgba(255,255,255,.6); --edge: rgba(255,255,255,.18); --shine: rgba(255,255,255,.3); --hover: rgba(255,255,255,.1); }
  .row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; }
  .row svg { flex: none; opacity: .75; }
  input { flex: 1; min-width: 0; background: none; border: 0; outline: 0; color: var(--fg); font: inherit; font-size: 18px; }
  input::placeholder { color: var(--sub); }
  ul { list-style: none; margin: 0; padding: 0; }
  ul:not(:empty) { border-top: 1px solid var(--hover); padding-top: 4px; margin-top: 2px; }
  li { display: flex; align-items: center; gap: 12px; padding: 9px 14px; border-radius: 18px; cursor: pointer; }
  li.sel { background: var(--hover); }
  li img, li .ic { width: 18px; height: 18px; flex: none; display: grid; place-items: center; }
  .txt { flex: 1; min-width: 0; }
  .title, .url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .url { font-size: 12px; color: var(--sub); }
  .hint { font-size: 12px; color: var(--sub); flex: none; }
</style>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="gb-liquid" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="4" result="noise"/>
    <feGaussianBlur in="noise" stdDeviation="2" result="soft"/>
    <feDisplacementMap in="SourceGraphic" in2="soft" scale="60" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
<div class="wrap">
  <div class="scrim"></div>
  <div class="bar" role="dialog" aria-label="Glass search">
    <div class="row">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <input placeholder="Search, type a URL, or find a tab" autocomplete="off" spellcheck="false" aria-label="Search">
    </div>
    <ul role="listbox"></ul>
  </div>
</div>`;

  const wrap = root.querySelector('.wrap');
  const input = root.querySelector('input');
  const list = root.querySelector('ul');
  let items = [];
  let sel = 0;
  let lastFocus = null;

  const SEARCH_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const LINK_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/></svg>';

  function pageIsLight() {
    for (const el of [document.body, document.documentElement]) {
      if (!el) continue;
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (m && (m[3] === undefined || +m[3] > 0)) {
        const [r, g, b] = m.map(Number);
        return 0.299 * r + 0.587 * g + 0.114 * b > 150;
      }
    }
    return true; // transparent page background renders white
  }

  function favicon(url) {
    return `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${encodeURIComponent(url)}&size=32`;
  }

  // Small arithmetic parser (no eval): + - * / % ^ and parentheses.
  function calc(q) {
    const src = q.replace(/,/g, '').replace(/\s+/g, '');
    if (!/^[\d+\-*/%^().]+$/.test(src) || !/\d[+\-*/%^]+[\d(.]/.test(src)) return null;
    let i = 0;
    const peek = () => src[i];
    const num = () => {
      if (peek() === '(') { i++; const v = expr(); if (src[i++] !== ')') throw 0; return v; }
      const m = /^\d*\.?\d+/.exec(src.slice(i));
      if (!m) throw 0;
      i += m[0].length;
      return parseFloat(m[0]);
    };
    const unary = () => (peek() === '-' ? (i++, -unary()) : num());
    const power = () => { const b = unary(); return peek() === '^' ? (i++, b ** power()) : b; };
    const term = () => {
      let v = power();
      while ('*/%'.includes(peek()) && peek()) { const op = src[i++]; const r = power(); v = op === '*' ? v * r : op === '/' ? v / r : v % r; }
      return v;
    };
    const expr = () => {
      let v = term();
      while (peek() === '+' || peek() === '-') { const op = src[i++]; const r = term(); v = op === '+' ? v + r : v - r; }
      return v;
    };
    try {
      const v = expr();
      return i === src.length && Number.isFinite(v) ? Number(v.toPrecision(12)) : null;
    } catch { return null; }
  }

  // Unit conversion: "5 km in mi", "20c to f", "3 cups in ml". Length, weight,
  // volume and temperature.
  const UNITS = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254, yd: 0.9144 },
    weight: { g: 1, kg: 1000, mg: 0.001, lb: 453.59237, oz: 28.349523125, st: 6350.29318 },
    volume: { l: 1, ml: 0.001, gal: 3.785411784, qt: 0.946352946, pt: 0.473176473, cup: 0.2365882365, floz: 0.0295735295625 },
  };
  const UNIT_NAMES = {
    meter: 'm', meters: 'm', metre: 'm', metres: 'm', kilometer: 'km', kilometers: 'km', kilometre: 'km', kilometres: 'km', kms: 'km',
    centimeter: 'cm', centimeters: 'cm', millimeter: 'mm', millimeters: 'mm', mile: 'mi', miles: 'mi', foot: 'ft', feet: 'ft',
    inch: 'in', inches: 'in', yard: 'yd', yards: 'yd', gram: 'g', grams: 'g', kilogram: 'kg', kilograms: 'kg', kgs: 'kg',
    pound: 'lb', pounds: 'lb', lbs: 'lb', ounce: 'oz', ounces: 'oz', stone: 'st', liter: 'l', liters: 'l', litre: 'l', litres: 'l',
    milliliter: 'ml', milliliters: 'ml', gallon: 'gal', gallons: 'gal', quart: 'qt', quarts: 'qt', pint: 'pt', pints: 'pt', cups: 'cup',
    c: 'c', '°c': 'c', celsius: 'c', f: 'f', '°f': 'f', fahrenheit: 'f', k: 'k', kelvin: 'k',
  };
  const TEMPS = { c: [(v) => v, (v) => v], f: [(v) => (v - 32) * 5 / 9, (v) => v * 9 / 5 + 32], k: [(v) => v - 273.15, (v) => v + 273.15] };
  function convert(q) {
    const m = q.toLowerCase().replace(/,/g, '').match(/^(-?\d*\.?\d+)\s*([a-z°]+)\s+(?:in|to|as)\s+([a-z°]+)$/);
    if (!m) return null;
    const [, n, a, b] = m, from = UNIT_NAMES[a] || a, to = UNIT_NAMES[b] || b, v = parseFloat(n);
    let out;
    if (TEMPS[from] && TEMPS[to]) out = TEMPS[to][1](TEMPS[from][0](v));
    else {
      const kind = Object.values(UNITS).find((u) => u[from] && u[to]);
      if (!kind) return null;
      out = v * kind[from] / kind[to];
    }
    out = Number(out.toPrecision(6));
    const label = (u) => (u === 'k' ? ' K' : TEMPS[u] ? `°${u.toUpperCase()}` : ` ${u}`);
    return { value: out, text: `${v.toLocaleString()}${label(from)} = ${out.toLocaleString(undefined, { maximumFractionDigits: 6 })}${label(to)}` };
  }

  function copy(text) {
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  // A web address, or text that is clearly a site: example.com, localhost:3000,
  // 192.168.1.1:8080. Words like node.js or readme.md are searched instead.
  // The same code is in bar.js and newtab.js: keep them in step.
  const FILE_ENDINGS = /^(js|ts|py|md|txt|json|html?|css|exe|pdf|png|jpe?g|gif|zip|sh|rb|rs|cpp|java|php|swift|kt|mp[34]|docx?|xlsx?|pptx?)$/i;
  function looksLikeUrl(q) {
    if (/^https?:\/\//i.test(q)) return true;
    if (/\s/.test(q)) return false;
    const host = q.split(/[/?#]/)[0];
    if (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?$/i.test(host)) return true;
    const m = host.match(/^[^.:]+(\.[^.:]+)*\.([a-z]{2,24}|xn--[a-z0-9-]+)(:\d+)?$/i);
    return !!m && !FILE_ENDINGS.test(m[2]);
  }
  // Sites on this computer or the local network usually don't have https.
  function urlFor(q) {
    if (/^https?:\/\//i.test(q)) return q;
    return /^(localhost|\d{1,3}(\.\d{1,3}){3})([:/?#]|$)/i.test(q) ? `http://${q}` : `https://${q}`;
  }

  function render() {
    list.replaceChildren(...items.map((it, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      if (i === sel) li.className = 'sel';
      let icon;
      if (it.url) {
        icon = document.createElement('img');
        icon.src = favicon(it.url);
        icon.alt = '';
        icon.onerror = () => icon.replaceWith(Object.assign(document.createElement('span'), { className: 'ic', innerHTML: LINK_ICON }));
      } else {
        icon = Object.assign(document.createElement('span'), { className: 'ic', innerHTML: it.kind === 'url' ? LINK_ICON : SEARCH_ICON });
      }
      const txt = document.createElement('div');
      txt.className = 'txt';
      const title = Object.assign(document.createElement('div'), { className: 'title', textContent: it.title });
      txt.append(title);
      if (it.sub) txt.append(Object.assign(document.createElement('div'), { className: 'url', textContent: it.sub }));
      const hint = Object.assign(document.createElement('span'), { className: 'hint', textContent: it.hint });
      li.append(icon, txt, hint);
      li.addEventListener('mousemove', () => { if (sel !== i) { sel = i; render(); } });
      li.addEventListener('click', () => run(it));
      return li;
    }));
  }

  let queryId = 0;
  async function update() {
    const q = input.value.trim();
    const id = ++queryId;
    if (!q) { items = []; render(); return; }
    const result = calc(q), conv = convert(q);
    const first = result !== null
      ? { kind: 'calc', title: `= ${result.toLocaleString(undefined, { maximumFractionDigits: 10 })}`, sub: 'Press Enter to copy', hint: 'Copy', value: String(result) }
      : conv ? { kind: 'convert', title: conv.text, sub: 'Press Enter to copy', hint: 'Copy', value: String(conv.value) }
      : looksLikeUrl(q)
        ? { kind: 'url', title: q, sub: 'Open site', hint: 'Enter' }
        : { kind: 'search', title: q, sub: 'Search', hint: 'Enter' };
    items = [first];
    sel = 0;
    render();
    const tabs = await chrome.runtime.sendMessage({ type: 'tabs', q }).catch(() => []);
    if (id !== queryId) return; // a newer keystroke already ran
    const HINTS = { tab: 'Switch to tab', site: 'Top site', bookmark: 'Bookmark', history: 'History' };
    items = [first, ...(tabs || []).map((t) => ({ ...t, kind: t.kind || 'tab', title: t.title || t.url, sub: t.url, hint: HINTS[t.kind || 'tab'] }))];
    render();
  }

  function run(it) {
    const q = input.value.trim();
    if (it.kind === 'calc' || it.kind === 'convert') copy(it.value);
    close();
    if (it.kind === 'url') location.href = urlFor(q);
    else if (it.kind === 'search') chrome.runtime.sendMessage({ type: 'search', q });
    else if (it.kind === 'tab') chrome.runtime.sendMessage({ type: 'switch', id: it.id, windowId: it.windowId });
    else if (it.url) location.href = it.url;
  }

  async function open() {
    const s = await chrome.storage.sync.get(['blur', 'tint', 'liquid', 'solidGlass']).catch(() => ({}));
    const light = pageIsLight();
    const tint = (s.tint ?? 10) / 100;
    const mode = s.solidGlass ? 'solid' : s.liquid === false ? '' : 'liquid';
    wrap.className = `wrap ${light ? 'light' : 'dark'} ${mode}`;
    wrap.style.setProperty('--blur', `${s.blur ?? 18}px`);
    // Light pages need a brighter glass to read as glass instead of a grey smudge.
    const glass = s.solidGlass
      ? (light ? 'rgba(250,250,252,.97)' : 'rgba(30,32,44,.97)')
      : (light ? `rgba(255,255,255,${0.3 + tint})` : `rgba(255,255,255,${tint})`);
    wrap.style.setProperty('--glass', glass);
    lastFocus = document.activeElement;
    host.style.display = 'block';
    input.value = '';
    items = [];
    render();
    input.focus();
  }

  function close() {
    host.style.display = 'none';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function toggle() { host.style.display === 'none' ? open() : close(); }

  input.addEventListener('input', update);
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); sel = (sel + 1) % items.length; render(); }
    else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); sel = (sel - 1 + items.length) % items.length; render(); }
    else if (e.key === 'Enter' && items[sel]) { e.preventDefault(); run(items[sel]); }
  }
  root.querySelector('.scrim').addEventListener('click', close);
  // Keep the page's own keyboard shortcuts (YouTube's Space, M, F...) from firing
  // while typing in the bar. Sites listen on document or in the capture phase, so
  // catch keys first, on window, handle them here, and stop them going further.
  // Typing still works: stopping the event doesn't cancel its default action.
  for (const type of ['keydown', 'keyup', 'keypress']) {
    window.addEventListener(type, (e) => {
      if (!e.composedPath().includes(host)) return;
      if (type === 'keydown') onKey(e);
      e.stopImmediatePropagation();
    }, true);
  }

  document.documentElement.append(host);
  window.__glassBar = { toggle };
  open();
})();
