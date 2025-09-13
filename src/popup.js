/*global chrome*/
document.addEventListener('DOMContentLoaded', function () {
  const findDuplicatesButton = document.getElementById('findDuplicates');
  const duplicateListDiv = document.getElementById('duplicateList');
  const matchLevelSlider = document.getElementById('matchLevelSlider');
  const currentWindowOnlyCheckbox =
    document.getElementById('currentWindowOnly');

  const sliderToMatchLevel = {
    5: 'full',
    4: 'no-hash',
    3: 'no-query',
    2: 'hostname',
    1: 'domain'
  };

  findDuplicatesButton.addEventListener('click', function () {
    const matchLevel = sliderToMatchLevel[matchLevelSlider.value];
    const scope = currentWindowOnlyCheckbox.checked ? 'current' : 'all';
    chrome.runtime.sendMessage({
      message: 'find_duplicates',
      matchLevel: matchLevel,
      scope: scope
    });
  });

  if (window.chrome && chrome.runtime && chrome.runtime.id) {
    /* Temporary, while we debug in chrome */
    chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {
        if (request.message === 'duplicate_tabs') {
          displayDuplicateTabs(request.tabs);
        }
      }
    );
  }

  matchLevelSlider.addEventListener('input', function (event) {
    const matchLevel = sliderToMatchLevel[event.target.value];
    updateExampleUrl(matchLevel);
  });

  // Set initial state on load
  updateExampleUrl(sliderToMatchLevel[matchLevelSlider.value]);

  function updateExampleUrl(matchLevel) {
    const partMatchers = {
      full: ['subdomains', 'domain', 'path', 'query', 'hash'],
      'no-hash': ['subdomains', 'domain', 'path', 'query'],
      'no-query': ['subdomains', 'domain', 'path'],
      hostname: ['subdomains', 'domain'],
      domain: ['domain'] // Special handling for domain (using last 2 portions)
    };

    const matchedParts = partMatchers[matchLevel] || [];

    // Re-select all parts in case the DOM was changed
    const allUrlParts = document.querySelectorAll('.url-part');

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
    if (duplicateTabs.length === 0) {
      duplicateListDiv.innerHTML = `<div class="no-duplicates">No duplicate tabs found.</div>`;
      return;
    }

    const list = document.createElement('ul');
    duplicateTabs.forEach((duplicate) => {
      const listItem = document.createElement('li');
      const urlInfo = document.createElement('div');
      urlInfo.classList.add('url-text');
      urlInfo.innerHTML = `<strong>match:</strong> ${duplicate.matchKey} <br><strong>tabs:</strong> ${duplicate.tabInfos.length}`;
      listItem.appendChild(urlInfo);

      // Create a sub-list for individual tabs
      const individualTabsList = document.createElement('ul');
      individualTabsList.classList.add('individual-tabs');
      duplicate.tabInfos.forEach((oneTabInfo) => {
        // Display a single Tab
        const tabItem = document.createElement('li');
        tabItem.textContent = `Title: ${oneTabInfo.title}`;

        const goToButton = document.createElement('button');
        goToButton.textContent = 'Go to Tab';
        goToButton.classList.add('go-to-button');
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
        duplicate.tabInfos.length - 1
      } Duplicates`;
      closeButton.addEventListener('click', () => {
        const tabsToClose = duplicate.tabInfos.slice(1);
        chrome.tabs.remove(tabsToClose);
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
