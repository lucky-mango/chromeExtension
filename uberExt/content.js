// content.js — injected into riders.uber.com pages
// Listens for a message from popup.js and scrapes ride prices from the DOM.

const PRICE_REGEX = /[₹$€£¥][\d,]+\.?\d*/;

function extractPrices() {
  const prices = [];
  const seen = new Set();

  // The Uber trips page HTML structure (from DOM inspection):
  //   div._css-dtlLLD
  //     div[style*="flex: 1 1 0%"]   ← inner flex container
  //       div[data-baseweb="typo-labellarge"]  ← trip destination name
  //       div                                  ← date/time  e.g. "31 Jan • 19:07"
  //       div                                  ← PRICE     e.g. "₹0.00 • Unfulfilled"
  //
  // Strategy 1: grab the 3rd child div of every inner flex container inside trip rows.
  const tripRows = document.querySelectorAll('div[style*="flex: 1 1 0%"][style*="padding-right"]');
  tripRows.forEach((row) => {
    // The price is the last div child (3rd child) of this row
    const children = Array.from(row.children).filter(el => el.tagName === 'DIV');
    const priceEl = children[children.length - 1]; // last div = price line
    if (priceEl) {
      const text = priceEl.innerText.trim();
      const match = text.match(PRICE_REGEX);
      if (match && !seen.has(match[0] + text)) {
        seen.add(match[0] + text);
        const raw = match[0];
        const numeric = parseFloat(raw.replace(/[₹$€£¥,]/g, ''));
        if (!isNaN(numeric)) {
          prices.push({ display: raw, value: numeric });
        }
      }
    }
  });

  // Strategy 2 (fallback): scan every leaf-level div for a price pattern.
  // Only runs if Strategy 1 found nothing.
  if (prices.length === 0) {
    const allDivs = document.querySelectorAll('div');
    allDivs.forEach((el) => {
      // Skip divs that have child divs (not leaf nodes)
      if (el.querySelector('div')) return;
      const text = el.innerText.trim();
      const match = text.match(PRICE_REGEX);
      if (match && !seen.has(match[0] + text)) {
        seen.add(match[0] + text);
        const raw = match[0];
        const numeric = parseFloat(raw.replace(/[₹$€£¥,]/g, ''));
        if (!isNaN(numeric)) {
          prices.push({ display: raw, value: numeric });
        }
      }
    });
  }

  const total = prices.reduce((sum, p) => sum + p.value, 0);
  return { prices, total };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'extractPrices') {
    const result = extractPrices();
    sendResponse(result);
  }
  // Return true to keep the message channel open for async sendResponse
  return true;
});
