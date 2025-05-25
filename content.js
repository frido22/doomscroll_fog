const MAX_BLUR = 12; // px
let secondsBeforeBlur = 30; // default 0.5 min before blur begins (30s)
let doomSeconds = 0; // cumulative active scrolling seconds
let activeUntil = 0; // timestamp in ms
let lastFrame = Date.now();
let veil;
let counter;
let snoozedUntil = 0;

const hostname = location.hostname.replace(/^www\./, '');

// (START_BLUR_RATIO constant removed; blur now ramps linearly after threshold)

function createVeil() {
  veil = document.createElement('div');
  veil.id = 'doom-veil';
  Object.assign(veil.style, {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 2147483647,
    backdropFilter: 'blur(0px)',
    transition: 'backdrop-filter 0.1s linear'
  });
  document.documentElement.appendChild(veil);
}

let modalShown = false;

function createCounter() {
  counter = document.createElement('div');
  counter.id = 'doom-counter';
  Object.assign(counter.style, {
    position: 'fixed',
    bottom: '12px',
    right: '12px',
    background: 'rgba(17,17,17,0.75)',
    color: '#eee',
    padding: '6px 10px',
    borderRadius: '10px',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    fontSize: '13px',
    letterSpacing: '0.2px',
    zIndex: 2147483648,
    boxShadow: '0 0 4px rgba(0,0,0,0.4)',
    display: 'none'
  });
  updateCounter();
  document.documentElement.appendChild(counter);
}

function showModal() {
  if (modalShown) return;
  modalShown = true;
  const modal = document.createElement('div');
  modal.id = 'doom-modal';
  Object.assign(modal.style, {
    position: 'fixed',
    bottom: '48px',
    right: '24px',
    background: '#fff',
    color: '#222',
    padding: '24px 20px 16px 20px',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
    fontFamily: 'sans-serif',
    fontSize: '16px',
    zIndex: 2147483649,
    minWidth: '220px',
    textAlign: 'center',
  });
  chrome.storage.sync.get(['dailyTotals'], data => {
    const today = data.dailyTotals?.[new Date().toLocaleDateString()] || 0;
    modal.innerHTML = `
      <div style="font-size:18px;margin-bottom:12px;">
        ${today.toLocaleString(undefined, {maximumFractionDigits: 1})} doom screens (today)
      </div>
      <button id="doom-snooze">Snooze 30 min</button>
      <button id="doom-disable">Disable on this website</button>
      <button id="doom-close">Close</button>
    `;
    document.body.appendChild(modal);
    document.getElementById('doom-snooze').onclick = () => {
      snoozedUntil = Date.now() + 30 * 60 * 1000;
      modal.remove();
    };
    document.getElementById('doom-disable').onclick = () => {
      chrome.storage.sync.get(['disabledSites'], s => {
        const arr = s.disabledSites || [];
        if (!arr.includes(hostname)) arr.push(hostname);
        chrome.storage.sync.set({disabledSites: arr}, () => {
          veil.remove();
          counter.remove();
          modal.remove();
        });
      });
    };
    document.getElementById('doom-close').onclick = () => {
      modal.remove();
    };
  });
}

function updateCounter() {
  chrome.storage.sync.get(['dailyTotals'], data => {
    const today = data.dailyTotals?.[new Date().toLocaleDateString()] || 0;
    counter.innerHTML = `${(today/60).toLocaleString(undefined, {maximumFractionDigits: 1})} doom minutes (today)`;
  });
}

// Listen for changes in storage and update counter live
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.dailyTotals) {
    updateCounter();
  }
});

