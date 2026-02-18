# Uber Ride Price Extractor

A Chrome extension that scrapes all ride prices from your Uber trip history page and calculates the cumulative total.

---

## How It Works

### Overview

The extension injects a content script into `riders.uber.com` pages. When you open the popup, it sends a message to the content script asking it to scan the DOM for ride prices, then displays the results.

### Flow

```
User opens popup
      │
      ▼
popup.js queries the active tab
      │
      ├─ Not on riders.uber.com? → Show error state
      │
      ▼
Injects content.js into the page (if not already present)
      │
      ▼
Sends { action: 'extractPrices' } message to content.js
      │
      ▼
content.js scans the DOM for price elements
      │
      ├─ Strategy 1: targets div[style*="flex: 1 1 0%"][style*="padding-right"]
      │              and reads the last child div (which contains the price text)
      │
      └─ Strategy 2 (fallback): scans all leaf-level divs for currency patterns
      │
      ▼
Returns { prices: [...], total: number } to popup.js
      │
      ▼
popup.js renders the ride list and summary card
```

### DOM Targeting

The Uber trips page renders each trip row roughly like this:

```html
<div class="_css-dtlLLD">
  <div style="flex: 1 1 0%; padding-right: 4px">
    <div data-baseweb="typo-labellarge">Le Méridien New Delhi</div>  <!-- destination -->
    <div>31 Jan • 19:07</div>                                        <!-- date/time -->
    <div>₹0.00 • Unfulfilled</div>                                   <!-- ← PRICE -->
  </div>
</div>
```

`content.js` selects the flex container and reads the **last child div** to extract the price using the regex `/[₹$€£¥][\d,]+\.?\d*/`.

---

## Installation

1. Clone or download this folder.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `uberExt` folder.
5. Navigate to [riders.uber.com/trips](https://riders.uber.com/trips).
6. Click the extension icon in the toolbar.

---

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension config — permissions, content scripts, popup |
| `content.js` | Injected into Uber pages; scrapes ride prices from the DOM |
| `popup.html` | Extension popup UI structure |
| `popup.css` | Popup styles (light theme, system font) |
| `popup.js` | Popup logic — messaging, rendering, copy to clipboard |
| `generate-icons.js` | Script to generate extension icons |
| `icons/` | PNG icons at 16×16, 48×48, 128×128 |

---

## Permissions

| Permission | Why |
|-----------|-----|
| `activeTab` | Read the current tab's URL and send messages to it |
| `scripting` | Programmatically inject `content.js` as a fallback |
| `host_permissions: riders.uber.com` | Allows content script injection on Uber's rider site |

---

## Notes

- Scroll down on the trips page to load more rides before opening the popup — Uber uses virtual/lazy rendering.
- The extension supports ₹, $, €, £, and ¥ currency symbols.
- The **Copy to Clipboard** button exports a plain-text summary of all rides and the total.
