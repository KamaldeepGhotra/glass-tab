# Chrome Web Store listing: Glass Tab 1.0.3

Upload `store/glass-tab-1.0.3.zip`. Paste each section below into the matching place in the Developer Dashboard.

## Store listing

**Name:** Glass Tab

**Summary (132 characters max):**
A liquid-glass new tab with a lock-screen clock, widgets and wallpapers, plus a glass search bar and glass Google results.

**Category:** Productivity (or Customization & Themes if offered)

**Language:** English

**Description:**

Glass Tab turns every new tab into a calm, liquid-glass home screen.

A clock like your lock screen
• Clear glass, frosted glass or solid, in seven fonts and colors picked to match the wallpapers
• A greeting and a daily quote, both optional

Wallpapers that move
• Curated wallpapers for light and dark mode, including layered waves, and you can change their colors
• Gentle motion at 15, 30, 60 or 120 fps, or keep it still
• Follows your system's light or dark mode automatically

Widgets that fit your day
• Weather, Calendar (Google or iCloud), To-do, Notes, Countdown, Focus timer, Top sites and Recently closed tabs
• Pick a size for each one, then press and hold to move them around
• Keep your to-do list in Glass Tab, or show your Todoist list
• A short setup tour on your first new tab

Glass everywhere you search
• Press ⌘⇧K (Ctrl+Shift+K) on any site for a glass search bar that also finds your open tabs
• Optional: make Google search results glass to match

Private by design
• No account, no ads, no tracking. Your settings and notes stay in Chrome.

**Screenshots (1280×800):** `1-hero-dark.png`, `2-light.png`, `3-customize.png`, `4-setup-tour.png`, `5-edit-layout.png`

**Small promo tile (440×280):** `promo-440x280.png`

## Privacy practices tab

**Single purpose:**
Glass Tab gives Chrome's new tab page and searches a liquid-glass look: a customizable new tab with a clock and widgets, a matching glass search bar, and optional matching styling for Google search results.

**Permission justifications:**
- **storage:** Saves the user's settings, to-dos, notes and layout, and caches weather and calendar data.
- **topSites:** Shows the user's most visited sites in the Top sites widget.
- **sessions:** Shows and reopens recently closed tabs in the Recently closed widget.
- **search:** Sends searches typed in the new tab search box to the user's default search engine.
- **favicon:** Shows site icons in the Top sites and Recently closed widgets.
- **activeTab:** Adds the glass search bar to the current tab only when the user presses the shortcut or the toolbar button.
- **scripting:** Inserts the glass search bar into the current tab on request, and registers the optional glass Google script after the user turns it on.
- **tabs:** Lets the glass search bar find and switch to the user's open tabs by title, and detects Google search pages to offer the optional glass Google styling once.
- **alarms:** Ends the Focus timer on time even when no new tab is open.
- **notifications:** Tells the user when a Focus session has finished.
- **Host permission api.open-meteo.com / geocoding-api.open-meteo.com:** Gets the weather for the city the user typed or their location.
- **Host permission api.bigdatacloud.net:** Turns the user's location into a town name for the weather widget, only when they choose to use their location.
- **Optional host permission www.google.com:** Only requested when the user turns on glass Google search results; restyles Google's results page.
- **Optional host permission calendar.google.com / *.icloud.com:** Only requested when the user links a calendar; reads that calendar's iCal link.
- **Optional host permission api.todoist.com:** Only requested when the user connects Todoist; reads and updates the tasks in the one Todoist project shown in the to-do widget.
- **Optional permission identity, optional host permissions graph.microsoft.com / login.microsoftonline.com / tasks.googleapis.com:** Only requested when the user signs in to Microsoft To Do or Google Tasks from the to-do widget's settings; used to sign in through Chrome's sign-in window and to read and update the tasks in the list shown in the widget.

**Remote code:** No, I am not using remote code.

**Data usage (tick these):**
- Location: yes (approximate location, only when the user turns on "Use my location", to show local weather)
- Web history: yes (top sites and recently closed tabs are shown on the new tab page only, never sent anywhere)
- Authentication information: yes (the token for a to-do app the user chooses to connect; kept on the user's computer, used only to reach that app)
- Personal communications / user activity / everything else: no

Then tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://kamaldeepghotra.github.io/glass-tab/privacy.html
(Works once the repo is public and GitHub Pages is on: repo Settings › Pages › Deploy from branch › main › /docs.)

## Distribution

- Visibility: Public
- Regions: All regions
- Price: Free
