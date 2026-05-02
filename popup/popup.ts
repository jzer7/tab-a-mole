/* popup.ts */

import { initTabSearch } from '../scripts/tab-search-controller';

document.addEventListener('DOMContentLoaded', function () {
  console.info('Popup loaded');
  window.scrollTo(0, 0);

  const { showSearchError } = initTabSearch();

  /* -----------------------------------------------
     Popup-specific: sidebar button
     ----------------------------------------------- */

  const openSidebarButton = document.getElementById(
    'openSidebarPreview'
  ) as HTMLButtonElement | null;

  if (!openSidebarButton) {
    return;
  }

  if (!chrome.sidePanel || typeof chrome.sidePanel.open !== 'function') {
    openSidebarButton.disabled = true;
    openSidebarButton.setAttribute('aria-disabled', 'true');
    openSidebarButton.title = 'Sidebar mode is not supported in this browser.';
    return;
  }

  openSidebarButton.disabled = false;
  openSidebarButton.removeAttribute('aria-disabled');
  openSidebarButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0]?.id;
      if (!activeTabId) {
        showSearchError('Could not open sidebar for this tab.');
        return;
      }

      chrome.sidePanel.setOptions({ enabled: true }, () => {
        chrome.sidePanel.open({ tabId: activeTabId }, () => {
          if (!chrome.runtime.lastError) {
            return;
          }
          showSearchError('Could not open sidebar in this window.');
        });
      });
    });
  });
});
