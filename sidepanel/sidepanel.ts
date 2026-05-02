/* sidepanel.ts */

import { initTabSearch } from '../scripts/tab-search-controller';
import { setupThemeToggle } from '../scripts/theme-toggle';

document.addEventListener('DOMContentLoaded', () => {
  console.info('Sidebar loaded');

  const { triggerSearch } = initTabSearch();
  setupThemeToggle();

  // Auto-search on open: sidebar is for deep review, no manual trigger needed
  triggerSearch();

  /* -----------------------------------------------
     Sidebar-specific: close button
     ----------------------------------------------- */

  const closeSidebarButton = document.getElementById(
    'closeSidebar'
  ) as HTMLButtonElement | null;

  if (closeSidebarButton) {
    closeSidebarButton.addEventListener('click', () => {
      chrome.sidePanel.setOptions({ enabled: false });
    });
  }
});
