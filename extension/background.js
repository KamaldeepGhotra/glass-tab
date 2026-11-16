const FOCUS_SECONDS = 25 * 60;

// Show the setup guide once, right after install.
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') chrome.tabs.create({ url: 'welcome.html' });
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
