chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['domains'], data => {
    if (!Array.isArray(data.domains)) {
      chrome.storage.sync.set({domains: ['twitter.com', 'linkedin.com']});
    }
  });
});

// Throttled active seconds updates to stay within storage quota
let pendingSeconds = 0;
let flushTimeout = null;

function flushTotals() {
  const todayKey = new Date().toLocaleDateString();
  const deltaToSave = pendingSeconds;
  pendingSeconds = 0;
  chrome.storage.sync.get(['dailyTotals', 'siteTotals'], data => {
    const totals = data.dailyTotals || {};
    const siteTotals = data.siteTotals || {};
    const current = Number(totals[todayKey]) || 0;
    totals[todayKey] = current + deltaToSave;

    if (flushTotals.lastHostname) {
      const siteKey = `${todayKey}|${flushTotals.lastHostname}`;
      siteTotals[siteKey] = (siteTotals[siteKey] || 0) + deltaToSave;
    }

    chrome.storage.sync.set({dailyTotals: totals, siteTotals});
  });
  flushTimeout = null;
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'updateActiveSeconds') {
    const delta = Number(msg.delta) || 0;
    if (!delta) return;
    pendingSeconds += delta;
    flushTotals.lastHostname = msg.hostname;
    if (!flushTimeout) {
      flushTimeout = setTimeout(flushTotals, 1000); // flush once per second max
    }
  }
});

// Snooze message from content script or popup
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'snooze') {
    if (sender.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, {type: 'snooze'});
    }
  }
});

// Disable for 10 minutes
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'disableTab' && sender.tab?.id) {
    chrome.action.disable(sender.tab.id);
    setTimeout(() => chrome.action.enable(sender.tab.id), 10 * 60 * 1000);
  }
});

// No more icon_grey.svg; always use icon.svg for all states
chrome.runtime.onMessage.addListener((msg, sender) => {
  if ((msg.type === 'inactiveTab' || msg.type === 'activeTab') && sender.tab?.id) {
    chrome.action.setIcon({tabId: sender.tab.id, path: {
      16: 'icons/fog.svg',
      32: 'icons/fog.svg',
      48: 'icons/fog.svg',
      128: 'icons/fog.svg'
    }});
  }
});

// Midnight reset alarm
chrome.alarms.create('midnightReset', {when: getNextMidnight(), periodInMinutes: 24 * 60});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'midnightReset') {
    chrome.storage.sync.set({dailyTotals: {}});
  }
});

function getNextMidnight() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime();
}
