/*global chrome*/

document.addEventListener('DOMContentLoaded', function () {
  const findDuplicatesButton = document.getElementById('findDuplicates');
  const duplicateListDiv = document.getElementById('duplicateList');
  const matchLevelSlider = document.getElementById('matchLevelSlider');
  const sampleUrlParts = document.querySelectorAll('#sampleUrl span');
  const currentWindowOnlyCheckbox = document.getElementById('currentWindowOnly');
  const httpsOnlyCheckbox = document.getElementById('httpsOnly');

  // On-load, retrieve saved settings from chrome.storage.local, and adjust UI elements
  if (window.chrome && chrome.runtime && chrome.runtime.id) {
    chrome.storage.local.get(
      ['matchLevelSliderValue', 'currentWindowOnlyChecked', 'httpsOnlyChecked'],
      (result) => {
        if (result.matchLevelSliderValue !== undefined) {
          matchLevelSlider.value = result.matchLevelSliderValue;
        }
        if (result.currentWindowOnlyChecked !== undefined) {
          currentWindowOnlyCheckbox.checked = result.currentWindowOnlyChecked;
        }
        if (result.httpsOnlyChecked !== undefined) {
          httpsOnlyCheckbox.checked = result.httpsOnlyChecked;
        }
        // Update UI to reflect loaded values
        updateExampleUrl(sliderToMatchLevel[matchLevelSlider.value]);
      }
    );
  }

  const msgType = Object.freeze({
    GROUP_TABS_CMD: 'get_grouped_tabs',
    GROUP_TABS_ANS: 'grouped_tabs'
  });

  const urlScope = Object.freeze({
    FULL: 'full',
    NO_HASH: 'no-hash',
    NO_QUERY: 'no-query',
    HOSTNAME: 'hostname',
    DOMAIN: 'domain'
  });

  const windowScope = Object.freeze({
    ALL: 'all',
    CURRENT: 'current'
  });

  const sliderToMatchLevel = Object.freeze({
    5: urlScope.FULL,
    4: urlScope.NO_HASH,
    3: urlScope.NO_QUERY,
    2: urlScope.HOSTNAME,
    1: urlScope.DOMAIN
  });

  findDuplicatesButton.addEventListener('click', function () {
    const matchLevel = sliderToMatchLevel[matchLevelSlider.value];
    const scope = currentWindowOnlyCheckbox.checked
      ? windowScope.CURRENT
      : windowScope.ALL;
    const httpsOnly = httpsOnlyCheckbox.checked;

    // Show loading message
    document.getElementById('startSearch').hidden = true;
    document.getElementById('loadingMessage').hidden = false;
    document.getElementById('noDuplicatesMessage').hidden = true;
    document.getElementById('duplicateList').hidden = true;
    duplicateListDiv.innerHTML = '';

    chrome.runtime.sendMessage({
      message: msgType.GROUP_TABS_CMD,
      matchLevel: matchLevel,
      scope: scope,
      httpsOnly: httpsOnly
    });
  });

  if (window.chrome && chrome.runtime && chrome.runtime.id) {
    /* Temporary, while we debug in chrome */
    chrome.runtime.onMessage.addListener(function (request, _sender, _sendResponse) {
      if (request.message === msgType.GROUP_TABS_ANS) {
        displayDuplicateTabs(request.matched_tab_groups);
      }
    });
  }

  matchLevelSlider.addEventListener('input', function (event) {
    const matchLevel = sliderToMatchLevel[event.target.value];
    updateExampleUrl(matchLevel);
    // Save slider value to chrome.storage.local
    chrome.storage.local.set({ matchLevelSliderValue: event.target.value });
  });

  currentWindowOnlyCheckbox.addEventListener('change', function (event) {
    // Save checkbox value to chrome.storage.local
    chrome.storage.local.set({
      currentWindowOnlyChecked: event.target.checked
    });
  });

  httpsOnlyCheckbox.addEventListener('change', function (event) {
    // Save checkbox value to chrome.storage.local
    chrome.storage.local.set({
      httpsOnlyChecked: event.target.checked
    });
  });

  // Highlight the parts of the example URL based on the match level
  function updateExampleUrl(matchLevel) {
    const partMatchers = {
      full: ['subdomains', 'domain', 'path', 'query', 'hash'],
      'no-hash': ['subdomains', 'domain', 'path', 'query'],
      'no-query': ['subdomains', 'domain', 'path'],
      hostname: ['subdomains', 'domain'],
      domain: ['domain']
    };

    const matchedParts = partMatchers[matchLevel] || [];
    console.log('updatematchlevel:', matchedParts);

    // Re-select all parts in case the DOM was changed (can this happen?)
    // const sampleUrlParts = document.querySelectorAll('span');
    // console.log('sampleUrlParts:', sampleUrlParts);

    sampleUrlParts.forEach((part) => {
      // part is the string
      // part.dataset is the DOM
      // part.dataset.part is the value of the 'data-part' property of the DOM obj
      // So, partName is one of 'subdomain', 'domain', 'path', 'query', or 'hash'
      const partName = part.dataset.part;

      // The 'hostname' element contains the 'domain' element in the old HTML structure,
      // so we handle them together.
      if (matchedParts.includes(partName)) {
        part.classList.replace('disabled', 'enabled');
      } else {
        part.classList.replace('enabled', 'disabled');
      }
    });
  }

  function displayDuplicateTabs(groupedTabs) {
    duplicateListDiv.innerHTML = '';
    // No matches
    if (!groupedTabs || groupedTabs.length === 0) {
      document.getElementById('startSearch').hidden = true;
      document.getElementById('loadingMessage').hidden = true;
      document.getElementById('noDuplicatesMessage').hidden = false;
      document.getElementById('duplicateList').hidden = true;
      return;
    }

    const groupTemplate = document.getElementById('matched-group-template');
    const tabTemplate = document.getElementById('tab-item-template');

    groupedTabs.forEach((matchedGroup) => {
      // Clone group template
      const groupNode = groupTemplate.content.cloneNode(true);
      groupNode.querySelector('.matched-group__key').textContent = matchedGroup.matchKey;
      groupNode.querySelector('.matched-group__count').textContent =
        matchedGroup.tabInfos.length;

      const ul = groupNode.querySelector('.matched-group__list');
      matchedGroup.tabInfos.forEach((oneTabInfo, _idx) => {
        // Clone tab template
        const tabNode = tabTemplate.content.cloneNode(true);
        let tabTitle = oneTabInfo.title || '(no title)';
        if (tabTitle.length > 100) {
          tabTitle = tabTitle.substring(0, 100) + '...';
        }

        // Show time since last accessed in human format
        if (oneTabInfo.lastAccessed) {
          const timeSinceAccessMs = Date.now() - oneTabInfo.lastAccessed;
          let timeSinceAccessText = '';
          if (timeSinceAccessMs < 60000) {
            timeSinceAccessText = `${Math.floor(timeSinceAccessMs / 1000)} seconds ago`;
          } else if (timeSinceAccessMs < 3600000) {
            timeSinceAccessText = `${Math.floor(timeSinceAccessMs / 60000)} minutes ago`;
          } else if (timeSinceAccessMs < 86400000) {
            timeSinceAccessText = `${Math.floor(timeSinceAccessMs / 3600000)} hours ago`;
          } else {
            timeSinceAccessText = `${Math.floor(timeSinceAccessMs / 86400000)} days ago`;
          }
          tabNode.querySelector('.tab-item__elapsed').textContent = timeSinceAccessText;
        } else {
          tabNode.querySelector('.tab-item__elapsed').textContent = '';
        }

        tabNode.querySelector('.tab-item__title').textContent = tabTitle;
        tabNode.querySelector('.tab-item__symbol').textContent = oneTabInfo.pinned
          ? '📌'
          : '';

        // Go to tab button
        tabNode.querySelector('.tab-item__goto').addEventListener('click', () => {
          chrome.tabs.update(oneTabInfo.id, { active: true });
          chrome.tabs.get(oneTabInfo.id, (tab) => {
            chrome.windows.update(tab.windowId, { focused: true });
          });
        });
        // Close tab button
        tabNode.querySelector('.tab-item__close').addEventListener('click', () => {
          chrome.tabs.remove(oneTabInfo.id);
          // Remove the tab item from the list
          tabNode.firstElementChild.parentElement.remove();
        });

        ul.appendChild(tabNode);
      });

      // Group actions
      groupNode
        .querySelector('.matched-group__close-all')
        .addEventListener('click', () => {
          // Close all but the first tab in the group
          const tabsToClose = matchedGroup.tabInfos.slice(1);
          const tabIdsToClose = tabsToClose.map((tab) => tab.id);
          chrome.tabs.remove(tabIdsToClose);
          // Remove the group from the DOM
          groupNode.firstElementChild.remove();
          // If no groups left, show empty state
          if (duplicateListDiv.children.length === 0) {
            displayDuplicateTabs([]);
          }
        });
      groupNode
        .querySelector('.matched-group__goto-first')
        .addEventListener('click', () => {
          // Go to the first tab in the group
          const firstTab = matchedGroup.tabInfos[0];
          chrome.tabs.update(firstTab.id, { active: true });
          chrome.tabs.get(firstTab.id, (tab) => {
            chrome.windows.update(tab.windowId, { focused: true });
          });
        });

      duplicateListDiv.appendChild(groupNode);
    });
    document.getElementById('startSearch').hidden = true;
    document.getElementById('loadingMessage').hidden = true;
    document.getElementById('noDuplicatesMessage').hidden = true;
    document.getElementById('duplicateList').hidden = false;
  }
});
