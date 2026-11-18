# Chrome Web Store: how to release a Glass Tab update

Everything here follows the Developer Dashboard's left menu, top to bottom
(**Package › Store listing › Privacy › Distribution**). Each heading is the name of a box
in the dashboard, and the grey block under it is what goes in that box.

Dashboard: <https://chrome.google.com/webstore/devconsole>, then click **Glass Tab**.

---

## Release checklist (do this every update)

1. **Raise the version** in `extension/manifest.json` (for example `1.0.3` → `1.0.4`). The store
   rejects a package with the same version as the last one.
2. **Build the zip**, from the `glass_Chrome_Extenstion` folder:
   ```
   V=$(python3 -c "import json;print(json.load(open('extension/manifest.json'))['version'])") && rm -f store/glass-tab-*.zip && (cd extension && zip -qr -X "../store/glass-tab-$V.zip" . -x '.*') && echo "Built store/glass-tab-$V.zip"
   ```
3. Dashboard › **Package** › **Upload new package** › choose the new zip.
4. Only if something below changed: update **Store listing** and **Privacy**. Most updates
   need neither. You need **Privacy** only when a permission is added.
5. Click **Save draft**, then **Submit for review**. Leave **Publish automatically after it has passed review** ticked.
6. Updates are usually reviewed in 1–3 days. Once approved, users get them automatically within a few hours.

If the dashboard says it can't submit, click **Why can't I submit?** at the top. It lists the boxes that are empty.

**Current version:** 1.0.3, zip `store/glass-tab-1.0.3.zip`.
**Since the last listing update:** the Description gained two lines (colors, Todoist), and Privacy
gained the Todoist/Google/Microsoft permissions and Authentication information. Both are already
written into the blocks below.

---

## 1. Package

Click **Upload new package** and choose the zip. Nothing to type.

Leave **Verified CRX uploads** off.

---

## 2. Store listing

Title and Summary come from the package automatically.

### Description

```
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
```

### Category

**Make Chrome Yours › Functionality and UI**

### Language

**English**

### Graphic assets

| Box | File (in the `store` folder unless noted) |
| --- | --- |
| Store icon (128×128) | `extension/icons/icon128.png` |
| Global promo video | leave empty |
| Screenshots | `1-hero-dark.png`, `2-light.png`, `3-customize.png`, `4-setup-tour.png`, `5-edit-layout.png` |
| Small promo tile (440×280) | `promo-440x280.png` |
| Marquee promo tile | leave empty |

### Additional fields

| Box | Value |
| --- | --- |
| Official URL | leave empty |
| Homepage URL | `https://github.com/KamaldeepGhotra/glass-tab` |
| Support URL | `https://github.com/KamaldeepGhotra/glass-tab/issues` |
| Mature content | off |

---

## 3. Privacy

### Single purpose description

```
Glass Tab replaces Chrome's new tab page with a customizable liquid-glass home screen: a clock, wallpapers and widgets (weather, calendar, to-do list, notes and more), plus a matching glass search bar and optional matching styling for Google search results.
```

### Permission justification boxes

The dashboard shows one box per permission, titled like **storage justification**. Paste the matching block into each. If a box isn't shown, skip it.

**storage justification**
```
Saves the user's settings, to-do list, notes and widget layout, and keeps short-lived copies of their weather, calendar and to-do data so the new tab opens instantly.
```

**topSites justification**
```
Shows the user's most visited sites in the Top sites widget on the new tab page.
```

**sessions justification**
```
Shows recently closed tabs in the Recently closed widget and reopens one when the user clicks it.
```

**search justification**
```
Sends what the user types in the new tab search box to their default search engine.
```

**favicon justification**
```
Shows site icons next to the sites in the Top sites and Recently closed widgets.
```

**activeTab justification**
```
Adds the glass search bar to the tab the user is on, only when they press the keyboard shortcut or the toolbar button.
```

**scripting justification**
```
Inserts the glass search bar into the current tab when the user asks for it, and registers the optional glass Google styling after the user turns it on.
```

**tabs justification**
```
Lets the glass search bar find the user's open tabs by title and switch to one, and notices Google search pages so it can offer the optional glass Google styling once.
```

**alarms justification**
```
Ends the Focus timer at the right time even when no new tab is open.
```

**notifications justification**
```
Tells the user when a Focus timer session has finished.
```

**identity justification** (only if the dashboard shows this box)
```
Optional and only requested when the user chooses to sign in to Google Tasks or Microsoft To Do from the to-do widget's settings. Used to open Chrome's sign-in window for that service.
```

**Host permission justification** (one box for all sites)
```
api.open-meteo.com and geocoding-api.open-meteo.com: get the weather for the city the user typed or for their location.
api.bigdatacloud.net: turns the user's location into a town name for the weather widget, only when they choose "Use my location".
Optional, only requested when the user turns the feature on:
www.google.com: restyles Google search results when the user turns on glass Google search.
calendar.google.com and *.icloud.com: read the iCal link of the calendar the user links.
api.todoist.com: read and update the tasks in the Todoist project the user picks for the to-do widget.
tasks.googleapis.com, graph.microsoft.com and login.microsoftonline.com: sign in to and read and update the Google Tasks or Microsoft To Do list the user picks for the to-do widget.
```

### Are you using remote code?

**No, I am not using remote code**

### Data usage

Tick only these three. Leave every other box unticked.

| Box | Tick? | Why |
| --- | --- | --- |
| Personally identifiable information | no | |
| Health information | no | |
| Financial and payment information | no | |
| **Authentication information** | **yes** | the token for a to-do app the user connects, kept on their computer |
| Personal communications | no | |
| **Location** | **yes** | approximate location for weather, only with "Use my location" |
| **Web history** | **yes** | top sites and recently closed tabs, shown on the new tab only |
| User activity | no | |
| Website content | no | |

Then tick all three **I certify** boxes underneath.

### Privacy policy URL

```
https://kamaldeepghotra.github.io/glass-tab/privacy.html
```

---

## 4. Distribution

| Setting | Value |
| --- | --- |
| Visibility | Public |
| Regions | All regions |
| Pricing | Free |
