/*global chrome*/

// This component watches for changes to the theme, and applies it
// to the document root, by setting a 'data-theme' attribute.
// There are 3 possible values set in the Options UI:
//   - 'light'
//   - 'dark', or
//   - 'system', in which case the system preference is used.

import { applyTheme } from './theme-utils.js';

document.addEventListener('DOMContentLoaded', function () {
  console.log('Theme script loaded');
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  // Listen for changes in system preference, and if theme is set to 'system' we apply it.
  prefersDark.addEventListener('change', function () {
    console.log('Received System event to (maybe) update theme');
    const currentTheme = localStorage.getItem('theme') || 'system';
    if (currentTheme === 'system') {
      applyTheme('system', root, prefersDark);
    }
  });

  // Listen for changes in localStorage (theme changes from options page)
  window.addEventListener('storage', function (event) {
    if (event.key === 'theme') {
      console.log('Received Storage event updating theme:', event);
      applyTheme(event.newValue || 'system', root, prefersDark);
    }
  });

  // Listen for messages from other parts of the extension
  chrome.runtime.onMessage.addListener(function (message, _sender, _sendResponse) {
    if (message.type === 'themeChanged') {
      console.log('Received Message updating theme:', message);
      applyTheme(message.theme || 'system', root, prefersDark);
    }
  });

  // Initial theme application
  const savedTheme = localStorage.getItem('theme') || 'system';
  applyTheme(savedTheme, root, prefersDark);
});
