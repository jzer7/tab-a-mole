/*global chrome*/

/* This component watches for changes to the theme, and applies it
 * to the document root, by setting a 'data-theme' attribute.
 *
 * There are 3 possible values set in the Options UI.
 *    - 'light'
 *    - 'dark', or
 *    - 'system', in which case the system preference is used.
 */
document.addEventListener('DOMContentLoaded', function () {
  console.log('Theme script loaded');
  const root = document.documentElement;

  // Object that describes the system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(theme) {
    console.log('Applying theme:', theme);
    if (theme === 'system') {
      const systemTheme = prefersDark.matches ? 'dark' : 'light';
      root.setAttribute('data-theme', systemTheme);
    } else {
      root.setAttribute('data-theme', theme);
    }
  }

  // Listen for changes in system preference, and if theme is set to 'system' we apply it.
  prefersDark.addEventListener('change', function () {
    console.log('System theme preference changed');
    const currentTheme = localStorage.getItem('theme') || 'system';
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  });

  // Listen for changes in localStorage (theme changes from options page)
  window.addEventListener('storage', function (event) {
    console.log('Storage event:', event);
    if (event.key === 'theme') {
      applyTheme(event.newValue || 'system');
    }
  });

  chrome.runtime.onMessage.addListener(function (message, _sender, _sendResponse) {
    if (message.type === 'themeChanged') {
      console.log('Received theme change message:', message);
      applyTheme(message.theme || 'system');
    }
  });

  // Initial theme application
  const savedTheme = localStorage.getItem('theme') || 'system';
  applyTheme(savedTheme);
});
