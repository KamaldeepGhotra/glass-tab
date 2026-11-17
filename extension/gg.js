// Glass Google search: shared by the background worker, new tab, welcome and prompt pages.
// The user's choice is saved in chrome.storage.local as gg = { state, prompted }:
//   state: 'on' | 'off' (turned off in settings) | 'declined' (said no to Chrome's prompt)
//   prompted: the one-time reminder on a Google search has been shown
const GG = {
  id: 'glass-google',
  origins: ['https://www.google.com/*'],
  matches: ['https://www.google.com/search*'],
};

async function ggGet() {
  return (await chrome.storage.local.get('gg')).gg || {};
}
async function ggSet(patch) {
  await chrome.storage.local.set({ gg: { ...(await ggGet()), ...patch } });
}

async function ggRegister() {
  await chrome.scripting.unregisterContentScripts({ ids: [GG.id] }).catch(() => {});
  await chrome.scripting.registerContentScripts([{ id: GG.id, matches: GG.matches, css: ['google.css'], js: ['google.js'], runAt: 'document_start' }]);
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
