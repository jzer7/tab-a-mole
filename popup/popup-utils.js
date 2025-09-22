// popup-utils.js

import { timeSinceAccessText } from '../scripts/time-since-access.ts';
import { resultState } from './popup-values.js';

/* ---------------------------------------------------------
   HELPER FUNCTIONS
   --------------------------------------------------------- */

// Clears all children of duplicateListDiv except the resultsLiveRegion (for screen readers)
function clearResults(duplicateListDiv) {
  if (!duplicateListDiv) return;

  // Remove all children except resultsLiveRegion (aria-live for screen readers)
  [...duplicateListDiv.children].forEach((child) => {
    if (child.id !== 'resultsLiveRegion') {
      duplicateListDiv.removeChild(child);
    }
  });
}

// Changes the visible message based on the current state
function changeResultState(state) {
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

function renderTabGroups(groups, anchorPoint, groupTemplate, itemTemplate, callbacks) {
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
    const groupNode = groupTemplate.content.cloneNode(true);
    const groupSection = groupNode.querySelector('.tab-group');
    groupSection.querySelector('.tab-group__key').textContent = group.criteria;
    groupSection.querySelector('.tab-group__count').textContent = group.tabInfos.length;
    const ul = groupSection.querySelector('.tab-list');

    // TODO: still need to add the callbacks to the group buttons

    group.tabInfos.forEach((tab, tabIdx) => {
      const itemNode = itemTemplate.content.cloneNode(true);
      const li = itemNode.querySelector('li');
      // Set unique IDs for accessibility
      const tabId = `tab-title-${groupIdx + 1}-${tabIdx + 1}`;
      const gotoId = `tab-goto-label-${groupIdx + 1}-${tabIdx + 1}`;
      const closeId = `tab-close-label-${groupIdx + 1}-${tabIdx + 1}`;
      const titleSpan = li.querySelector('.tab-title');
      titleSpan.textContent = tab.title;
      titleSpan.id = tabId;
      li.querySelector('.tab-elapsed').textContent = tab.elapsed;
      // Set aria-labelledby for buttons
      const gotoBtn = li.querySelector('.tab-goto');
      gotoBtn.setAttribute('aria-labelledby', `${tabId} ${gotoId}`);
      gotoBtn.querySelector('.sr-only').id = gotoId;
      const closeBtn = li.querySelector('.tab-close');
      closeBtn.setAttribute('aria-labelledby', `${tabId} ${closeId}`);
      closeBtn.querySelector('.sr-only').id = closeId;
      ul.appendChild(li);

      // TODO: still need to add the callbacks to the tab buttons
    });
    anchorPoint.appendChild(groupSection);
  });

  changeResultState(resultState.DUPLICATES_FOUND);
}

/* ---------------------------------------------------------
   EXPORTS
   --------------------------------------------------------- */

export { changeResultState };
export { renderTabGroups };
