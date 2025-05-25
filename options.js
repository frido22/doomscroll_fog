const disabledList = document.getElementById('disabled-list');
const removeBtn = document.getElementById('remove-disabled');
const saveBtn = document.getElementById('save');
const statusEl = document.getElementById('status');
const minuteInput = document.getElementById('minute-input');

function populateDisabled(sites) {
  disabledList.innerHTML = '';
  (sites || []).forEach(domain => {
    const opt = document.createElement('option');
    opt.value = domain;
    opt.textContent = domain;
    disabledList.appendChild(opt);
  });
}

function load() {
  chrome.storage.sync.get(['disabledSites', 'secondsBeforeBlur'], data => {
    populateDisabled(data.disabledSites || []);
    minuteInput.value = (data.secondsBeforeBlur||120)/60;
  });
}

// Save secondsBeforeBlur and disabledSites (already updated by UI actions)
saveBtn.addEventListener('click', () => {
  const secs = Number(minuteInput.value)*60;
  chrome.storage.sync.set({secondsBeforeBlur: secs}, () => {
    statusEl.textContent = 'Saved!';
    setTimeout(() => statusEl.textContent = '', 1000);
  });
});

removeBtn.addEventListener('click', () => {
  const toRemove = Array.from(disabledList.selectedOptions).map(o => o.value);
  chrome.storage.sync.get(['disabledSites'], data => {
    let arr = data.disabledSites || [];
    arr = arr.filter(d => !toRemove.includes(d));
    chrome.storage.sync.set({disabledSites: arr}, () => {
      populateDisabled(arr);
    });
  });
});

load();

// Keep list in sync if this page stays open while user disables sites elsewhere
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.disabledSites) {
    populateDisabled(changes.disabledSites.newValue || []);
  }
});
