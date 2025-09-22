/* popup.js */

import { changeResultState, renderTabGroups } from './popup-utils.js';
import { msgType, resultState, sliderToMatchLevel, windowScope } from './popup-values.js';

document.addEventListener('DOMContentLoaded', function () {
  console.info('Popup script loaded');

  const matchLevelSlider = document.getElementById('matchLevelSlider');
  const sampleUrlParts = document.querySelectorAll('#sampleUrl span');
  const currentWindowOnlyCheckbox = document.getElementById('currentWindowOnly');
  const httpsOnlyCheckbox = document.getElementById('httpsOnly');
  const findDuplicatesButton = document.getElementById('findDuplicates');
  const duplicateListDiv = document.getElementById('duplicateList');

  // Callbacks to be passed to rendering functions
  // These functions will be called when the user interacts with
  // the rendered tab groups and tab items
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
        changeResultState(resultState.NO_DUPLICATES);
      }
    }
  };

  /* -----------------------------------------------
     Helper function to render example data on load
     ----------------------------------------------- */
  changeResultState(resultState.START);

  /* -----------------------------------------------
     1. Load settings and initialize UI
     ----------------------------------------------- */

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

  /* -----------------------------------------------
     2. Set up event listeners for settings controls
     ----------------------------------------------- */

  const matchByRadios = document.getElementsByName('match-by');
  matchByRadios.forEach((radio) => {
    radio.addEventListener('change', function (event) {
      const value = event.target.value;
      const httpsOnlyCheckbox = document.getElementById('httpsOnly');
      const exampleUrlDiv = document.getElementById('exampleUrl');
      if (value === 'url') {
        // searchByUrlDiv.hidden = false;
        matchLevelSlider.disabled = false;
        httpsOnlyCheckbox.disabled = false;
        exampleUrlDiv.disabled = false;
      } else {
        // searchByUrlDiv.hidden = true;
        matchLevelSlider.disabled = true;
        httpsOnlyCheckbox.disabled = true;
        exampleUrlDiv.disabled = true;
      }
    });
  });

  /* -----------------------------------------------
     3. Set up event listeners for settings controls
     ----------------------------------------------- */

  matchLevelSlider.addEventListener('input', function (event) {
    const matchLevel = sliderToMatchLevel[event.target.value];
    updateExampleUrl(matchLevel);
    chrome.storage.local.set({ matchLevelSliderValue: event.target.value });
  });

  /* -----------------------------------------------
     4. Set up event listeners for checkbox controls
     ----------------------------------------------- */

  currentWindowOnlyCheckbox.addEventListener('change', function (event) {
    chrome.storage.local.set({ currentWindowOnlyChecked: event.target.checked });
  });

  /* -----------------------------------------------
     5. Set up event listeners for checkbox controls
     ----------------------------------------------- */

  httpsOnlyCheckbox.addEventListener('change', function (event) {
    chrome.storage.local.set({ httpsOnlyChecked: event.target.checked });
  });

  /* -----------------------------------------------
     6. Set up event listener for messages from background
     ----------------------------------------------- */

  chrome.runtime.onMessage.addListener(function (request) {
    if (request.message === msgType.GROUP_TABS_ANS) {
      console.debug(
        'Popup received grouped tabs:',
        JSON.stringify(request.matched_tab_groups)
      );

      // What: the data in request.matched_tab_groups
      // Where: at duplicateListDiv
      // How: with the templates in the HTML
      // Also: pass callbacks for tab and group actions
      renderTabGroups(
        request.matched_tab_groups,
        duplicateListDiv,
        document.getElementById('tab-group-template'),
        document.getElementById('tab-item-template'),
        callbacks
      );
    }
  });

  /* -----------------------------------------------
     7. Set up event listener for search button
     ----------------------------------------------- */

  findDuplicatesButton.addEventListener('click', function () {
    changeResultState(resultState.LOADING);

    // Gather current settings from the UI
    const matchLevel = sliderToMatchLevel[matchLevelSlider.value];
    const scope = currentWindowOnlyCheckbox.checked
      ? windowScope.CURRENT
      : windowScope.ALL;
    const httpsOnly = httpsOnlyCheckbox.checked;

    const payload = {
      matchLevel: matchLevel,
      scope: scope,
      httpsOnly: httpsOnly,
      matchBy: document.querySelector('input[name="match-by"]:checked').value
    };
    console.debug('Popup sending grouping request:', payload);
    chrome.runtime.sendMessage({
      message: msgType.GROUP_TABS_CMD,
      ...payload
    });
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
    console.debug('updateExampleUrl:', matchedParts);

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

  // For development purposes, render example data on load
  // renderTabGroups(exampleTabGroups);
});
