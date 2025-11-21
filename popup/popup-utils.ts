// popup-utils.ts

import { timeSinceAccessText } from '../scripts/time-since-access';
import { resultState, type ResultState } from './popup-values';

/* ---------------------------------------------------------
   TYPES
   --------------------------------------------------------- */

export interface TabInfo {
  id: number;
  url: string;
  title: string;
  pinned: boolean;
  lastAccessed: number;
  elapsed?: number;
}

export interface Group {
  criteria: string;
  tabInfos: TabInfo[];
}

export interface Callbacks {
  onGoToTab: (_tab: TabInfo) => void;
  onCloseTab: (_tab: TabInfo, _li: HTMLElement) => void;
  onGoToFirstTab: (_tab: TabInfo) => void;
  onCloseAllTabs: (_tabs: TabInfo[], _groupSection: HTMLElement) => void;
}

/* ---------------------------------------------------------
   HELPER FUNCTIONS
   --------------------------------------------------------- */

// Clears all children of duplicateListDiv except the resultsLiveRegion (for screen readers)
function clearResults(duplicateListDiv: HTMLElement | null) {
  if (!duplicateListDiv) return;

  // Remove all children except resultsLiveRegion (aria-live for screen readers)
  [...duplicateListDiv.children].forEach((child) => {
    if (child.id !== 'resultsLiveRegion') {
      duplicateListDiv.removeChild(child);
    }
  });
}

// Changes the visible message based on the current state
function changeResultState(state: ResultState) {
  console.debug('Changing result state to:', state);

  if (!state) {
    console.error('changeResultState: State is undefined or null');
    return;
  }
  const resultStateValues = Object.values(resultState);
  if (!resultStateValues.includes(state)) {
    console.error('changeResultState: Invalid state:', state);
    return;
  }

  // Hide all messages, then show the one for the current state
  // Possible states are in the resultState enum object
  // Values are the IDs of the divs
  for (const s of resultStateValues) {
    const elem = document.getElementById(s);
    if (elem) {
      if (s === state) {
        elem.hidden = false;
      } else {
        elem.hidden = true;
      }
    }
  }

  // Clear results div except when state just change to show results.
  if (state !== resultState.DUPLICATES_FOUND) {
    clearResults(document.getElementById('duplicateList'));
  }
}

/* ---------------------------------------------------------
   NEW RENDERING FUNCTION
   --------------------------------------------------------- */

function renderTabGroups(
  groups: Group[],
  anchorPoint: HTMLElement,
  groupTemplate: HTMLTemplateElement,
  itemTemplate: HTMLTemplateElement,
  callbacks: Callbacks
) {
  console.debug('called renderTabGroups:', groups);
  if (!groups || !anchorPoint || !groupTemplate || !itemTemplate || !callbacks) {
    console.error('renderTabGroups: Missing required parameters');
    return;
  }

  // `groups` is an array where each item represents a tab group:
  // - group.criteria: group identifier (string)
  // - group.tabInfos: array of tab objects, each with:
  //     - id: tab ID (number)
  //     - url: tab URL (string)
  //     - title: tab title (string)
  //     - pinned: is tab pinned (boolean)
  //     - lastAccessed: last accessed timestamp (number, ms since epoch)

  if (groups.length === 0) {
    changeResultState(resultState.NO_DUPLICATES);
    return;
  }

  // Prepare the are for new results
  clearResults(anchorPoint);

  // For each group, clone the group template, fill in the data, and append to anchorPoint

  groups.forEach((group, groupIdx) => {
    const groupNode = groupTemplate.content.cloneNode(true) as DocumentFragment;
    const groupSection = groupNode.querySelector('.tab-group') as HTMLElement;
    (groupSection.querySelector('.tab-group__key') as HTMLElement).textContent =
      group.criteria;
    (groupSection.querySelector('.tab-group__count') as HTMLElement).textContent =
      group.tabInfos.length.toString();
    const ul = groupSection.querySelector('.tab-list') as HTMLElement;

    group.tabInfos.forEach((tabinfo, tabIdx) => {
      const itemNode = itemTemplate.content.cloneNode(true) as DocumentFragment;
      const li = itemNode.querySelector('li') as HTMLElement;

      // Set unique IDs for accessibility
      const tabId = `tab-title-${groupIdx + 1}-${tabIdx + 1}`;
      const gotoId = `tab-goto-label-${groupIdx + 1}-${tabIdx + 1}`;
      const closeId = `tab-close-label-${groupIdx + 1}-${tabIdx + 1}`;
      const titleSpan = li.querySelector('.tab-title') as HTMLElement;
      titleSpan.textContent = tabinfo.title;
      titleSpan.id = tabId;

      if (tabinfo.elapsed) {
        console.debug('Rendering tab:', tabinfo.title, 'with elapsed:', tabinfo.elapsed);
        (li.querySelector('.tab-elapsed') as HTMLElement).textContent =
          timeSinceAccessText(tabinfo.elapsed);
      }

      if (tabinfo.pinned) {
        (li.querySelector('.tab-symbol') as HTMLElement).textContent = '📌';
      }

      // Set aria-labelledby for buttons
      const gotoBtn = li.querySelector('.tab-goto') as HTMLElement;
      gotoBtn.setAttribute('aria-labelledby', `${tabId} ${gotoId}`);
      (gotoBtn.querySelector('.sr-only') as HTMLElement).id = gotoId;
      const closeBtn = li.querySelector('.tab-close') as HTMLElement;
      closeBtn.setAttribute('aria-labelledby', `${tabId} ${closeId}`);
      (closeBtn.querySelector('.sr-only') as HTMLElement).id = closeId;

      // Per tab actions: Go to tab
      (itemNode.querySelector('.tab-goto') as HTMLElement).addEventListener(
        'click',
        () => {
          callbacks.onGoToTab(tabinfo);
        }
      );
      // Per tab actions: Close tab
      (itemNode.querySelector('.tab-close') as HTMLElement).addEventListener(
        'click',
        () => {
          callbacks.onCloseTab(tabinfo, li);
        }
      );

      ul.appendChild(li);
    });

    // Per group actions: Go to first tab
    (
      groupSection.querySelector('.tab-group__goto-first') as HTMLElement
    ).addEventListener('click', () => {
      callbacks.onGoToFirstTab(group.tabInfos[0]);
    });

    // Per group actions: Close all tabs but one
    (groupSection.querySelector('.tab-group__close-all') as HTMLElement).addEventListener(
      'click',
      () => {
        callbacks.onCloseAllTabs(group.tabInfos, groupSection);
      }
    );

    anchorPoint.appendChild(groupSection);
  });

  changeResultState(resultState.DUPLICATES_FOUND);
}

/* ---------------------------------------------------------
   EXPORTS
   --------------------------------------------------------- */

export { changeResultState };
export { renderTabGroups };
