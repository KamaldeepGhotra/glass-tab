// Content script for Google search results, registered only when the user turns on
// "Glass Google search". Applies the user's wallpaper and glass settings, which the
// new tab page saves to chrome.storage.local as "look".
(async () => {
  const root = document.documentElement;
  const darkScheme = matchMedia('(prefers-color-scheme: dark)').matches;
  if (darkScheme) root.classList.add('glass-google');

  const { look } = await chrome.storage.local.get('look');
  if (look) {
    root.style.setProperty('--gt-base', look.base);
    root.style.setProperty('--gt-c1', look.c[0]);
    root.style.setProperty('--gt-c2', look.c[1]);
    root.style.setProperty('--gt-c3', look.c[2]);
    root.style.setProperty('--gt-blur', `${look.blur}px`);
    root.style.setProperty('--gt-tint', String(look.tint / 100));
    root.classList.toggle('gt-solid', !!look.solid);
  }

  // Google can be set to light mode on its own. Glass over a dark wallpaper would
  // make its dark text unreadable, so only keep the style when Google is dark.
  const check = () => {
    root.classList.remove('glass-google'); // read Google's own color, not ours
    const [r, g, b] = getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number);
    root.classList.toggle('glass-google', 0.299 * r + 0.587 * g + 0.114 * b < 100);
  };
  if (document.body) check();
  else addEventListener('DOMContentLoaded', check, { once: true });
})();
