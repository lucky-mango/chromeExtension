# Trip Cost Calculator for Uber

> A Chrome extension that scans your Uber trip history and calculates the cumulative total cost — instantly.

![Manifest Version](https://img.shields.io/badge/Manifest-V3-blue)
![Chrome](https://img.shields.io/badge/Chrome-102%2B-yellow?logo=googlechrome)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- 🔍 Automatically extracts all ride prices visible on your Uber trips page
- 💰 Calculates the **cumulative total** across all loaded rides
- 📋 **Copy to clipboard** — exports a plain-text summary of all rides and the total
- 🌍 Supports multiple currencies: ₹, $, €, £, ¥
- ⚡ Works entirely in your browser — no data ever leaves your device

---

## 🚀 Installation (Developer Mode)

> The extension is not yet on the Chrome Web Store. Install it manually:

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `uberExt` folder.
5. Navigate to [riders.uber.com/trips](https://riders.uber.com/trips).
6. Click the extension icon in the toolbar.

> **Tip:** Scroll down on the trips page to load more rides _before_ opening the popup — Uber uses lazy/virtual rendering, so only visible rides are counted.

---

## 🔒 Permissions

| Permission                          | Why it's needed                                     |
| ----------------------------------- | --------------------------------------------------- |
| `activeTab`                         | Read the current tab's URL and communicate with it  |
| `scripting`                         | Inject the price-scraping script into the Uber page |
| `host_permissions: riders.uber.com` | Scope access strictly to Uber's rider site only     |

---

## 🗂️ Project Structure

| File            | Purpose                                                    |
| --------------- | ---------------------------------------------------------- |
| `manifest.json` | Extension config — permissions, icons, content scripts     |
| `content.js`    | Injected into Uber pages; scrapes ride prices from the DOM |
| `popup.html`    | Extension popup UI structure                               |
| `popup.css`     | Popup styles                                               |
| `popup.js`      | Popup logic — messaging, rendering, copy to clipboard      |
| `icons/`        | PNG icons at 16×16, 48×48, 128×128                         |

---

## ⚙️ How It Works

```
User opens popup
      │
      ▼
popup.js checks the active tab
      │
      ├─ Not on riders.uber.com? → Show error
      │
      ▼
Sends { action: 'extractPrices' } to content.js
      │
      ▼
content.js scans the DOM for price elements
      │
      ├─ Strategy 1: targets flex container divs with padding-right style
      │              and reads the last child div (contains the price text)
      │
      └─ Strategy 2 (fallback): scans all leaf divs for currency patterns
      │
      ▼
Returns { prices: [...], total: number } to popup.js
      │
      ▼
popup.js renders the ride list and total summary
```

### DOM Targeting

The Uber trips page renders each trip row roughly like this:

```html
<div class="_css-dtlLLD">
  <div style="flex: 1 1 0%; padding-right: 4px">
    <div data-baseweb="typo-labellarge">Le Méridien New Delhi</div>
    <!-- destination -->
    <div>31 Jan • 19:07</div>
    <!-- date/time -->
    <div>₹0.00 • Unfulfilled</div>
    <!-- ← PRICE -->
  </div>
</div>
```

`content.js` selects the flex container and reads the **last child div**, extracting the price using the regex `/[₹$€£¥][\d,]+\.?\d*/`.

---

## 🤝 Contributing

Contributions are welcome! If Uber updates their DOM structure and the extension breaks, feel free to open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

> **Disclaimer:** This extension is not affiliated with, endorsed by, or connected to Uber Technologies, Inc. "Uber" is a trademark of Uber Technologies, Inc.
