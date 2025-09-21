// popup-utils.js

/**
 * Assembles a groupNode DOM element with tab group data and attaches event handlers.
 * @param {Object} params
 * @param {Element} params.groupTemplate - The group template DOM element
 * @param {Element} params.tabTemplate - The tab item template DOM element
 * @param {Object} params.matchedGroup - The group data {criteria, tabInfos}
 * @param {Function} params.timeSinceAccessText - Utility to format lastAccessed
 * @param {Function} params.onGoToTab - (tabInfo) => void
 * @param {Function} params.onCloseTab - (tabInfo, tabNode) => void
 * @param {Function} params.onGoToFirstTab - (firstTabInfo) => void
 * @param {Function} params.onCloseAllTabs - (tabInfos, groupNode) => void
 * @returns {Element} The filled groupNode
 */
function fillGroupNode({
  groupTemplate,
  tabTemplate,
  matchedGroup,
  timeSinceAccessText,
  onGoToTab,
  onCloseTab,
  onGoToFirstTab,
  onCloseAllTabs
}) {
  // 1. Clone group template
  const groupNode = groupTemplate.content.cloneNode(true);

  // 2. Update the group Header
  groupNode.querySelector('.matched-group__key').textContent = matchedGroup.criteria;
  groupNode.querySelector('.matched-group__count').textContent =
    matchedGroup.tabInfos.length;

  // 3. Tab list
  const ul = groupNode.querySelector('.matched-group__list');
  matchedGroup.tabInfos.forEach((oneTabInfo) => {
    const tabNode = tabTemplate.content.cloneNode(true);

    // Fill out the tab title (truncated to 50 chars)
    let tabTitle = oneTabInfo.title || '(no title)';
    if (tabTitle.length > 50) {
      tabTitle = tabTitle.substring(0, 50) + '...';
    }
    tabNode.querySelector('.tab-item__title').textContent = tabTitle;

    // Last accessed
    if (oneTabInfo.lastAccessed) {
      tabNode.querySelector('.tab-item__elapsed').textContent = timeSinceAccessText(
        oneTabInfo.lastAccessed
      );
    } else {
      tabNode.querySelector('.tab-item__elapsed').textContent = '';
    }

    tabNode.querySelector('.tab-item__symbol').textContent = oneTabInfo.pinned
      ? '📌'
      : '';

    // Per tab actions: Go to tab
    tabNode
      .querySelector('.tab-item__goto')
      .addEventListener('click', () => onGoToTab(oneTabInfo));
    // Per tab actions: Close tab
    tabNode
      .querySelector('.tab-item__close')
      .addEventListener('click', () => onCloseTab(oneTabInfo, tabNode));
    ul.appendChild(tabNode);
  });

  // Group actions
  groupNode
    .querySelector('.matched-group__close-all')
    .addEventListener('click', () => onCloseAllTabs(matchedGroup.tabInfos, groupNode));
  groupNode
    .querySelector('.matched-group__goto-first')
    .addEventListener('click', () => onGoToFirstTab(matchedGroup.tabInfos[0]));
  return groupNode;
}

/* ---------------------------------------------------------
   NEW RENDERING FUNCTION
   --------------------------------------------------------- */

function renderTabGroups(groups, callbacks) {
  const groupTemplate = document.getElementById('tab-group-template');
  const itemTemplate = document.getElementById('tab-item-template');

  renderTabGroupsFunc(document, groups, callbacks, groupTemplate, itemTemplate);
}

/* groups is an array of:
  {
    key: 'group key',
    count: number of tabs in group,
    tabs: [
      { title: 'Tab Title', id: 12345, elapsed: '5 minutes ago' },
      ...
    ]
  }
*/

function renderTabGroupsFunc(root, groups, callbacks, groupTemplate, itemTemplate) {
  const duplicateList = root.getElementById('duplicateList');
  if (!duplicateList) return;
  // Remove all children except resultsLiveRegion (aria-live for screen readers)
  [...duplicateList.children].forEach((child) => {
    if (child.id !== 'resultsLiveRegion') {
      duplicateList.removeChild(child);
    }
  });

  groups.forEach((group, groupIdx) => {
    const groupNode = groupTemplate.content.cloneNode(true);
    const groupSection = groupNode.querySelector('.tab-group');
    groupSection.querySelector('.tab-group__key').textContent = group.key;
    groupSection.querySelector('.tab-group__count').textContent = group.count;
    const ul = groupSection.querySelector('.tab-list');

    group.tabs.forEach((tab, tabIdx) => {
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
    });
    duplicateList.appendChild(groupSection);
  });
}

/* ---------------------------------------------------------
   EXPORTS
   --------------------------------------------------------- */
export { fillGroupNode };
export { renderTabGroups };
