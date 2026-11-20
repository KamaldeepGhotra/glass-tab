// Glass Google search: shared by the background worker, new tab, welcome and prompt pages.
// The user's choice is saved in chrome.storage.local as gg = { state, prompted }:
//   state: 'on' | 'off' (turned off in settings) | 'declined' (said no to Chrome's prompt)
//   prompted: the one-time reminder on a Google search has been shown
const GG = {
  id: 'glass-google',
  origins: ['https://www.google.com/*'],
  // Results pages, and Google's home page (the logo on a results page goes there).
  matches: ['https://www.google.com/search*', 'https://www.google.com/', 'https://www.google.com/?*', 'https://www.google.com/webhp*'],
};

async function ggGet() {
  return (await chrome.storage.local.get('gg')).gg || {};
}
async function ggSet(patch) {
  await chrome.storage.local.set({ gg: { ...(await ggGet()), ...patch } });
}

async function ggRegister() {
  await chrome.scripting.unregisterContentScripts({ ids: [GG.id] }).catch(() => {});
  try {
    await chrome.scripting.registerContentScripts([{ id: GG.id, matches: GG.matches, css: ['google.css'], js: ['google.js'], runAt: 'document_start' }]);
  } catch (e) {
    // Turning it on registers it from the page and from the background worker (which sees
    // the new permission) at the same moment; whichever comes second finds it done.
    if (!/Duplicate script ID/i.test(e.message)) throw e;
  }
}

async function ggIsOn() {
  const [registered] = await chrome.scripting.getRegisteredContentScripts({ ids: [GG.id] });
  return !!registered && (await chrome.permissions.contains({ origins: GG.origins }));
}

// Must be called straight from a click: Chrome only shows its permission prompt then.
// Saying no on the welcome page (right after install) arms the one-time reminder.
async function ggTurnOn({ fromWelcome = false } = {}) {
  let ok = false;
  try { ok = await chrome.permissions.request({ origins: GG.origins }); } catch {}
  if (ok) {
    await ggRegister();
    await ggSet({ state: 'on' });
  } else if (fromWelcome) {
    await ggSet({ state: 'declined' });
  }
  return ok;
}

async function ggTurnOff() {
  await chrome.scripting.unregisterContentScripts({ ids: [GG.id] }).catch(() => {});
  await chrome.permissions.remove({ origins: GG.origins }).catch(() => {});
  await ggSet({ state: 'off' });
}
