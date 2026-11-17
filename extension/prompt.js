// One-time reminder shown from the toolbar icon on a Google search, after the user
// declined glass Google search when they installed. It is never shown again.
(async () => {
  await ggSet({ prompted: true });
  // Hand the toolbar icon back to the glass search bar.
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.action.setPopup({ tabId: tab.id, popup: '' });
    chrome.action.setBadgeText({ tabId: tab.id, text: '' });
  }
})();

document.getElementById('yes').addEventListener('click', async () => {
  // The popup may close while Chrome's prompt is open; the background worker finishes
  // the job (turns it on and reloads Google) when access is granted.
  await ggTurnOn();
  window.close();
});
document.getElementById('no').addEventListener('click', () => window.close());
