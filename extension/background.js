// The shortcut grants activeTab, so the bar is injected only into the tab you're on.
// No "read all websites" permission is needed.
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'open-glass-bar' || !tab?.id) return;
  if (tab.url === 'chrome://newtab/' || tab.url?.startsWith(chrome.runtime.getURL(''))) {
    chrome.runtime.sendMessage({ type: 'focus-search' }).catch(() => {});
    return;
  }
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['bar.js'] });
  } catch {
    // Chrome blocks scripts on chrome:// pages and the Web Store. Nothing to do there.
  }
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
