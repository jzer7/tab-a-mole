console.log('Background script running');

import {
  groupTabsByTitle,
  groupTabsByUrl,
  type TitleGroupingConfig,
  type UrlGroupingConfig
} from './tab-grouping';
import { msgType, windowScope, type WindowScope } from '../popup/popup-values';

/* ---------------------------------------------------------
 * General Tab Grouping and Messaging
 * ------------------------------------------------------ */

interface GroupingRequest extends TitleGroupingConfig, UrlGroupingConfig {
  matchBy?: 'title' | 'url';
  scope?: WindowScope;
}

interface TabGroupSummary {
  id: number;
  title: string;
  color: string;
  collapsed: boolean;
}

function fetchTabGroupSummary(groupId: number): Promise<TabGroupSummary | undefined> {
  return new Promise((resolve) => {
    chrome.tabGroups.get(groupId, (tabGroup) => {
      if (chrome.runtime.lastError || !tabGroup) {
        resolve(undefined);
        return;
      }

      resolve({
        id: tabGroup.id,
        title: tabGroup.title || '',
        color: tabGroup.color,
        collapsed: tabGroup.collapsed
      });
    });
  });
}

/**
 * Groups tabs and sends them to the popup via a Chrome runtime message.
 *
 * The grouping criteria for tabs
 *    - can use different parts of their URL,
 *    - pick tabs from all windows, or just the current window, and
 *    - can be restricted to tabs with HTTPS URLs
 */
function groupTabsDispatch(config: GroupingRequest = {}) {
  const matchBy = config.matchBy || 'url';
  const scope = config.scope || windowScope.ALL;

  // Determine tab query filter based on scope
  const query: chrome.tabs.QueryInfo = {};
  if (scope === windowScope.CURRENT) {
    query.currentWindow = true;
  }

  chrome.tabs.query(query, function (selectedTabs) {
    const dispatchResults = async () => {
      const matchedTabGroups: import('./tab-grouping').TabGroup[] =
        matchBy === 'title'
          ? // Group by title similarity
            groupTabsByTitle(selectedTabs, config)
          : // Group by URL
            groupTabsByUrl(selectedTabs, config);

      // Build a tab-group lookup so popup rendering can show richer context.
      const groupIds = new Set<number>();
      matchedTabGroups.forEach((group) => {
        group.tabs.forEach((tab) => {
          if (typeof tab.groupId === 'number' && tab.groupId >= 0) {
            groupIds.add(tab.groupId);
          }
        });
      });

      const tabGroupSummaries = await Promise.all(
        [...groupIds].map((groupId) => fetchTabGroupSummary(groupId))
      );
      const tabGroupSummaryById = new Map<number, TabGroupSummary>();
      tabGroupSummaries.forEach((summary) => {
        if (summary) {
          tabGroupSummaryById.set(summary.id, summary);
        }
      });

      // matchedTabGroups is an array of tab groups.
      // A tab group is an object {groupingCriteria, Array of tabs}

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
          tabGroup:
            typeof tab.groupId === 'number' && tab.groupId >= 0
              ? tabGroupSummaryById.get(tab.groupId)
              : undefined,
          lastAccessed: tab.lastAccessed,
          pinned: tab.pinned
        }))
      }));

      console.debug('Background sending grouped tabs:', cleanupMatchedTabGroups);
      chrome.runtime.sendMessage({
        message: msgType.GROUP_TABS_ANS,
        matched_tab_groups: cleanupMatchedTabGroups
      });
    };

    void dispatchResults();
  });
}

// Listen for a message from the popup
chrome.runtime.onMessage.addListener(function (request) {
  if (request.message === msgType.GROUP_TABS_CMD) {
    console.debug('Background received grouping request:', JSON.stringify(request));
    groupTabsDispatch({
      matchBy: request.matchBy,
      titleThreshold: request.titleThreshold,
      matchLevel: request.matchLevel,
      scope: request.scope,
      httpsOnly: request.httpsOnly
    });
  }
});
