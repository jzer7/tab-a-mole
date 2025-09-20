// theme-utils.js
// Pure function for applying theme, testable in isolation

function applyTheme(theme: string, root: HTMLElement, prefersDark: boolean) {
  if (theme === 'system') {
    const systemTheme = prefersDark ? 'dark' : 'light';
    root.setAttribute('data-theme', systemTheme);
    root.style.colorScheme = systemTheme;
  } else {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  }
}

export { applyTheme };
