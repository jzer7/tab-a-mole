console.log('Background script running');

/* ---------------------------------------------------------
 * Constants and Enums
 * ------------------------------------------------------ */
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

/* ---------------------------------------------------------
 * Group Tabs by Title
 * ------------------------------------------------------ */
/**
 * Groups tabs by Jaccard similarity of their titles.
 *
 * @param {Array} tabs - Array of tab objects (must have at least 'title', 'id', 'url', etc.)
 * @param {number} [threshold=0.5] - Jaccard similarity threshold for grouping (0-1)
 * @returns {Array} Array of groups, each group is an array of tab infos
 *
 * returns an array of tab groups. A tab group is an object {groupingCriteria, Array of tabs}
 */
function groupTabsByTitle(tabs, config) {
  const threshold = config.titleThreshold || 0.5;

  // Helper: tokenize and normalize a title
  function tokenize(title) {
    return new Set(
      title
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
    );
  }

  // Helper: Jaccard similarity between two sets
  function jaccard(setA, setB) {
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  const n = tabs.length;
  const visited = new Array(n).fill(false);
  const tokenizedTitles = tabs.map((tab) => tokenize(tab.title || ''));
  const groups = [];

  for (let i = 0; i < n; ++i) {
    if (visited[i]) continue;
    const group = [tabs[i]];
    visited[i] = true;
    for (let j = i + 1; j < n; ++j) {
      if (visited[j]) continue;
      const sim = jaccard(tokenizedTitles[i], tokenizedTitles[j]);
      if (sim >= threshold) {
        group.push(tabs[j]);
        visited[j] = true;
      }
    }
    if (group.length > 1) {
      groups.push({ groupingCriteria: '?', tabs: group });
    }
  }
  return groups;
}

/* ---------------------------------------------------------
 * Group Tabs by URL
 * ------------------------------------------------------ */

/**
 * Groups tabs by their URL according to the specified match level and HTTPS filter.
 *
 * returns an array of tab groups. A tab group is an object {groupingCriteria, Array of tabs}
 */
function groupTabsByUrl(tabs, config) {
  const matchLevel = config.matchLevel || urlScope.FULL;
  const httpsOnly = config.httpsOnly || false;
  const includeParseErrors = config.includeParseErrors || true;
  const tabGroupMap = new Map();
  const matchedTabGroups = [];

  function getUrlMatchKey(urlString, matchLevel, includeParseErrors) {
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
      console.warn(`Could not parse URL: ${urlString}`);
      if (includeParseErrors) {
        // URLs that cannot be parsed will be grouped by their full string value.
        return urlString;
      }
      // We do not want to use this type of URLs, so we will return an empty key, which can be easily discarded by the caller.
      return '';
    }
  }

  // Process 1 tab at a time
  tabs.forEach((tab) => {
    if (httpsOnly && (!tab.url || !tab.url.startsWith('https://'))) {
      return;
    }
    const matchKey = getUrlMatchKey(tab.url, matchLevel, includeParseErrors);
    if (!matchKey) {
      console.warn(`Skipping tab with unparseable URL: ${tab.url}`);
      return;
    }

    if (tabGroupMap.has(matchKey)) {
      tabGroupMap.get(matchKey).tabs.push(tab);
    } else {
      tabGroupMap.set(matchKey, { tabs: [tab] });
    }
  });

  // Collect groups with more than one tab
  for (const [matchKey, data] of tabGroupMap.entries()) {
    if (data.tabs.length > 1) {
      matchedTabGroups.push({ groupingCriteria: matchKey, tabs: data.tabs });
    }
  }

  return matchedTabGroups;
}

/* ---------------------------------------------------------
 * General Tab Grouping and Messaging
 * ------------------------------------------------------ */

/**
 * Groups tabs and sends them to the popup via a Chrome runtime message.
 *
 * The grouping criteria for tabs
 *    - can use different parts of their URL,
 *    - pick tabs from all windows, or just the current window, and
 *    - can be restricted to tabs with HTTPS URLs
 */
function groupTabsDispatch(config = {}) {
  const matchBy = config.matchBy || 'url';
  const scope = config.scope || windowScope.ALL;

  // Determine tab query filter based on scope
  const query = {};
  if (scope === windowScope.CURRENT) {
    query.currentWindow = true;
  }

  chrome.tabs.query(query, function (selectedTabs) {
    let matchedTabGroups = [];

    if (matchBy === 'title') {
      // Group by title similarity
      matchedTabGroups = groupTabsByTitle(selectedTabs, config);
    } else {
      // Group by URL
      matchedTabGroups = groupTabsByUrl(selectedTabs, config);
    }

    // matchedTabGroups is an array of tab groups.
    // A tab group is an object {groupingCriteria, Array of tabs}

    // const oneTabInfo = {
    //             id: tab.id,
    //             url: tab.url,
    //             title: tab.title,
    //             windowId: tab.windowId,
    //             groupId: tab.groupId,
    //             lastAccessed: tab.lastAccessed,
    //             pinned: tab.pinned
    //         };

    // Transform groups to only include necessary tab info
    // Replaces the Array of tabs with an Array of tabInfos.
    // A tabInfo is an object with selected properties of a tab.
    const cleanupMatchedTabGroups = matchedTabGroups.map((group) => ({
      criteria: group.groupingCriteria, // matchBy === 'title' ? group.tabs[0].title : group.tabs[0].url,
      tabInfos: group.tabs.map((tab) => ({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        windowId: tab.windowId,
        groupId: tab.groupId,
        lastAccessed: tab.lastAccessed,
        pinned: tab.pinned
      }))
    }));

    chrome.runtime.sendMessage({
      message: msgType.GROUP_TABS_ANS,
      matched_tab_groups: cleanupMatchedTabGroups
    });
  });
}

// Listen for a message from the popup
chrome.runtime.onMessage.addListener(function (request) {
  if (request.message === msgType.GROUP_TABS_CMD) {
    groupTabsDispatch({
      matchBy: request.matchBy,
      titleThreshold: request.titleThreshold,
      matchLevel: request.matchLevel,
      scope: request.scope,
      httpsOnly: request.httpsOnly
    });
  }
});
