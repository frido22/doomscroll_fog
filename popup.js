const snoozeBtn = document.getElementById('snooze-btn');
const snoozeLabel = document.getElementById('snooze-label');
const snoozeProgress = document.getElementById('snooze-progress');
const disableBtn = document.getElementById('disable-btn');
const settingsBtn = document.getElementById('settings-btn');
const todayEl = document.getElementById('today');

chrome.tabs.query({active: true, currentWindow: true}, tabs => {
  const tabId = tabs[0].id;

  let snoozeTimer = null;
  let snoozeEnd = 0;

  function updateSnoozeUI() {
    chrome.storage.sync.get(['snoozedUntil'], data => {
      const now = Date.now();
      snoozeEnd = data.snoozedUntil || 0;
      if (snoozeEnd > now) {
        // Snooze is active
        const total = 30 * 60 * 1000; // 30 min
        const left = Math.max(0, snoozeEnd - now);
        const percent = 1 - (left / total);
        snoozeLabel.textContent = 'Unsnooze';
        snoozeProgress.style.width = (percent * 100) + '%';
        snoozeProgress.style.display = 'block';
        snoozeBtn.classList.add('snooze-active');
        if (!snoozeTimer) {
          snoozeTimer = setInterval(updateSnoozeUI, 1000);
        }
      } else {
        // Not snoozed
        snoozeLabel.textContent = 'Snooze 30 min';
        snoozeProgress.style.width = '0';
        snoozeProgress.style.display = 'block';
        snoozeBtn.classList.remove('snooze-active');
        if (snoozeTimer) {
          clearInterval(snoozeTimer);
          snoozeTimer = null;
        }
      }
    });
  }

  snoozeBtn.addEventListener('click', () => {
    chrome.storage.sync.get(['snoozedUntil'], data => {
      const now = Date.now();
      const snoozedUntil = data.snoozedUntil || 0;
      if (snoozedUntil > now) {
        // Unsnooze
        chrome.tabs.sendMessage(tabId, {type: 'unsnooze'});
        chrome.storage.sync.set({snoozedUntil: 0}, updateSnoozeUI);
      } else {
        // Start snooze
        chrome.tabs.sendMessage(tabId, {type: 'snooze30'});
        chrome.storage.sync.set({snoozedUntil: now + 30 * 60 * 1000}, updateSnoozeUI);
      }
      setTimeout(updateSnoozeUI, 200);
    });
  });

  disableBtn.addEventListener('click', () => {
    chrome.tabs.sendMessage(tabId, {type: 'disableSite'});
    window.close();
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  updateSnoozeUI();
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

// Also update uf dailyTotals changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.dailyTotals) {
    updateToday(); 
  }
});

// --- Star review encouragement logic ---
const starRow = document.getElementById('star-row');
const stars = starRow ? starRow.querySelectorAll('.star') : [];
const reviewLink = document.getElementById('review-link');
let selectedRating = 0;

// Enforce #aaa color for review link and Sundai credit
if (reviewLink) reviewLink.style.color = '#aaa';
const sundaiLink = document.querySelector('#review-section a[href*="sundai.club"]');
if (sundaiLink) sundaiLink.style.color = '#aaa';

// Add star and snooze progress CSS if not present
(function addPopupStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .star {
      font-size: 22px;
      color: #ffd600;
      cursor: pointer;
      transition: transform 0.1s;
      margin: 0 1.5px;
      filter: drop-shadow(0 1px 1px #222a);
      user-select: none;
    }
    .star.inactive {
      color: #bbb;
      filter: none;
    }
    .star.selected, .star:hover, .star.hovered {
      color: #ffd600;
      transform: scale(1.14);
      filter: drop-shadow(0 2px 2px #222a);
    }
    .snooze-btn {
      position: relative;
      overflow: hidden;
    }
    #snooze-progress {
      position: absolute;
      left: 0; top: 0; height: 100%; width: 0;
      background: #bbb;
      opacity: 0.35;
      z-index: 0;
      transition: width 0.25s;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
})();

function highlightStars(rating) {
  stars.forEach((star, i) => {
    if (i < rating) {
      star.classList.add('selected');
      star.classList.remove('inactive');
    } else {
      star.classList.remove('selected');
      star.classList.add('inactive');
    }
  });
}

stars.forEach((star, idx) => {
  star.addEventListener('mouseenter', () => highlightStars(idx + 1));
  star.addEventListener('mouseleave', () => highlightStars(selectedRating));
  star.addEventListener('click', () => {
    selectedRating = idx + 1;
    highlightStars(selectedRating);
    if (reviewLink) reviewLink.click();
  });
});
highlightStars(5); // default: all gold
