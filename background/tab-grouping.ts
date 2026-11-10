// Pure tab grouping logic for testing and reuse

/* ---------------------------------------------------------
 * Interfaces
 * ------------------------------------------------------ */

export interface TabGroup {
  name: string; // Name the UI will give the group (each approach might provide something of interest to them)
  tabs: chrome.tabs.Tab[];
}

/*
// Receives an array of tabs
// Produces:
//    - mapping: ID -> tab
//    - array of: (tab title, tab ID)
// Allows an almost pure function to find similarities using only the string of the title
function abstractTabTitle(tabs:chrome.tabs.Tab[]) {

}

// Rebuilds an abstracted tab list to list of Tabs
function hydrateTabIDs(tabIDs) {

}

*/