function animate() {
  const now = Date.now();

  // Snooze handling
  if (now < snoozedUntil) {
    if (veil.style.display !== 'none') veil.style.display = 'none';
    requestAnimationFrame(animate);
    return;
  } else if (veil.style.display === 'none') {
    veil.style.display = '';
  }

  // Accumulate real active time only if user is within active window
  let dt = (now - lastFrame) / 1000;
  if (dt < 0 || dt > 10) dt = 0; // prevent NaN/negative/huge jumps
  if (now < activeUntil) {
    doomSeconds += dt;
    chrome.runtime.sendMessage({type: 'updateActiveSeconds', delta: dt});
  }
  lastFrame = now;

  let blur = 0;
  if (doomSeconds > secondsBeforeBlur) {
    const ratio = Math.min(1, (doomSeconds - secondsBeforeBlur) / secondsBeforeBlur); // full blur after another equal interval
    blur = MAX_BLUR * ratio;
  }
  veil.style.backdropFilter = `blur(${blur}px)`;

  if (blur > 0) {
    counter.style.display = '';
  } else {
    counter.style.display = 'none';
  }

  requestAnimationFrame(animate);
}

function start() {
  createVeil();
  createCounter();
  requestAnimationFrame(animate);
}

// Migration: if old localStorage flag exists, move to sync storage
if (localStorage.getItem('doomfog_disable_' + location.hostname) === '1') {
  chrome.storage.sync.get(['disabledSites'], data => {
    const set = new Set(data.disabledSites || []);
    set.add(hostname);
    chrome.storage.sync.set({disabledSites: Array.from(set)}, () => {
      localStorage.removeItem('doomfog_disable_' + location.hostname);
    });
  });
}

// Check sync storage for disable
chrome.storage.sync.get(['disabledSites', 'secondsBeforeBlur'], data => {
  if (Array.isArray(data.disabledSites) && data.disabledSites.includes(hostname)) {
    return; // disabled, do nothing
  }
  const stored = Number(data.secondsBeforeBlur);
  secondsBeforeBlur = stored >= 1 ? stored : 30;
  start();
});

// Attach wheel listeners to all possible scrollable elements
function markActive() {
  activeUntil = Date.now() + 2000; // 2s active window
}
function handleWheel(e) { markActive(); }
function handleScroll(e) { markActive(); }

// Attach to window, document, and all scrollable elements
function attachWheelListeners() {
  window.addEventListener('wheel', handleWheel, {passive: true, capture: true});
  document.addEventListener('wheel', handleWheel, {passive: true, capture: true});
  window.addEventListener('scroll', handleScroll, {passive: true});
  document.addEventListener('scroll', handleScroll, {passive: true});
  document.querySelectorAll('[style*="overflow"], [tabindex], [role=region], [aria-label]').forEach(el => {
    el.addEventListener('wheel', handleWheel, {passive: true, capture: true});
    el.addEventListener('scroll', handleScroll, {passive: true});
  });
}
attachWheelListeners();

// MutationObserver for dynamically added feeds (Twitter)
const observer = new MutationObserver(() => {
  attachWheelListeners();
});
observer.observe(document.body, {childList: true, subtree: true});

// Accumulate for touchmove (mobile)
window.addEventListener('touchmove', markActive, {passive: true});

// Fallback for key scrolling (PgDown, Space, ArrowDown)
window.addEventListener('keydown', e => {
  if (["PageDown", " ", "ArrowDown"].includes(e.key)) markActive();
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'snooze') {
    snoozedUntil = Date.now() + 60000; // 60 s legacy
  } else if (msg.type === 'snooze30') {
    snoozedUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
  } else if (msg.type === 'disableSite') {
    chrome.storage.sync.get(['disabledSites'], s => {
      const arr = s.disabledSites || [];
      if (!arr.includes(hostname)) arr.push(hostname);
      chrome.storage.sync.set({disabledSites: arr});
    });
    veil?.remove();
    counter?.remove();
  } else if (msg.type === 'disableTab') {
    veil?.remove();
    counter?.remove();
    chrome.runtime.onMessage.removeListener(this);
  }
});

// React to settings changes while the tab is open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.secondsBeforeBlur) {
    const val = Number(changes.secondsBeforeBlur.newValue);
    if (val >= 1) secondsBeforeBlur = val;
  }
});
