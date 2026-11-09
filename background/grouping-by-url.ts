import type { TabGroup } from './tab-grouping';

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

export interface UrlGroupingConfig {
  matchLevel?: UrlScope;
  httpsOnly?: boolean;
  includeParseErrors?: boolean;
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

export { groupTabsByUrl };
