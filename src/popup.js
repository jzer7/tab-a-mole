/*global chrome*/
document.addEventListener('DOMContentLoaded', function () {
  const findDuplicatesButton = document.getElementById('findDuplicates');
  const duplicateListDiv = document.getElementById('duplicateList');
  const matchLevelSlider = document.getElementById('matchLevelSlider');
  const currentWindowOnlyCheckbox =
    document.getElementById('currentWindowOnly');
  const httpsOnlyCheckbox = document.getElementById('httpsOnly');

  // Load saved settings from chrome.storage.local
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

  const sliderToMatchLevel = Object.freeze({
    5: 'full',
    4: 'no-hash',
    3: 'no-query',
    2: 'hostname',
    1: 'domain'
  });

  findDuplicatesButton.addEventListener('click', function () {
    const matchLevel = sliderToMatchLevel[matchLevelSlider.value];
    const scope = currentWindowOnlyCheckbox.checked ? 'current' : 'all';
    const httpsOnly = httpsOnlyCheckbox.checked;
    chrome.runtime.sendMessage({
      message: 'find_duplicates',
      matchLevel: matchLevel,
      scope: scope,
      httpsOnly: httpsOnly
    });
  });

  if (window.chrome && chrome.runtime && chrome.runtime.id) {
    /* Temporary, while we debug in chrome */
    chrome.runtime.onMessage.addListener(
      function (request, _sender, _sendResponse) {
        if (request.message === 'duplicate_tabs') {
          displayDuplicateTabs(request.matched_tab_groups);
        }
      }
    );
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
    chrome.storage.local.set({
      httpsOnlyChecked: event.target.checked
    });
  });

  // Set initial state on load (now handled after loading from storage)

  function updateExampleUrl(matchLevel) {
    const partMatchers = {
      full: ['subdomains', 'domain', 'path', 'query', 'hash'],
      'no-hash': ['subdomains', 'domain', 'path', 'query'],
      'no-query': ['subdomains', 'domain', 'path'],
      hostname: ['subdomains', 'domain'],
      domain: ['domain'] // Special handling for domain (using last 2 portions)
    };

    const matchedParts = partMatchers[matchLevel] || [];
    console.log('updatematchlevel:', matchedParts);

    // Re-select all parts in case the DOM was changed
    const allUrlParts = document.querySelectorAll('.url-part');
    console.log('allUrlParts:', allUrlParts);

    allUrlParts.forEach((part) => {
      // part is the string
      // part.dataset is the DOM
      // part.dataset.part is the value of the 'data-part' property of the DOM obj
      // So, partName is one of 'subdomain', 'domain', 'path', 'query', or 'hash'
      const partName = part.dataset.part;

      // The 'hostname' element contains the 'domain' element in the old HTML structure,
      // so we handle them together.
      if (matchedParts.includes(partName)) {
        part.classList.replace('unmatched', 'matched');
      } else {
        part.classList.replace('matched', 'unmatched');
      }
    });
  }

  function displayDuplicateTabs(duplicateTabs) {
    duplicateListDiv.innerHTML = ''; // Clear previous results
    // No matches
    if (duplicateTabs.length === 0) {
      duplicateListDiv.innerHTML = `<div class="no-duplicates">No duplicate tabs found.</div>`;
      return;
    }

    const list = document.createElement('ul');
    duplicateTabs.forEach((matchedGroup) => {
      // Matched Group portion
      const listItem = document.createElement('li');
      const groupInfo = document.createElement('div');
      groupInfo.classList.add('matched-tab-group-text');
      groupInfo.innerHTML = `<strong>match:</strong> ${matchedGroup.matchKey} <br>
                             <strong>tabs:</strong> ${matchedGroup.tabInfos.length}`;
      listItem.appendChild(groupInfo);

      // Matched Tabs portion
      // Create a sub-list for individual tabs
      const individualTabsList = document.createElement('ul');
      individualTabsList.classList.add('matched-tabs');
      matchedGroup.tabInfos.forEach((oneTabInfo) => {
        // Display a single Tab
        const tabItem = document.createElement('li');

        // The title of the tab
        let tabTitle = oneTabInfo.title || '(no title)';
        if (tabTitle.length > 100) {
          tabTitle = tabTitle.substring(0, 100) + '...';
        }

        // If possible, show time since last accessed in human format
        if (!oneTabInfo.lastAccessed) {
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
          tabTitle += ` (${timeSinceAccessText})`;
        }

        // Add icons for pinned tabs
        if (oneTabInfo.pinned) {
          tabTitle += ' 📌'; // Pinned icon (U+1F4CC)
        }
        tabItem.textContent = `${tabTitle}`;

        const goToButton = document.createElement('button');
        goToButton.textContent = 'Go to Tab';
        goToButton.classList.add('go-to-tab-button');
        goToButton.addEventListener('click', () => {
          // Switch to the selected tab
          chrome.tabs.update(oneTabInfo.id, { active: true });
          // Also focus on the window the tab is in
          chrome.tabs.get(oneTabInfo.id, (tab) => {
            chrome.windows.update(tab.windowId, { focused: true });
          });
        });
        tabItem.appendChild(goToButton);
        individualTabsList.appendChild(tabItem);
      });
      listItem.appendChild(individualTabsList);

      // Close Button

      const closeButton = document.createElement('button');
      closeButton.textContent = `Close ${
        matchedGroup.tabInfos.length - 1
      } Duplicates`;
      closeButton.addEventListener('click', () => {
        const tabsToClose = matchedGroup.tabInfos.slice(1);
        const tabIdsToClose = tabsToClose.map((tab) => tab.id);
        chrome.tabs.remove(tabIdsToClose);
        listItem.remove();
        if (list.children.length === 0) {
          displayDuplicateTabs([]);
        }
      });
      listItem.appendChild(closeButton);

      list.appendChild(listItem);
    });
    duplicateListDiv.appendChild(list);
  }
});
