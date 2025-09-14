/*global chrome*/
console.log('Background script running');

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

// Listen for a message from the popup
chrome.runtime.onMessage.addListener(function (request, _sender, _sendResponse) {
  if (request.message === msgType.GROUP_TABS_CMD) {
    groupTabsBy(request.matchLevel, request.scope, request.httpsOnly);
  }
});

function getUrlMatchKey(urlString, matchLevel, includeParseErrors = true) {
  try {
    const url = new URL(urlString);
    switch (matchLevel) {
      case urlScope.NO_HASH:
        return url.origin + url.pathname + url.search;
      case urlScope.NO_QUERY:
        return url.origin + url.pathname;
      case urlScope.HOSTNAME:
        return url.hostname;
      case urlScope.DOMAIN: {
        // This is a simplistic approach for getting the domain.
        // It might not work for complex TLDs like .co.uk
        const parts = url.hostname.split('.');
        return parts.slice(-2).join('.');
      }
      case urlScope.FULL:
      default:
        return url.href;
    }
  } catch {
    if (includeParseErrors) {
      // URLs that cannot be parsed will be grouped by their full string value.
      return urlString;
    }
    // We do not want to use this type of URLs, so we will return an empty key, which can be easily discarded by the caller.
    return '';
  }
}

function groupTabsBy(
  matchLevel = urlScope.FULL,
  scope = windowScope.ALL,
  httpsOnly = false
) {
  let queryOptions = {};
  if (scope === windowScope.CURRENT) {
    queryOptions = { currentWindow: true };
  }

  // Get all tabs based on the query options
  chrome.tabs.query(queryOptions, function (tabs) {
    const tabGroupingMap = new Map();
    const matchedTabGroups = [];

    tabs.forEach((tab) => {
      if (httpsOnly && (!tab.url || !tab.url.startsWith('https://'))) {
        return; // Skip non-HTTPS tabs if httpsOnly is set
      }
      const matchKey = getUrlMatchKey(tab.url, matchLevel, true);
      if (!matchKey) {
        return; // Skip tabs with special URLs
      }
      // This is what we can read about each tab.
      //   https://developer.chrome.com/docs/extensions/reference/api/tabs#type-Tab
      // Do not store the whole tab object, as it will slow down the extension.
      // People who use this extension have upward of 120 tabs open at once. We
      // can extend it later if needed.
      const oneTabInfo = {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        windowId: tab.windowId,
        groupId: tab.groupId,
        lastAccessed: tab.lastAccessed,
        pinned: tab.pinned
      };
      if (tabGroupingMap.has(matchKey)) {
        tabGroupingMap.get(matchKey).tabInfos.push(oneTabInfo);
      } else {
        tabGroupingMap.set(matchKey, { tabInfos: [oneTabInfo] });
      }
    });

    for (const [matchKey, data] of tabGroupingMap.entries()) {
      if (data.tabInfos.length > 1) {
        matchedTabGroups.push({ matchKey: matchKey, tabInfos: data.tabInfos });
      }
    }

    // Send the tab groups back to the popup
    chrome.runtime.sendMessage({
      message: msgType.GROUP_TABS_ANS,
      matched_tab_groups: matchedTabGroups
    });
  });
}
