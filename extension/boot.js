// Runs in <head> before the page draws. Applies the last saved look from a local
// copy so the page never flashes the default wallpaper while settings load.
try {
  const look = JSON.parse(localStorage.getItem('glassTabLook') || 'null');
  if (look) {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(look.vars)) root.style.setProperty(k, v);
    root.className = look.cls;
  }
} catch {}
