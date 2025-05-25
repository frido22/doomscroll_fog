# Doomscroll Fog

Doomscroll Fog is a minimal Chrome extension that helps you curb doomscrolling by gradually blurring social feeds and timelines after a set amount of active scrolling time.

## Features

- **Time-based Blur**: Set how many minutes of active scrolling before the blur effect starts (default: **0.5 min / 30 s**). Blur ramps up linearly after that threshold.
- **Per-site Disable**: Instantly disable/enable the extension for any site via the popup or options page.
- **Snooze**: Temporarily turn off the blur for 30 minutes on any site.
- **Persistent Settings**: All settings and disables sync across Chrome browsers via `chrome.storage.sync`.
- **Simple UI**: Clean popup and options page. Set your blur threshold in minutes (default: 0.5 min).
- **Transparent Icons**: Crisp PNGs (`icons/icon16/32/48/128.png`) generated from `fog.png`, no white square.

## Usage

1. **Install** the extension (load unpacked in Chrome or package for store).
2. **Set your threshold**: Go to Settings and choose how many minutes of scrolling before the blur starts.
3. **Snooze or Disable**: Use the popup to snooze for 30 min or disable on the current site.
4. **Re-enable**: Manage disabled sites from the Settings page.

## Development

- All extension logic is in `content.js`, `background.js`, and UI in `popup.html`, `options.html`.
- **Transparent Icons**: Crisp PNGs (`icons/icon16/32/48/128.png`) generated from `fog.png`, no white square.
- Settings and counters are stored in `chrome.storage.sync`.
- No unnecessary code or dead functions—lean and maintainable.

## Installation

1. Clone the repo:
   ```sh
   git clone https://github.com/frido22/doomscroll_fog.git
   ```
2. In Chrome, go to `chrome://extensions` → Enable Developer Mode → Load Unpacked → select this folder.

## License
MIT

---

**Stop doomscrolling. Let the fog roll in.**
