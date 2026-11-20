// Runs in <head> before the page draws. Applies the last saved look from a local
// copy so the page never flashes the default wallpaper while settings load.
// In "auto" appearance it picks light or dark from the system right now.
try {
  const root = document.documentElement;
  const light = matchMedia('(prefers-color-scheme: light)').matches;
  const look = JSON.parse(localStorage.getItem('glassTabLook') || 'null');
  if (look && look.vars) {
    const m = look.auto ? (light ? 'light' : 'dark') : look.mode;
    for (const [k, v] of Object.entries(look.vars[m])) root.style.setProperty(k, v);
    // Your own photo is kept apart from the look, as it's big.
    if (look.vars[m]['--photo-display'] === 'block') {
      const photo = localStorage.getItem('glassTabPhotoData');
      if (photo) root.style.setProperty('--photo', `url("${photo}")`);
    }
    root.className = `${look.cls}${m === 'light' ? ' light' : ''}`;
  } else if (light) {
    root.classList.add('light'); // first run: follow the system
  }
} catch {}
