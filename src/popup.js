/*global chrome*/

const { timeSinceAccessText, fillGroupNode } = require('./popup-utils');

document.addEventListener('DOMContentLoaded', function () {
  console.info('Popup script loaded');

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

  /* 1. Listen for clicks on the Find Duplicates button
   *    When clicked, send a message to the background script to find
   *    duplicates. The background script will respond with the results,
   *    which we will display
   */
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
      httpsOnly: httpsOnly,
      matchBy: document.querySelector('input[name="match-by"]:checked').value
    });
  });

  // add the next line if debugging keep messing up with chrome
  // if (window.chrome && chrome.runtime && chrome.runtime.id)

  /* 2. Listen for messages from the background script */
  chrome.runtime.onMessage.addListener(function (request, _sender, _sendResponse) {
    if (request.message === msgType.GROUP_TABS_ANS) {
      displayGroupedTabs(request.matched_tab_groups);
    }
  });

  // 3. Listen for changes to all the "match by" radio buttons
  //    When "URL" is selected, show the URL scope fieldset and enable the slider
  //    When "Title" is selected, hide the URL scope fieldset and disable the slider
  const matchByRadios = document.getElementsByName('match-by');
  matchByRadios.forEach((radio) => {
    radio.addEventListener('change', function (event) {
      const value = event.target.value;
      const urlScopeFieldset = document.getElementById('urlScope');
      if (value === 'url') {
        urlScopeFieldset.hidden = false;
        matchLevelSlider.disabled = false;
      } else {
        urlScopeFieldset.hidden = true;
        matchLevelSlider.disabled = true;
      }
    });
  });

  // 4. Listen for changes to the match level slider
  //    When there's a change, save the slider's value to
  //    chrome.storage.local
  matchLevelSlider.addEventListener('input', function (event) {
    const matchLevel = sliderToMatchLevel[event.target.value];
    updateExampleUrl(matchLevel);
    chrome.storage.local.set({ matchLevelSliderValue: event.target.value });
  });

  // 5. Listen for changes to the "current window only" checkbox
  //    When there's a change, save the checkbox's value to
  //    chrome.storage.local
  currentWindowOnlyCheckbox.addEventListener('change', function (event) {
    // Save checkbox value to chrome.storage.local
    chrome.storage.local.set({ currentWindowOnlyChecked: event.target.checked });
  });

  // 6. Listen for changes to the "HTTPS only" checkbox
  //    When there's a change, save the checkbox's value to
  //    chrome.storage.local
  httpsOnlyCheckbox.addEventListener('change', function (event) {
    // Save checkbox value to chrome.storage.local
    chrome.storage.local.set({ httpsOnlyChecked: event.target.checked });
  });

  // Highlight the parts of the example URL matching the level from the slider
  function updateExampleUrl(matchLevel) {
    const partMatchers = {
      full: ['subdomains', 'domain', 'path', 'query', 'hash'],
      'no-hash': ['subdomains', 'domain', 'path', 'query'],
      'no-query': ['subdomains', 'domain', 'path'],
      hostname: ['subdomains', 'domain'],
      domain: ['domain']
    };

    const matchedParts = partMatchers[matchLevel] || [];
    console.debug('updatematchlevel:', matchedParts);

    // Re-select all parts in case the DOM was changed (can this happen?)
    // const sampleUrlParts = document.querySelectorAll('span');

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

  function displayGroupedTabs(groupedTabs) {
    console.debug('Displaying grouped tabs:', groupedTabs);

    // Clear previous results
    duplicateListDiv.innerHTML = '';

    // Show: no matches
    if (!groupedTabs || groupedTabs.length === 0) {
      document.getElementById('startSearch').hidden = true;
      document.getElementById('loadingMessage').hidden = true;
      document.getElementById('noDuplicatesMessage').hidden = false;
      document.getElementById('duplicateList').hidden = true;
      return;
    }

    // There's at least one match, so we proceed to display them

    // First let's get the templates
    const groupTemplate = document.getElementById('matched-group-template');
    const tabTemplate = document.getElementById('tab-item-template');

    // Add callbacks to be passed to fillGroupNode
    const callbacks = {
      onGoToTab: (tabInfo) => {
        chrome.tabs.update(tabInfo.id, { active: true });
        chrome.tabs.get(tabInfo.id, (tab) => {
          chrome.windows.update(tab.windowId, { focused: true });
        });
      },
      onCloseTab: (tabInfo, tabNode) => {
        chrome.tabs.remove(tabInfo.id);
        // Remove the tab item from the list
        tabNode.firstElementChild.parentElement.remove();
      },
      onGoToFirstTab: (firstTab) => {
        chrome.tabs.update(firstTab.id, { active: true });
        chrome.tabs.get(firstTab.id, (tab) => {
          chrome.windows.update(tab.windowId, { focused: true });
        });
      },
      onCloseAllTabs: (tabInfos, groupNode) => {
        const tabsToClose = tabInfos.slice(1);
        const tabIdsToClose = tabsToClose.map((tab) => tab.id);
        chrome.tabs.remove(tabIdsToClose);
        groupNode.firstElementChild.remove();
        if (duplicateListDiv.children.length === 0) {
          displayGroupedTabs([]);
        }
      }
    };

    groupedTabs.forEach((matchedGroup) => {
      // 2. Call function to fill in the groupNode DOM element with data from matchedGroup
      const filledGroupNode = fillGroupNode({
        groupTemplate,
        tabTemplate,
        matchedGroup,
        timeSinceAccessText,
        ...callbacks
      });

      // 4. Append filled group node to the list (DOM)
      duplicateListDiv.appendChild(filledGroupNode);
    });

    document.getElementById('startSearch').hidden = true;
    document.getElementById('loadingMessage').hidden = true;
    document.getElementById('noDuplicatesMessage').hidden = true;
    document.getElementById('duplicateList').hidden = false;
  }
});
