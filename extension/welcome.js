// Fill in after each theme is published on the Chrome Web Store.
const THEME_STORE_URLS = { dark: '', light: '' };
const THEME_STORE_URL = THEME_STORE_URLS[document.documentElement.classList.contains('light') ? 'light' : 'dark'];

const hasChrome = typeof chrome !== 'undefined' && !!chrome.commands;

document.getElementById('openTab').addEventListener('click', () => {
  if (hasChrome) chrome.tabs.create({});
});

const theme = document.getElementById('getTheme');
if (THEME_STORE_URL) theme.href = THEME_STORE_URL;
else {
  theme.textContent = 'Theme coming soon';
  theme.setAttribute('aria-disabled', 'true');
}

// Chrome leaves the shortcut empty if another extension already uses it.
const text = document.getElementById('shortcutText');
const setBtn = document.getElementById('setShortcut');
setBtn.addEventListener('click', () => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }));
if (hasChrome) {
  chrome.commands.getAll((commands) => {
    const key = commands.find((c) => c.name === 'open-glass-bar')?.shortcut;
    if (key) {
      text.innerHTML = 'Press <kbd></kbd> on any website to open the glass search bar.';
      text.querySelector('kbd').textContent = key;
    } else {
      text.textContent = 'Another extension already uses the shortcut, so Chrome left it empty. Pick one you like.';
      setBtn.hidden = false;
    }
  });
} else {
  text.textContent = 'Press ⌘⇧K on any website to open the glass search bar.';
}
