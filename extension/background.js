const FOCUS_SECONDS = 25 * 60;

importScripts('gg.js');

// Show the setup guide once, right after install.
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') chrome.tabs.create({ url: 'welcome.html' });
  // Chrome keeps the copy of a registered content script from when it was registered,
  // so after an update re-register Glass Google to pick up the new google.js/css.
  if (reason === 'update' && (await chrome.permissions.contains({ origins: GG.origins }))) {
    const [old] = await chrome.scripting.getRegisteredContentScripts({ ids: [GG.id] });
    if (old || (await ggGet()).state === 'on') await ggRegister();
  }
});

// Access to google.com can be granted or taken away from several places (our pages,
// Chrome's extension menu), so keep the script and the saved choice in step here.
chrome.permissions.onAdded.addListener(async ({ origins = [] }) => {
  if (!origins.some((o) => o.includes('www.google.com'))) return;
  await ggRegister();
  await ggSet({ state: 'on' });
  for (const t of await chrome.tabs.query({ url: GG.matches })) chrome.tabs.reload(t.id);
});
chrome.permissions.onRemoved.addListener(async ({ origins = [] }) => {
  if (!origins.some((o) => o.includes('www.google.com'))) return;
  await chrome.scripting.unregisterContentScripts({ ids: [GG.id] }).catch(() => {});
  if ((await ggGet()).state === 'on') await ggSet({ state: 'off' });
});

// One-time reminder: if the user said no to glass Google search when they installed,
// the first time they search Google we offer it once from the toolbar icon. We can't
// draw on Google's page itself without that very permission.
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status !== 'complete' || !/^https:\/\/www\.google\.com\/search/.test(tab.url || '')) return;
  const gg = await ggGet();
  if (gg.state !== 'declined' || gg.prompted) return;
  await chrome.action.setPopup({ tabId, popup: 'prompt.html' });
  try {
    await chrome.action.openPopup({ windowId: tab.windowId });
  } catch {
    // Chrome couldn't open it (e.g. window not focused): wait for a click on the icon.
    await chrome.action.setBadgeText({ tabId, text: '1' });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#5b6cff' });
  }
});

// The shortcut and the toolbar button both grant activeTab, so the bar is injected
// only into the tab you're on. No "read all websites" permission is needed.
async function openBar(tab) {
  if (!tab?.id) return;
  if (tab.url === 'chrome://newtab/' || tab.url?.startsWith(chrome.runtime.getURL(''))) {
    chrome.runtime.sendMessage({ type: 'focus-search' }).catch(() => {});
    return;
  }
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['bar.js'] });
  } catch {
    // Chrome blocks scripts on chrome:// pages and the Web Store. Nothing to do there.
  }
}
chrome.commands.onCommand.addListener((command, tab) => { if (command === 'open-glass-bar') openBar(tab); });
chrome.action.onClicked.addListener(openBar);

// Focus timer finished, even if no new tab page is open.
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'focus') return;
  const { focus: f = {} } = await chrome.storage.local.get('focus');
  const today = new Date().toDateString();
  const done = (f.day === today ? f.done || 0 : 0) + 1;
  await chrome.storage.local.set({ focus: { endAt: null, left: FOCUS_SECONDS, day: today, done } });
  chrome.notifications.create('focus-done', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Focus session done',
    message: `That's ${done} today. Time for a short break.`,
  });
});

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type === 'tabs') {
    const q = msg.q.toLowerCase();
    chrome.tabs.query({}).then((tabs) => reply(tabs
      .filter((t) => t.id !== sender.tab?.id && ((t.title || '').toLowerCase().includes(q) || (t.url || '').toLowerCase().includes(q)))
      .slice(0, 5)
      .map((t) => ({ id: t.id, windowId: t.windowId, title: t.title, url: t.url }))));
    return true;
  }
  if (msg.type === 'switch') {
    chrome.tabs.update(msg.id, { active: true });
    chrome.windows.update(msg.windowId, { focused: true });
  }
  if (msg.type === 'search' && sender.tab?.id) {
    chrome.search.query({ text: msg.q, tabId: sender.tab.id });
  }
});
