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

Press **⌘⇧K** (Mac) or **Ctrl+Shift+K** (Windows/Linux) on any website to open the glass bar. Type to search, enter a URL, or jump to an open tab. Arrow keys move, Enter opens, Esc closes. It uses your glass settings from the new tab page.

Change the shortcut at `chrome://extensions/shortcuts`. Plain ⌘K is possible there too, but it would override ⌘K search on sites like GitHub, Slack and Notion.

The bar is only added to a page when you press the shortcut, so the extension never needs access to every site. Chrome doesn't allow it on `chrome://` pages or the Web Store. On the new tab page, the shortcut focuses the search box.

## Reloading

After editing files, click the reload icon on the Glass Tab card in `chrome://extensions`, then open a new tab.

## Notes

- The toolbar color in `theme/manifest.json` (`toolbar`) must match `--bar` in `extension/newtab.css`, or a line shows where they meet.
- Settings and to-dos sync through Chrome sync. Weather comes from Open-Meteo (free, no key) using only the city you type.
- Clock fonts are system fonts, so nothing is downloaded. Some look best on macOS.
