/* theme-toggle.ts — shared light/dark toggle for popup and sidebar surfaces */

function getActiveTheme(themePreference: string): 'light' | 'dark' {
  if (themePreference === 'dark') return 'dark';
  if (themePreference === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function updateThemeToggleUi(btn: HTMLButtonElement, activeTheme: 'light' | 'dark') {
  const icon = btn.querySelector('i');
  if (!icon) return;

  if (activeTheme === 'dark') {
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
    btn.title = 'Switch to light theme';
    btn.setAttribute('aria-label', 'Switch to light theme');
  } else {
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
    btn.title = 'Switch to dark theme';
    btn.setAttribute('aria-label', 'Switch to dark theme');
  }
}

function applyThemePreference(
  root: HTMLElement,
  btn: HTMLButtonElement,
  theme: 'light' | 'dark'
) {
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
  localStorage.setItem('theme', theme);
  updateThemeToggleUi(btn, theme);
  chrome.runtime.sendMessage({ type: 'themeChanged', theme });
}

export function setupThemeToggle() {
  const btn = document.getElementById('themeToggle') as HTMLButtonElement | null;
  if (!btn) return;

  const root = document.documentElement as HTMLElement;
  const savedPreference = localStorage.getItem('theme') || 'system';
  updateThemeToggleUi(btn, getActiveTheme(savedPreference));

  btn.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    applyThemePreference(root, btn, current === 'dark' ? 'light' : 'dark');
  });
}
