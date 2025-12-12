// Pure tab grouping logic for testing and reuse

/* ---------------------------------------------------------
 * Constants and Enums
 * ------------------------------------------------------ */

export const urlScope = {
  FULL: 'full',
  NO_HASH: 'no-hash',
  NO_QUERY: 'no-query',
  HOSTNAME: 'hostname',
  DOMAIN: 'domain'
} as const;

export type UrlScope = (typeof urlScope)[keyof typeof urlScope];

/* ---------------------------------------------------------
 * Interfaces
 * ------------------------------------------------------ */

export interface TabGroup {
  groupingCriteria: string;
  tabs: chrome.tabs.Tab[];
}

export interface TitleGroupingConfig {
  titleThreshold?: number;
}

export interface UrlGroupingConfig {
  matchLevel?: UrlScope;
  httpsOnly?: boolean;
  includeParseErrors?: boolean;
}

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
function groupTabsByTitle(
  tabs: chrome.tabs.Tab[],
  config: TitleGroupingConfig
): TabGroup[] {
  const threshold = config.titleThreshold || 0.5;

  // Helper: tokenize and normalize a title
  function tokenize(title: string): Set<string> {
    return new Set(
      title
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
    );
  }

  // Helper: Jaccard similarity between two sets
  function jaccard(setA: Set<string>, setB: Set<string>): number {
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  const n = tabs.length;
  const visited = new Array(n).fill(false);
  const tokenizedTitles = tabs.map((tab) => tokenize(tab.title || ''));
  const groups: TabGroup[] = [];

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
function groupTabsByUrl(tabs: chrome.tabs.Tab[], config: UrlGroupingConfig): TabGroup[] {
  const matchLevel = config.matchLevel || urlScope.FULL;
  const httpsOnly = config.httpsOnly || false;
  const includeParseErrors = config.includeParseErrors ?? true;
  const tabGroupMap = new Map<string, { tabs: chrome.tabs.Tab[] }>();
  const matchedTabGroups: TabGroup[] = [];

  function getUrlMatchKey(
    urlString: string,
    matchLevel: UrlScope,
    includeParseErrors: boolean
  ): string {
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

  // Process 1 tab at a time
  tabs.forEach((tab) => {
    if (httpsOnly && (!tab.url || !tab.url.startsWith('https://'))) {
      return;
    }
    // tab.url is optional in chrome.tabs.Tab but we need it.
    // If it's undefined, we can skip or treat as empty string.
    const urlStr = tab.url || '';
    if (!urlStr) return;

    const matchKey = getUrlMatchKey(urlStr, matchLevel, includeParseErrors);
    if (!matchKey) {
      return;
    }

    if (tabGroupMap.has(matchKey)) {
      tabGroupMap.get(matchKey)?.tabs.push(tab);
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

export { groupTabsByTitle, groupTabsByUrl };
