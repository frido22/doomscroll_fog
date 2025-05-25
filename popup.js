const snoozeBtn = document.getElementById('snooze-btn');
const disableBtn = document.getElementById('disable-btn');
const settingsBtn = document.getElementById('settings-btn');
const todayEl = document.getElementById('today');

chrome.tabs.query({active: true, currentWindow: true}, tabs => {
  const tabId = tabs[0].id;

  snoozeBtn.addEventListener('click', () => {
    chrome.tabs.sendMessage(tabId, {type: 'snooze30'});
    window.close();
  });

  disableBtn.addEventListener('click', () => {
    chrome.tabs.sendMessage(tabId, {type: 'disableSite'});
    window.close();
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
});

function updateToday() {
  chrome.storage.sync.get(['dailyTotals'], data => {
    const total = data.dailyTotals?.[new Date().toLocaleDateString()] || 0;
    todayEl.textContent = (total/60).toLocaleString(undefined,{maximumFractionDigits:1}) + ' doom minutes today';
  });
}
updateToday();
// Also update if popup regains focus
window.addEventListener('focus', updateToday);
