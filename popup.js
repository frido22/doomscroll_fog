const snoozeBtn = document.getElementById('snooze-btn');
const disableBtn = document.getElementById('disable-btn');
const settingsBtn = document.getElementById('settings-btn');
const todayEl = document.getElementById('today');
let tooltipDiv = null;

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

function showTooltip(anchor, html) {
  hideTooltip();
  tooltipDiv = document.createElement('div');
  tooltipDiv.style.position = 'absolute';
  tooltipDiv.style.background = '#222';
  tooltipDiv.style.color = '#fff';
  tooltipDiv.style.padding = '10px 14px';
  tooltipDiv.style.borderRadius = '8px';
  tooltipDiv.style.boxShadow = '0 2px 12px #0006';
  tooltipDiv.style.fontSize = '13px';
  tooltipDiv.style.zIndex = 9999;
  tooltipDiv.style.maxWidth = '260px';
  tooltipDiv.innerHTML = html;

  document.body.appendChild(tooltipDiv);
  const rect = anchor.getBoundingClientRect();
  tooltipDiv.style.left = (rect.left + window.scrollX) + 'px';
  tooltipDiv.style.top = (rect.bottom + window.scrollY + 6) + 'px';
}

function hideTooltip() {
  if (tooltipDiv) {
    tooltipDiv.remove();
    tooltipDiv = null;
  }
}

function getSiteTotalsTooltip(callback) {
  const todayKey = new Date().toLocaleDateString();
  chrome.storage.sync.get(['siteTotals'], data => {
    const siteTotals = data.siteTotals || {};
    const todaySites = Object.entries(siteTotals)
      .filter(([key]) => key.startsWith(todayKey + '|'))
      .map(([key, seconds]) => {
        const site = key.split('|')[1];
        return {site, seconds};
      })
      .sort((a, b) => b.seconds - a.seconds);

    let tooltip = '';
    if (todaySites.length <= 5) {
      tooltip = todaySites.map(s =>
        `<div>${s.site}: ${(s.seconds/60).toFixed(1)} min</div>`
      ).join('');
      callback(tooltip);
    } else {
      const firstTen = todaySites.slice(0, 5);
      const rest = todaySites.slice(5);
      tooltip = firstTen.map(s =>
        `<div>${s.site}: ${(s.seconds/60).toFixed(1)} min</div>`
      ).join('');
      tooltip += `<div id="expand-sites" style="color:#fff;cursor:pointer;margin-top:6px;">+${rest.length} more…</div>`;
      callback(tooltip, todaySites);
    }
  });
}

todayEl.addEventListener('mouseenter', () => {
  getSiteTotalsTooltip((tooltip, todaySites) => {
    showTooltip(todayEl, tooltip);

    // If expandable, add expand logic
    if (todaySites && todaySites.length > 10) {
      setTimeout(() => {
        const expand = document.getElementById('expand-sites');
        if (expand) {
          expand.addEventListener('mouseenter', () => {
            const allSites = todaySites.map(s =>
              `<div>${s.site}: ${(s.seconds/60).toFixed(1)} min</div>`
            ).join('');
            showTooltip(todayEl, allSites);
          });
          expand.addEventListener('mouseleave', () => {
            showTooltip(todayEl, tooltip);
          });
        }
      }, 0);
    }
  });
});
todayEl.addEventListener('mouseleave', hideTooltip);

function updateToday() {
  chrome.storage.sync.get(['dailyTotals'], data => {
    const total = data.dailyTotals?.[new Date().toLocaleDateString()] || 0;
    todayEl.textContent = (total/60).toLocaleString(undefined,{maximumFractionDigits:1}) + ' doom minutes today';  
  });
}
updateToday();

function getCurrentSiteKey() {
  return `${new Date().toLocaleDateString()}|${location.hostname.replace(/^www\./, '')}`;
}

function updateCurrentSiteInTooltip() {
  if (tooltipDiv && tooltipDiv.parentNode) {
    const todayKey = new Date().toLocaleDateString();
    const currentSiteKey = getCurrentSiteKey();
    chrome.storage.sync.get(['siteTotals'], data => {
      const siteTotals = data.siteTotals || {};
      const todaySites = Object.entries(siteTotals)
        .filter(([key]) => key.startsWith(todayKey + '|'))
        .map(([key, seconds]) => {
          const site = key.split('|')[1];
          const isCurrent = key === currentSiteKey;
          return {site, seconds, isCurrent};
        })
        .sort((a, b) => b.seconds - a.seconds);

      let tooltip = '';
      if (todaySites.length <= 5) {
        tooltip = todaySites.map(s =>
          `<div${s.isCurrent ? ' style="font-weight:bold;color:#fff;"' : ''}>${s.site}: ${(s.seconds/60).toFixed(1)} min</div>`
        ).join('');
        showTooltip(todayEl, tooltip);
      } else {
        const firstTen = todaySites.slice(0, 10);
        const rest = todaySites.slice(10);
        tooltip = firstTen.map(s =>
          `<div${s.isCurrent ? ' style="font-weight:bold;color:#fff;"' : ''}>${s.site}: ${(s.seconds/60).toFixed(1)} min</div>`
        ).join('');
        tooltip += `<div id="expand-sites" style="color:#fff;cursor:pointer;margin-top:6px;">+${rest.length} more…</div>`;
        showTooltip(todayEl, tooltip);

        setTimeout(() => {
          const expand = document.getElementById('expand-sites');
          if (expand) {
            expand.addEventListener('mouseenter', () => {
              const allSites = todaySites.map(s =>
                `<div${s.isCurrent ? ' style="font-weight:bold;color:#fff;"' : ''}>${s.site}: ${(s.seconds/60).toFixed(1)} min</div>`
              ).join('');
              showTooltip(todayEl, allSites);
            });
            expand.addEventListener('mouseleave', () => {
              showTooltip(todayEl, tooltip);
            });
          }
        }, 0);
      }
    });
  }
}

// Also update if popup regains focus
window.addEventListener('focus', () => {
  updateToday();
  updateCurrentSiteInTooltip();
});

// Also update if dailyTotals changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.dailyTotals || changes.siteTotals)) {
    updateToday();
    updateCurrentSiteInTooltip();
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

// Add star CSS if not present
(function addStarStyles() {
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