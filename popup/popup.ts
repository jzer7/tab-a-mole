/* popup.ts */

import {
  changeResultState,
  renderTabGroups,
  type Callbacks,
  type TabInfo
} from './popup-utils';
import {
  msgType,
  resultState,
  sliderToMatchLevel,
  windowScope,
  type UrlScope
} from './popup-values';

document.addEventListener('DOMContentLoaded', function () {
  console.info('Popup script loaded');

  const matchLevelSlider = document.getElementById(
    'matchLevelSlider'
  ) as HTMLInputElement;
  const sampleUrlParts = document.querySelectorAll('#sampleUrl span');
  const currentWindowOnlyCheckbox = document.getElementById(
    'currentWindowOnly'
  ) as HTMLInputElement;
  const httpsOnlyCheckbox = document.getElementById(
    'httpsOnly'
  ) as HTMLInputElement;
  const findDuplicatesButton = document.getElementById(
    'findDuplicates'
  ) as HTMLButtonElement;
  const duplicateListDiv = document.getElementById(
    'duplicateList'
  ) as HTMLElement;

  // Callbacks to be passed to rendering functions
  // These functions will be called when the user interacts with
  // the rendered tab groups and tab items
  const callbacks: Callbacks = {
    onGoToTab: (tabInfo: TabInfo) => {
      console.debug('onGoToTab:', tabInfo);
      chrome.tabs.update(tabInfo.id, { active: true });
      chrome.tabs.get(tabInfo.id, (tab) => {
        chrome.windows.update(tab.windowId, { focused: true });
      });
    },
    onCloseTab: (tabInfo: TabInfo, tabNode: HTMLElement) => {
      console.debug('onCloseTab:', tabInfo);
      chrome.tabs.remove(tabInfo.id);
      // Remove the tab item from the list
      (tabNode.firstElementChild as HTMLElement).parentElement?.remove();
    },
    onGoToFirstTab: (firstTabInfo: TabInfo) => {
      console.debug('onGoToFirstTab:', firstTabInfo);
      chrome.tabs.update(firstTabInfo.id, { active: true });
      chrome.tabs.get(firstTabInfo.id, (tab) => {
        chrome.windows.update(tab.windowId, { focused: true });
      });
    },
    onCloseAllTabs: (tabInfos: TabInfo[], groupNode: HTMLElement) => {
      // If the current tab is in the group, keep it open.
      // Otherwise, keep the first tab in the group open.
      // Close the rest of the tabs in the group.
      // Remove the group from the UI.
      console.debug('onCloseAllTabs:', tabInfos);

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // `tabs` is an array with ONLY one element (only one active tab in the current window)
        const currentTabId = tabs[0].id;
        console.debug('Current active tab:', currentTabId);

        // Is the current tab in the group?
        const currentTabInGroup = tabInfos.some(
          (tabInfo) => tabInfo.id === currentTabId
        );
        console.debug('Is current tab in group?', currentTabInGroup);

        // If so, we will keep it open and close the rest.
        // If not, we will keep the first tab in the group open and close the rest.
        const tabsToClose = tabInfos
          .filter((tabInfo) =>
            currentTabInGroup
              ? tabInfo.id !== currentTabId
              : tabInfo.id !== tabInfos[0].id
          )
          .map((tabInfo) => tabInfo.id);
        console.debug('IDs of tabs to close:', tabsToClose);

        tabsToClose.forEach((tabid) => chrome.tabs.remove(tabid));

        // Now, this group will have only 1 tab. So we are going to remove it from the UI. But first, we need to check if once we remove it, there are no other groups. In that case, we need to change the result message.
        const isLastGroup = groupNode.parentElement?.childElementCount === 2;
        console.debug('Is this the last group?', isLastGroup);

        // Now we remove it from the UI.
        groupNode.remove();

        // If it was the last group, change the result state to NO_DUPLICATES
        if (isLastGroup) changeResultState(resultState.NO_DUPLICATES);
      });
    }
  };

  /* -----------------------------------------------
     1. Load settings and initialize UI
     ----------------------------------------------- */

  changeResultState(resultState.START);

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
      updateExampleUrl(sliderToMatchLevel[parseInt(matchLevelSlider.value)]);
    }
  );

  /* -----------------------------------------------
     2. Set up event listeners for settings controls
     ----------------------------------------------- */

  const matchByRadios = document.getElementsByName('match-by');
  matchByRadios.forEach((radio) => {
    radio.addEventListener('change', function (event) {
      const target = event.target as HTMLInputElement;
      const value = target.value;
      const httpsOnlyCheckbox = document.getElementById(
        'httpsOnly'
      ) as HTMLInputElement;
      const exampleUrlDiv = document.getElementById(
        'exampleUrl'
      ) as HTMLElement;
      if (value === 'url') {
        // searchByUrlDiv.hidden = false;
        matchLevelSlider.disabled = false;
        httpsOnlyCheckbox.disabled = false;
        // Actually, let's check if it is a fieldset or button. If it's a div, it doesn't have disabled attribute standardly but browsers might support it or it's custom.
        // Actually, let's check if it is a fieldset or button. If it's a div, it doesn't have disabled attribute standardly but browsers might support it or it's custom.
        // Assuming it's a container that supports disabled or we just set the attribute.
        exampleUrlDiv.setAttribute('disabled', 'false'); // or remove attribute
        exampleUrlDiv.removeAttribute('disabled');
      } else {
        // searchByUrlDiv.hidden = true;
        matchLevelSlider.disabled = true;
        httpsOnlyCheckbox.disabled = true;
        exampleUrlDiv.setAttribute('disabled', 'true');
      }
    });
  });

  /* -----------------------------------------------
     3. Set up event listeners for settings controls
     ----------------------------------------------- */

  matchLevelSlider.addEventListener('input', function (event) {
    const target = event.target as HTMLInputElement;
    const matchLevel = sliderToMatchLevel[parseInt(target.value)];
    updateExampleUrl(matchLevel);
    chrome.storage.local.set({ matchLevelSliderValue: target.value });
  });

  /* -----------------------------------------------
     4. Set up event listeners for checkbox controls
     ----------------------------------------------- */

  currentWindowOnlyCheckbox.addEventListener('change', function (event) {
    const target = event.target as HTMLInputElement;
    chrome.storage.local.set({ currentWindowOnlyChecked: target.checked });
  });

  /* -----------------------------------------------
     5. Set up event listeners for checkbox controls
     ----------------------------------------------- */

  httpsOnlyCheckbox.addEventListener('change', function (event) {
    const target = event.target as HTMLInputElement;
    chrome.storage.local.set({ httpsOnlyChecked: target.checked });
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
        document.getElementById('tab-group-template') as HTMLTemplateElement,
        document.getElementById('tab-item-template') as HTMLTemplateElement,
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
    const matchLevel = sliderToMatchLevel[parseInt(matchLevelSlider.value)];
    const scope = currentWindowOnlyCheckbox.checked
      ? windowScope.CURRENT
      : windowScope.ALL;
    const httpsOnly = httpsOnlyCheckbox.checked;

    const payload = {
      matchLevel: matchLevel,
      scope: scope,
      httpsOnly: httpsOnly,
      matchBy: (
        document.querySelector(
          'input[name="match-by"]:checked'
        ) as HTMLInputElement
      ).value
    };
    console.debug('Popup sending grouping request:', payload);
    chrome.runtime.sendMessage({
      message: msgType.GROUP_TABS_CMD,
      ...payload
    });
  });

  // Highlight the parts of the example URL matching the level from the slider
  function updateExampleUrl(matchLevel: UrlScope) {
    const partMatchers: Record<string, string[]> = {
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
      const partElement = part as HTMLElement;
      const partName = partElement.dataset.part;

      // The 'hostname' element contains the 'domain' element in the old HTML structure,
      // so we handle them together.
      if (partName && matchedParts.includes(partName)) {
        partElement.classList.replace('disabled', 'enabled');
      } else {
        partElement.classList.replace('enabled', 'disabled');
      }
    });
  }

  // For development purposes, render example data on load
  // renderTabGroups(exampleTabGroups);
});
