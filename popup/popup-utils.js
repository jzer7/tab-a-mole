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

export { fillGroupNode };
