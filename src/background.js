/*global chrome*/
console.log('Background script running');

// Example: Listen for a message from the popup
chrome.runtime.onMessage.addListener(
  function (request, _sender, _sendResponse) {
    if (request.message === 'find_duplicates') {
      findDuplicateTabs(request.matchLevel, request.scope);
    }
  }
);

function getUrlMatchKey(urlString, matchLevel) {
  try {
    const url = new URL(urlString);
    switch (matchLevel) {
      case 'no-hash':
        return url.origin + url.pathname + url.search;
      case 'no-query':
        return url.origin + url.pathname;
      case 'hostname':
        return url.hostname;
      case 'domain': {
        // This is a simplistic approach for getting the domain.
        // It might not work for complex TLDs like .co.uk
        const parts = url.hostname.split('.');
        return parts.slice(-2).join('.');
      }
      case 'full':
      default:
        return url.href;
    }
  } catch {
    // For non-http URLs like chrome://extensions
    return urlString;
  }
}

function findDuplicateTabs(matchLevel = 'full', scope = 'all') {
  let queryOptions = {};
  if (scope === 'current') {
    queryOptions = { currentWindow: true };
  }

  chrome.tabs.query(queryOptions, function (tabs) {
    const urlMap = new Map();
    const duplicateTabs = [];

    tabs.forEach((tab) => {
      const matchKey = getUrlMatchKey(tab.url, matchLevel);
      // This is what we remember of each tab. Do not store the whole tab
      // object, as it will slow down the extension. People who use this
      // extension have upward of 120 tabs open at once. We can extend it later
      // if needed.
      const oneTabInfo = {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        lastAccessed: tab.lastAccessed,
        // windowId: tab.windowId,
        pinned: tab.pinned
      };
      if (urlMap.has(matchKey)) {
        urlMap.get(matchKey).tabInfos.push(oneTabInfo);
      } else {
        urlMap.set(matchKey, { tabInfos: [oneTabInfo] });
      }
    });

    for (const [matchKey, data] of urlMap.entries()) {
      if (data.tabInfos.length > 1) {
        duplicateTabs.push({ matchKey: matchKey, tabInfos: data.tabInfos });
      }
    }

    // Send the duplicate tabs to the popup
    chrome.runtime.sendMessage({
      message: 'duplicate_tabs',
      tabs: duplicateTabs
    });
  });
}
