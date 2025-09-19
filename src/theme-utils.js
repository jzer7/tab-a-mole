// theme-utils.js
// Pure function for applying theme, testable in isolation

export function applyTheme(theme, root, prefersDark) {
  if (theme === 'system') {
    const systemTheme = prefersDark.matches ? 'dark' : 'light';
    root.setAttribute('data-theme', systemTheme);
    root.style.colorScheme = systemTheme;
  } else {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  }
}
