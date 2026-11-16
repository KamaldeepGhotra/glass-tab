# Glass Tab

A calm, liquid-glass new tab page for Chrome.

- `extension/` is the new tab page: wallpapers, glass search bar, clock and widgets.
- `theme/` is a separate Chrome theme that turns the toolbar dark so it blends into the page. Chrome requires themes to be their own extension.

## Load it in Chrome

1. Open `chrome://extensions` and turn on **Developer mode** (top right).
2. Click **Load unpacked** and pick the `extension` folder.
3. Click **Load unpacked** again and pick the `theme` folder.
4. Open a new tab. Use the button in the bottom-right corner to customize.

## Glass search bar

Press **⌘⇧K** (Mac) or **Ctrl+Shift+K** (Windows/Linux) on any website, or click the Glass Tab toolbar icon, to open the glass bar. Type to search, enter a URL, jump to an open tab, or do quick math (`24*7`, Enter copies the answer). Arrow keys move, Enter opens, Esc closes. It uses your glass settings from the new tab page.

## Layout

Open settings and click **Edit layout**, or press and hold any widget. Drag widgets to move them, tap the size tag to resize, tap × to remove, then click **Done**.

Change the shortcut at `chrome://extensions/shortcuts`. Plain ⌘K is possible there too, but it would override ⌘K search on sites like GitHub, Slack and Notion.

The bar is only added to a page when you press the shortcut, so the extension never needs access to every site. Chrome doesn't allow it on `chrome://` pages or the Web Store. On the new tab page, the shortcut focuses the search box.

## Reloading

After editing files, click the reload icon on the Glass Tab card in `chrome://extensions`, then open a new tab.

## Notes

- The toolbar color in `theme/manifest.json` (`toolbar`) must match `--bar` in `extension/newtab.css`, or a line shows where they meet.
- Settings and to-dos sync through Chrome sync. A local copy in `localStorage` lets the page draw with the right wallpaper before sync storage answers (see `boot.js`).
- Weather comes from Open-Meteo (free, no key) using the city you type, or your coordinates if you choose "Use my location" (Chrome's normal location prompt appears only then; no manifest permission).
- The focus timer is shared by all tabs and finishes in the background worker, which shows a notification.
- **Glass Google search results** is opt-in (settings, Glass section). Turning it on asks for access to google.com and registers `google.js` and `google.css` for search pages; turning it off removes both. It only applies when Google is in dark mode, and only on google.com. Google's class names change occasionally, so check these styles after big Google redesigns.
- A setup guide (`welcome.html`) opens on first install. Set `THEME_STORE_URL` in `welcome.js` once the theme is published.
- Clock fonts are system fonts, so nothing is downloaded. Some look best on macOS.
