// Content script for Google search results, registered only when the user turns on
// "Glass Google search". Google renames its CSS classes often, so instead of relying
// on them this script finds the parts of the page by structure and tags them with
// its own classes (gt-*), which google.css styles.
(async () => {
  const root = document.documentElement;
  const { look } = await chrome.storage.local.get('look');

  // Matches the page to Google's own light or dark mode, using that mode's wallpaper.
  function setMode(light) {
    root.classList.add('glass-google');
    root.classList.toggle('gt-light', light);
    // Older versions saved a single palette as { base, c }; accept both formats.
    const p = look?.[light ? 'light' : 'dark'] ?? (look?.base ? look : null);
    if (p?.base && Array.isArray(p.c)) {
      root.style.setProperty('--gt-base', p.base);
      root.style.setProperty('--gt-c1', p.c[0]);
      root.style.setProperty('--gt-c2', p.c[1]);
      root.style.setProperty('--gt-c3', p.c[2]);
      if (p.wave) root.style.setProperty('--gt-wave', p.wave);
      else root.style.removeProperty('--gt-wave');
      root.classList.toggle('gt-wavy', !!p.wave);
    }
  }
  if (look) {
    root.style.setProperty('--gt-blur', `${look.blur}px`);
    root.style.setProperty('--gt-tint', String(look.tint / 100));
    root.classList.toggle('gt-solid', !!look.solid);
  }
  setMode(matchMedia('(prefers-color-scheme: light)').matches); // best guess until the page loads

  const lum = (color) => {
    const m = color.match(/[\d.]+/g);
    if (!m || (m[3] !== undefined && +m[3] === 0)) return null; // transparent
    return 0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2];
  };
  const opaque = (el) => lum(getComputedStyle(el).backgroundColor) !== null;

  function mark() {
    // Search box: the outermost rounded, filled layer around the query field becomes
    // glass; rounded layers inside it go clear so they don't stack up.
    const q = document.querySelector('textarea[name="q"], input[name="q"]');
    const rounded = [];
    for (let el = q?.parentElement, i = 0; el && i < 6; el = el.parentElement, i++) {
      if (parseFloat(getComputedStyle(el).borderRadius) >= 16 && (opaque(el) || el.classList.contains('gt-box'))) rounded.push(el);
    }
    rounded.forEach((el, i) => {
      el.classList.toggle('gt-box', i === rounded.length - 1);
      el.classList.toggle('gt-clear', i < rounded.length - 1);
    });
    markHeader();
    // Anything painted in Google's page color (wrappers, bars, "Show more" fades)
    // becomes see-through so the wallpaper shows.
    for (const el of document.querySelectorAll('body *')) {
      if (el.matches('.gt-box, .gt-card, .gt-clear, .gt-nofade, img, svg, svg *')) continue;
      // Pop-ups (menus, dialogs, image previews) float over the page and must stay solid.
      if (el.closest(POPUPS)) continue;
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'absolute') continue;
      if (cs.backgroundColor === pageBg && el.offsetWidth >= innerWidth * 0.4) el.classList.add('gt-clear');
      if (cs.backgroundImage.includes(pageBg)) el.classList.add('gt-nofade');
    }
    // Each search result: the top-level block around a result title.
    for (const h of document.querySelectorAll('#rso h3, #search h3')) {
      const card = h.closest('#rso > *') || h.closest('[data-hveid]');
      if (card && card.offsetHeight > 40) card.classList.add('gt-card');
    }
  }

  // The suggestions list covers the results below it. Glass can't blur that far (it sits
  // inside the frosted header), so whatever surface the list is drawn on turns almost
  // solid while it's open: the search box itself, or a layer we had made see-through.
  const POPUPS = '[role="dialog"], [role="menu"], [role="listbox"], [aria-modal="true"]';
  function markOpen() {
    document.querySelectorAll('.gt-pop').forEach((el) => el.classList.remove('gt-pop'));
    let open = false;
    for (const list of document.querySelectorAll('[role="listbox"]')) {
      if (!list.offsetHeight) continue;
      for (let el = list; el && el !== document.body; el = el.parentElement) {
        if (el.classList.contains('gt-box')) { open = true; break; }
        if (el.classList.contains('gt-clear')) { el.classList.add('gt-pop'); break; }
        if (opaque(el)) break; // Google's own solid pop-up: already readable
      }
    }
    root.classList.toggle('gt-open', open);
  }

  // Google's header only becomes fixed once you scroll, so this runs on scroll too.
  function markHeader() {
    const q = document.querySelector('textarea[name="q"], input[name="q"]');
    for (let el = q?.parentElement; el && el !== document.body; el = el.parentElement) {
      if (['sticky', 'fixed'].includes(getComputedStyle(el).position)) { el.classList.add('gt-header'); break; }
    }
  }

  let pageBg = '';
  function start() {
    // Read Google's own background (with our style off) to see which mode it is in.
    root.classList.remove('glass-google');
    // Google paints its page color on <body> or on <html>, depending on the account.
    pageBg = [document.body, root].map((el) => getComputedStyle(el).backgroundColor).find((c) => lum(c) !== null) || '';
    const l = lum(pageBg) ?? 0;
    mark();
    setMode(l >= 128);
    // Results load in pieces, so re-tag when the page changes (at most a few times a second).
    let timer = null;
    new MutationObserver(() => {
      markOpen();
      if (timer) return;
      timer = setTimeout(() => { timer = null; mark(); }, 250);
    }).observe(document.body, { childList: true, subtree: true });
    for (const type of ['focusin', 'focusout', 'input', 'keyup']) addEventListener(type, () => setTimeout(markOpen), true);
    let scrollTimer = null;
    addEventListener('scroll', () => {
      if (scrollTimer) return;
      scrollTimer = setTimeout(() => { scrollTimer = null; markHeader(); }, 150);
    }, { passive: true });
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
