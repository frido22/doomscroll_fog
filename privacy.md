# Doomscroll Fog – Privacy Policy

_Last updated: 2025-05-25_

Doomscroll Fog is an open-source Chrome extension that helps you take breaks from endless feeds by adding a blur overlay after a short period of scrolling. We care about your privacy and designed the extension so **no personal data ever leaves your browser**.

## 1. Data We Store

| Data                                   | Where it is stored | Purpose                              | Retention |
|----------------------------------------|--------------------|--------------------------------------|-----------|
| **Blur settings** (seconds before blur)| `chrome.storage.sync` | Remember your preferred threshold    | Until you change / remove extension |
| **Disabled sites list**                | `chrome.storage.sync` | Know which sites should never blur  | Same |
| **Daily active seconds per device**    | `chrome.storage.sync` | Display the in-page counter          | Reset at local midnight              |

All of the above data is stored **locally in Chrome Sync** and (optionally) synced between your signed-in Chrome browsers. None of it is transmitted to any external server operated by us or third parties.

## 2. Permissions Explained

* `activeTab` – lets the popup snooze or disable the blur on the tab you clicked.
* `storage` – saves the settings and daily totals listed above.
* `alarms` – schedules a local midnight reset of the daily counter.
* `scripting` – injects the blur overlay and counter into the current page.
* Host permissions (`http://*/*`, `https://*/*`) – required to run the content script on any site so the blur can work universally.

The extension **does not**:

* track your browsing history,
* read page content or send it anywhere,
* inject ads or analytics,
* request any additional permissions beyond those listed above.

## 3. Data Sharing & Selling

We **never** sell, rent, or share your data. Because all processing happens locally, we never even receive your data.

## 4. Removal of Data

Uninstalling the extension from Chrome immediately deletes all stored data. You can also clear the extension’s data manually via **chrome://settings/siteData**.

## 5. Contact

Questions or concerns? Please open an issue at
<https://github.com/frido22/doomscroll_fog/issues>.
