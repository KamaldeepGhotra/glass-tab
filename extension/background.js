importScripts('gg.js');

// Removing Glass Tab opens a page where people can say why, if they want to.
// Nothing is sent from the extension. Keep in step with FEEDBACK_URL in newtab.js.
chrome.runtime.setUninstallURL('https://github.com/KamaldeepGhotra/glass-tab/issues/new');

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
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

// One-time reminder: if the user said no to glass Google search in the first-run tour,
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
    chrome.runtime.sendMessage({ type: 'open-bar', tabId: tab.id }).catch(() => {});
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

// Focus timer or break finished, even if no new tab page is open.
// Keep BREAK_SECONDS in step with newtab.js.
const BREAK_SECONDS = 5 * 60;
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'focus') return;
  const { focus: f = {} } = await chrome.storage.local.get('focus');
  const today = new Date().toDateString();
  const doneToday = f.day === today ? f.done || 0 : 0;
  if (f.brk) {
    const len = f.back || 30 * 60; // back to the focus length the user picked
    await chrome.storage.local.set({ focus: { endAt: null, left: len, len, day: today, done: doneToday } });
    chrome.notifications.create('focus-break', {
      type: 'basic', iconUrl: 'icons/icon128.png', title: "Break's over", message: 'Ready for another focus session?',
    });
    return;
  }
  const done = doneToday + 1;
  const len = f.len || 30 * 60; // the length the user picked
  await chrome.storage.local.set({ focus: { endAt: null, left: len, len, day: today, done } });
  chrome.notifications.create('focus-done', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Focus session done',
    message: `That's ${done} today. Time for a short break.`,
    buttons: [{ title: 'Start a 5-minute break' }],
  });
});
// Clicking a focus notification opens a new tab, where the timer is.
chrome.notifications.onClicked.addListener((id) => {
  if (!id.startsWith('focus-')) return;
  chrome.notifications.clear(id);
  chrome.tabs.create({});
});
chrome.notifications.onButtonClicked.addListener(async (id) => {
  if (id !== 'focus-done') return;
  chrome.notifications.clear(id);
  const { focus: f = {} } = await chrome.storage.local.get('focus');
  const endAt = Date.now() + BREAK_SECONDS * 1000;
  await chrome.storage.local.set({ focus: { ...f, brk: true, back: f.len, endAt, left: BREAK_SECONDS, len: BREAK_SECONDS } });
  chrome.alarms.create('focus', { when: endAt });
});

// What the glass bar suggests: open tabs first, then top sites, then bookmarks and
// history if the user allowed them (Customize › Chrome and Google). Each page once.
async function barMatches(q, exceptTab) {
  const has = (t) => (t.title || '').toLowerCase().includes(q) || (t.url || '').toLowerCase().includes(q);
  const tabs = (await chrome.tabs.query({})).filter((t) => t.id !== exceptTab && has(t)).slice(0, 5)
    .map((t) => ({ kind: 'tab', id: t.id, windowId: t.windowId, title: t.title, url: t.url }));
  const more = await chrome.permissions.contains({ permissions: ['bookmarks', 'history'] });
  const [top, marks, past] = await Promise.all([
    chrome.topSites.get().catch(() => []),
    more ? chrome.bookmarks.search(q).catch(() => []) : [],
    more ? chrome.history.search({ text: q, startTime: 0, maxResults: 20 }).catch(() => []) : [],
  ]);
  const seen = new Set(tabs.map((t) => t.url));
  const pages = [];
  for (const [kind, list] of [['site', top.filter(has)], ['bookmark', marks], ['history', past]]) {
    for (const p of list) {
      if (!/^https?:/.test(p.url || '') || seen.has(p.url)) continue;
      seen.add(p.url);
      pages.push({ kind, title: p.title || p.url, url: p.url });
    }
  }
  return [...tabs, ...pages].slice(0, 8);
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type === 'tabs') {
    barMatches(msg.q.toLowerCase(), sender.tab?.id).then(reply, () => reply([]));
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
