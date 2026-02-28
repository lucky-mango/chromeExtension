// popup.js — orchestrates messaging and DOM rendering

const statusBar = document.getElementById('status-bar');
const statusText = document.getElementById('status-text');
const results = document.getElementById('results');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const errorMsg = document.getElementById('error-message');
const rideCount = document.getElementById('ride-count');
const totalAmount = document.getElementById('total-amount');
const priceList = document.getElementById('price-list');
const copyBtn = document.getElementById('copy-btn');
const refreshBtn = document.getElementById('refresh-btn');

let lastData = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function setStatus(text, type = 'loading') {
    statusBar.className = `status-bar ${type}`;
    statusText.textContent = text;
    // Hide spinner when not loading
    const spinner = statusBar.querySelector('.spinner');
    if (spinner) spinner.style.display = type === 'loading' ? 'inline-block' : 'none';
}

function showSection(section) {
    [results, emptyState, errorState].forEach(el => el.classList.add('hidden'));
    section.classList.remove('hidden');
}

function formatCurrency(value, symbol = '₹') {
    return `${symbol}${value.toFixed(2)}`;
}

function detectSymbol(prices) {
    if (!prices.length) return '₹';
    const match = prices[0].display.match(/[₹$€£¥]/);
    return match ? match[0] : '₹';
}

function render(data) {
    lastData = data;
    const { prices, total } = data;

    if (!prices.length) {
        showSection(emptyState);
        setStatus('No prices found', 'error');
        copyBtn.disabled = true;
        return;
    }

    const symbol = detectSymbol(prices);

    // Summary
    rideCount.textContent = prices.length;
    totalAmount.textContent = formatCurrency(total, symbol);

    // List
    priceList.innerHTML = '';
    prices.forEach((p, i) => {
        const li = document.createElement('li');
        li.innerHTML = `
      <span class="ride-index">#${i + 1}</span>
      <span class="ride-price">${p.display}</span>
    `;
        priceList.appendChild(li);
    });

    showSection(results);
    setStatus(`${prices.length} ride${prices.length !== 1 ? 's' : ''} found`, 'success');
    copyBtn.disabled = false;
}

// ── Extraction ────────────────────────────────────────────────────────────────

async function extractFromTab() {
    setStatus('Scanning page...', 'loading');
    const spinner = statusBar.querySelector('.spinner');
    if (spinner) spinner.style.display = 'inline-block';
    refreshBtn.classList.add('spinning');

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || !tab.url.includes('riders.uber.com')) {
        showSection(errorState);
        errorMsg.textContent = 'Please navigate to riders.uber.com/trips first.';
        setStatus('Wrong page', 'error');
        copyBtn.disabled = true;
        return;
    }

    // Inject content script programmatically as a fallback (in case it wasn't loaded)
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });
    } catch (_) {
        // Already injected — ignore the error
    }

    chrome.tabs.sendMessage(tab.id, { action: 'extractPrices' }, (response) => {
        refreshBtn.classList.remove('spinning');
        if (chrome.runtime.lastError || !response) {
            showSection(errorState);
            errorMsg.textContent = chrome.runtime.lastError?.message || 'Could not connect to page.';
            setStatus('Connection error', 'error');
            copyBtn.disabled = true;
            return;
        }
        render(response);
    });
}

// ── Copy to Clipboard ─────────────────────────────────────────────────────────

copyBtn.addEventListener('click', () => {
    if (!lastData || !lastData.prices.length) return;

    const symbol = detectSymbol(lastData.prices);
    const lines = lastData.prices.map((p, i) => `#${i + 1}  ${p.display}`);
    lines.push('');
    lines.push(`Total: ${formatCurrency(lastData.total, symbol)}`);
    lines.push(`Rides: ${lastData.prices.length}`);

    const copyLabel = document.getElementById('copy-label');
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
        copyBtn.classList.add('copied');
        copyLabel.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyLabel.textContent = 'Copy to Clipboard';
        }, 2000);
    }).catch(() => {
        copyLabel.textContent = 'Failed — try again';
        setTimeout(() => { copyLabel.textContent = 'Copy to Clipboard'; }, 2000);
    });
});

// ── Refresh ───────────────────────────────────────────────────────────────────

refreshBtn.addEventListener('click', () => {
    extractFromTab();
});

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    extractFromTab();
});
