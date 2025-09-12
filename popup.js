document.addEventListener("DOMContentLoaded", function () {
  const findDuplicatesButton = document.getElementById("findDuplicates");
  const duplicateListDiv = document.getElementById("duplicateList");
  const matchLevelSelect = document.getElementById("matchLevel");
  const urlParts = document.querySelectorAll(".url-part");

  findDuplicatesButton.addEventListener("click", function () {
    const matchLevel = matchLevelSelect.value;
    chrome.runtime.sendMessage({
      message: "find_duplicates",
      matchLevel: matchLevel,
    });
  });

  if (window.chrome && chrome.runtime && chrome.runtime.id) {
    /* Temporary, while we debug in chrome */
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.message === "duplicate_tabs") {
      displayDuplicateTabs(request.tabs);
    }
  });
  }

  matchLevelSelect.addEventListener("change", function (event) {
    updateExampleUrl(event.target.value);
  });

  // Set initial state on load
  updateExampleUrl(matchLevelSelect.value);

  function updateExampleUrl(matchLevel) {
    const partMatchers = {
      "full":     ["subdomains", "domain", "path", "query", "hash"],
      "no-hash":  ["subdomains", "domain", "path", "query"],
      "no-query": ["subdomains", "domain", "path"],
      "hostname": ["subdomains", "domain"],
      "domain":   ["domain"], // Special handling for domain (using last 2 portions)
    };

    const matchedParts = partMatchers[matchLevel] || [];
    console.log("updatematchlevel:",matchedParts);

    // Re-select all parts in case the DOM was changed
    const allUrlParts = document.querySelectorAll(".url-part");
    console.log("allUrlParts:",allUrlParts);

    allUrlParts.forEach((part) => {
      // part is the string
      // part.dataset is the DOM
      // part.dataset.part is the value of the 'data-part' property of the DOM obj
      // So, partName is one of 'subdomain', 'domain', 'path', 'query', or 'hash'
      const partName = part.dataset.part;

      // The 'hostname' element contains the 'domain' element in the old HTML structure,
      // so we handle them together.
      if (matchedParts.includes(partName)) {
        part.classList.replace("unmatched", "matched");
      } else {
        part.classList.replace("matched", "unmatched");
      }
    });

  }

  function displayDuplicateTabs(duplicateTabs) {
    duplicateListDiv.innerHTML = ""; // Clear previous results
    if (duplicateTabs.length === 0) {
      duplicateListDiv.innerHTML = `<div class="no-duplicates">No duplicate tabs found.</div>`;
      return;
    }

    const list = document.createElement("ul");
    duplicateTabs.forEach((duplicate) => {
      const listItem = document.createElement("li");
      const urlInfo = document.createElement("div");
      urlInfo.classList.add("url-text");
      urlInfo.innerHTML = `<strong>URL:</strong> ${duplicate.url} <br><strong>Open tabs:</strong> ${duplicate.tabIds.length}`;
      listItem.appendChild(urlInfo);

      // Create a sub-list for individual tabs
      const individualTabsList = document.createElement("ul");
      individualTabsList.classList.add("individual-tabs");
      duplicate.tabIds.forEach((tabId) => {
        const tabItem = document.createElement("li");
        tabItem.textContent = `Tab ID: ${tabId}`;

        const goToButton = document.createElement("button");
        goToButton.textContent = "Go to Tab";
        goToButton.classList.add("go-to-button");
        goToButton.addEventListener("click", () => {
          // Switch to the selected tab
          chrome.tabs.update(tabId, { active: true });
          // Also focus on the window the tab is in
          chrome.tabs.get(tabId, (tab) => {
            chrome.windows.update(tab.windowId, { focused: true });
          });
        });
        tabItem.appendChild(goToButton);
        individualTabsList.appendChild(tabItem);
      });
      listItem.appendChild(individualTabsList);

      // Close Button

      const closeButton = document.createElement("button");
      closeButton.textContent = `Close ${
        duplicate.tabIds.length - 1
      } Duplicates`;
      closeButton.addEventListener("click", () => {
        const tabsToClose = duplicate.tabIds.slice(1);
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
