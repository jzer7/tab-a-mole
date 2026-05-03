/* tab-search-controller.ts — shared controller for popup and sidebar surfaces */

import {
  changeResultState,
  renderTabGroups,
  type Callbacks,
  type TabInfo
} from '../popup/popup-utils';
import {
  msgType,
  resultState,
  sliderToMatchLevel,
  windowScope,
  type UrlScope
} from '../popup/popup-values';

const storageKeys = {
  matchLevelSliderValue: 'matchLevelSliderValue',
  currentWindowOnlyChecked: 'currentWindowOnlyChecked',
  httpsOnlyChecked: 'httpsOnlyChecked',
  matchBy: 'matchBy'
} as const;

export interface TabSearchController {
  showSearchError: (_message: string) => void;
  triggerSearch: () => void;
}

export function initTabSearch(): TabSearchController {
  let loadingTimeoutId: ReturnType<typeof setTimeout> | undefined;

  const matchLevelSlider = document.getElementById(
    'matchLevelSlider'
  ) as HTMLInputElement;
  const sampleUrlParts = document.querySelectorAll('#sampleUrl span');
  const currentWindowOnlyCheckbox = document.getElementById(
    'currentWindowOnly'
  ) as HTMLInputElement;
  const httpsOnlyCheckbox = document.getElementById('httpsOnly') as HTMLInputElement;
  const findDuplicatesButton = document.getElementById(
    'findDuplicates'
  ) as HTMLButtonElement;
  const duplicateListDiv = document.getElementById('duplicateList') as HTMLElement;
  const errorMessageDiv = document.getElementById('errorMessage') as HTMLElement;

  function clearLoadingTimeout() {
    if (loadingTimeoutId) {
      clearTimeout(loadingTimeoutId);
      loadingTimeoutId = undefined;
    }
  }

  function setSearchLoading(isLoading: boolean) {
    findDuplicatesButton.disabled = isLoading;
    findDuplicatesButton.setAttribute('aria-busy', String(isLoading));
  }

  function showSearchError(message: string) {
    errorMessageDiv.textContent = message;
    changeResultState(resultState.ERROR);
  }

  function updateMatchByUi(matchBy: string) {
    const useUrlMode = matchBy === 'url';
    const exampleUrlDiv = document.getElementById('exampleUrl') as HTMLElement;
    matchLevelSlider.disabled = !useUrlMode;
    httpsOnlyCheckbox.disabled = !useUrlMode;

    if (useUrlMode) {
      exampleUrlDiv.removeAttribute('aria-disabled');
    } else {
      exampleUrlDiv.setAttribute('aria-disabled', 'true');
    }
  }

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

    sampleUrlParts.forEach((part) => {
      const partElement = part as HTMLElement;
      const partName = partElement.dataset.part;
      if (partName && matchedParts.includes(partName)) {
        partElement.classList.replace('disabled', 'enabled');
      } else {
        partElement.classList.replace('enabled', 'disabled');
      }
    });
  }

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
      console.debug('onCloseAllTabs:', tabInfos);

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTabId = tabs[0].id;
        console.debug('Current active tab:', currentTabId);
        const currentTabInGroup = tabInfos.some((tabInfo) => tabInfo.id === currentTabId);
        console.debug('Is current tab in group?', currentTabInGroup);
        const tabsToClose = tabInfos
          .filter((tabInfo) =>
            currentTabInGroup
              ? tabInfo.id !== currentTabId
              : tabInfo.id !== tabInfos[0].id
          )
          .map((tabInfo) => tabInfo.id);
        console.debug('IDs of tabs to close:', tabsToClose);

        tabsToClose.forEach((tabid) => chrome.tabs.remove(tabid));
        const isLastGroup = groupNode.parentElement?.childElementCount === 2;
        console.debug('Is this the last group?', isLastGroup);
        groupNode.remove();
        if (isLastGroup) changeResultState(resultState.NO_DUPLICATES);
      });
    }
  };

  /* -----------------------------------------------
     1. Load settings and initialize UI
     ----------------------------------------------- */

  changeResultState(resultState.START);

  chrome.storage.local.get(
    [
      storageKeys.matchLevelSliderValue,
      storageKeys.currentWindowOnlyChecked,
      storageKeys.httpsOnlyChecked,
      storageKeys.matchBy
    ],
    (result) => {
      const storedMatchLevel = result[storageKeys.matchLevelSliderValue];
      if (typeof storedMatchLevel === 'string') {
        matchLevelSlider.value = storedMatchLevel;
      }
      const storedCurrentWindowOnly = result[storageKeys.currentWindowOnlyChecked];
      if (typeof storedCurrentWindowOnly === 'boolean') {
        currentWindowOnlyCheckbox.checked = storedCurrentWindowOnly;
      }
      const storedHttpsOnly = result[storageKeys.httpsOnlyChecked];
      if (typeof storedHttpsOnly === 'boolean') {
        httpsOnlyCheckbox.checked = storedHttpsOnly;
      }

      const savedMatchBy = result[storageKeys.matchBy];
      if (savedMatchBy === 'url' || savedMatchBy === 'title') {
        const savedRadio = document.querySelector(
          `input[name="match-by"][value="${savedMatchBy}"]`
        ) as HTMLInputElement | null;
        if (savedRadio) {
          savedRadio.checked = true;
        }
        updateMatchByUi(savedMatchBy);
      } else {
        updateMatchByUi('url');
      }

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
      updateMatchByUi(value);
      chrome.storage.local.set({ [storageKeys.matchBy]: value });
    });
  });

  matchLevelSlider.addEventListener('input', function (event) {
    const target = event.target as HTMLInputElement;
    const matchLevel = sliderToMatchLevel[parseInt(target.value)];
    updateExampleUrl(matchLevel);
    chrome.storage.local.set({ [storageKeys.matchLevelSliderValue]: target.value });
  });

  /* -----------------------------------------------
     3. Set up event listeners for checkbox controls
     ----------------------------------------------- */

  currentWindowOnlyCheckbox.addEventListener('change', function (event) {
    const target = event.target as HTMLInputElement;
    chrome.storage.local.set({ [storageKeys.currentWindowOnlyChecked]: target.checked });
  });

  httpsOnlyCheckbox.addEventListener('change', function (event) {
    const target = event.target as HTMLInputElement;
    chrome.storage.local.set({ [storageKeys.httpsOnlyChecked]: target.checked });
  });

  /* -----------------------------------------------
     4. Set up event listener for messages from background
     ----------------------------------------------- */

  chrome.runtime.onMessage.addListener(function (request) {
    if (request.message === msgType.GROUP_TABS_ANS) {
      clearLoadingTimeout();
      setSearchLoading(false);

      console.debug('Received grouped tabs:', JSON.stringify(request.matched_tab_groups));

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
     5. Set up event listener for search button
     ----------------------------------------------- */

  function triggerSearch() {
    if (findDuplicatesButton.disabled) {
      return;
    }

    errorMessageDiv.textContent = '';
    setSearchLoading(true);
    changeResultState(resultState.LOADING);

    clearLoadingTimeout();

    loadingTimeoutId = setTimeout(() => {
      clearLoadingTimeout();
      setSearchLoading(false);
      showSearchError('Search timed out. Please try again.');
    }, 8000);

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
        document.querySelector('input[name="match-by"]:checked') as HTMLInputElement
      ).value
    };
    console.debug('Sending grouping request:', payload);
    chrome.runtime.sendMessage(
      {
        message: msgType.GROUP_TABS_CMD,
        ...payload
      },
      () => {
        if (!chrome.runtime.lastError) {
          return;
        }

        clearLoadingTimeout();
        setSearchLoading(false);
        showSearchError('Could not run search. Please reopen and try again.');
      }
    );
  }

  findDuplicatesButton.addEventListener('click', triggerSearch);

  return { showSearchError, triggerSearch };
}
