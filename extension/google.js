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
  const FADE = /gradient\((to bottom, )?rgba\(\d+, \d+, \d+, 0\)/; // starts clear, ends in a color

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
    for (const el of document.querySelectorAll('body *')) markEl(el);
    markCards();
  }

  // Anything painted in Google's page color (wrappers, bars, "Show more" fades)
  // becomes see-through so the wallpaper shows.
  function markEl(el) {
    if (el.matches('.gt-box, .gt-card, .gt-clear, .gt-nofade, .gt-fadeout, img, svg, svg *')) return;
    // Pop-ups (menus, dialogs, image previews) float over the page and must stay solid.
    if (el.closest(POPUPS)) return;
    const cs = getComputedStyle(el);
    // Google's "Show more" fades are painted in its page color, which shows up as a band
    // on the wallpaper. They become real fades: the text itself fades out.
    if (FADE.test(cs.backgroundImage) && el.offsetWidth >= 150) { softFade(el, cs); return; }
    // Until Google's page color is known nothing below can be judged (an empty color
    // would match everything).
    if (!pageBg || cs.position === 'fixed' || cs.position === 'absolute') return;
    // Wide layers in the page color go, so the wallpaper shows. Inside a glass card,
    // "wide" means half the card (like the strip behind the AI Overview's "Show more"),
    // so small buttons keep their own color.
    if (cs.backgroundColor === pageBg && (el.offsetWidth >= innerWidth * 0.4 || el.offsetWidth >= (el.closest('.gt-card')?.offsetWidth ?? Infinity) * 0.5)) el.classList.add('gt-clear');
    if (cs.backgroundImage.includes(pageBg)) el.classList.add('gt-nofade');
  }
  // Each search result: the top-level block around a result title.
  function markCards() {
    for (const h of document.querySelectorAll('#rso h3, #search h3')) {
      const card = h.closest('#rso > *') || h.closest('[data-hveid]');
      if (card && card.offsetHeight > 40 && !card.parentElement.closest('.gt-card')) card.classList.add('gt-card');
    }
  }

  // A real fade: Google's fade loses its color, and the text in the box it sits at the
  // bottom of (the box that cuts the text off) gets a mask, so the text fades into the
  // wallpaper the same way. While the box grows or shrinks, a ResizeObserver refits the
  // mask before each frame is drawn, and takes it off once Google hides the fade (the
  // block is expanded).
  const fades = new Map(); // fade -> { box it fades, where Google's fade turns solid }
  function softFade(el, cs) {
    // Google's fade turns solid a little way down (e.g. "rgb(...) 14px"); the text is gone from there.
    const solid = parseFloat(cs.backgroundImage.match(/\)\s+([\d.]+)px/)?.[1]) || el.offsetHeight * 0.3;
    el.classList.add('gt-fadeout');
    let box = fades.get(el)?.box;
    if (!box) {
      // The nearest box around it that clips its content and ends where the fade ends.
      const fb = el.getBoundingClientRect().bottom;
      for (let p = el.parentElement, i = 0; p && i < 5 && !box; p = p.parentElement, i++) {
        if (getComputedStyle(p).overflowY !== 'visible' && Math.abs(p.getBoundingClientRect().bottom - fb) <= 24) box = p;
      }
      if (!box) return; // nothing to mask: the fade just goes
      fades.set(el, { box, solid });
      sizes.observe(el);
      sizes.observe(box);
    }
    fitMask(el, box, solid);
  }
  // The mask goes on the text inside the box (its in-flow children), not the box itself:
  // Google's "Show more" button sits in the same box, over the fade, and must stay.
  function fitMask(el, box, solidAt) {
    const r = el.getBoundingClientRect();
    for (const kid of box.children) {
      if (kid === el || kid.contains(el) || ['absolute', 'fixed'].includes(getComputedStyle(kid).position)) continue;
      if (!r.height) { kid.classList.remove('gt-mask'); continue; }
      const top = kid.getBoundingClientRect().top;
      kid.style.setProperty('--gt-mask-a', `${Math.round(r.top - top)}px`);
      kid.style.setProperty('--gt-mask-b', `${Math.round(r.top - top + Math.min(r.height, solidAt))}px`);
      kid.style.setProperty('--gt-mask-c', `${Math.round(r.bottom - top)}px`);
      kid.classList.add('gt-mask');
    }
  }
  const sizes = new ResizeObserver(() => {
    for (const [el, { box, solid }] of fades) {
      if (!el.isConnected || !box.isConnected) { fades.delete(el); sizes.unobserve(el); continue; }
      fitMask(el, box, solid);
    }
  });

  // The suggestions list covers the results below it. Glass can't blur that far (it sits
  // inside the frosted header), so whatever surface the list is drawn on turns almost
  // solid while it's open: the search box itself, or a layer we had made see-through.
  const POPUPS = '[role="dialog"], [role="menu"], [role="listbox"], [aria-modal="true"]';
  function markOpen() {
    document.querySelectorAll('.gt-pop, .gt-raise').forEach((el) => el.classList.remove('gt-pop', 'gt-raise'));
    let open = false;
    for (const list of document.querySelectorAll('[role="listbox"]')) {
      if (!list.offsetHeight) continue;
      // Glass cards are their own layers, so on Google layouts that don't give the search
      // area a z-index they paint over the list. Lift the list's positioned ancestors.
      for (let el = list; el && el !== document.body; el = el.parentElement) {
        if (getComputedStyle(el).position !== 'static') el.classList.add('gt-raise');
      }
      for (let el = list; el && el !== document.body; el = el.parentElement) {
        if (el.classList.contains('gt-box')) { open = true; break; }
        if (el.classList.contains('gt-clear')) { el.classList.add('gt-pop'); break; }
        if (opaque(el)) break; // Google's own solid pop-up: already readable
      }
    }
    root.classList.toggle('gt-open', open);
  }

  // Google's header only becomes fixed once you scroll, so this runs on scroll too. The
  // frosted strip is only there while results scroll under it: back at the top it comes
  // off, so the header matches the tabs below it again.
  function markHeader() {
    let header = null;
    if (scrollY > 0) {
      const q = document.querySelector('textarea[name="q"], input[name="q"]');
      for (let el = q?.parentElement; el && el !== document.body; el = el.parentElement) {
        if (['sticky', 'fixed'].includes(getComputedStyle(el).position)) { header = el; break; }
      }
    }
    document.querySelectorAll('.gt-header').forEach((el) => el !== header && el.classList.remove('gt-header'));
    header?.classList.add('gt-header');
  }

  let pageBg = '';
  // Read Google's own background (with our style off) to see which mode it is in.
  // Google paints its page color on <body> or on <html>, depending on the account.
  function readPage() {
    root.classList.remove('glass-google');
    const was = pageBg;
    pageBg = [document.body, root].map((el) => getComputedStyle(el).backgroundColor).find((c) => lum(c) !== null) || '';
    // Google's colors can arrive after the page starts. If the color changed, what was
    // tagged by the old one is untagged first.
    if (was && pageBg !== was) document.querySelectorAll('.gt-clear, .gt-nofade').forEach((el) => el.classList.remove('gt-clear', 'gt-nofade'));
    mark();
    setMode((lum(pageBg) ?? 0) >= 128);
  }
  // Starts as soon as the page's body begins, not when the page is done: Google sends the
  // AI Overview with the first part of the page, and Chrome draws it right away. Once the
  // whole page is in, Google's colors are read again in case its styles came in late.
  function start() {
    readPage();
    if (document.readyState === 'loading') {
      addEventListener('DOMContentLoaded', readPage, { once: true });
      // A stylesheet that arrives while the page loads can bring Google's page color.
      const sheet = (e) => {
        if (document.readyState !== 'loading') { document.removeEventListener('load', sheet, true); return; }
        if (e.target.tagName === 'LINK') readPage();
      };
      document.addEventListener('load', sheet, true); // a stylesheet's load event never reaches window
    }
    // Results load in pieces (the AI Overview arrives last). New parts are tagged as they
    // arrive, before they're drawn, so they never show Google's own colors first; a full
    // pass a moment later catches anything whose look depended on what came after it.
    let timer = null;
    new MutationObserver((changes) => {
      let n = 0;
      for (const { addedNodes } of changes) {
        for (const node of addedNodes) {
          if (node.nodeType !== 1 || !node.isConnected || n > 4000) continue;
          const all = [node, ...node.querySelectorAll('*')];
          n += all.length;
          all.forEach(markEl);
        }
      }
      if (n) markCards();
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
  if (document.body) start();
  else new MutationObserver((m, o) => { if (document.body) { o.disconnect(); start(); } }).observe(root, { childList: true });
})();
