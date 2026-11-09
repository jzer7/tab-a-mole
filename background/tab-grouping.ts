// Pure tab grouping logic for testing and reuse

/* ---------------------------------------------------------
 * Interfaces
 * ------------------------------------------------------ */

export interface TabGroup {
  groupingCriteria: string;
  tabs: chrome.tabs.Tab[];
}
