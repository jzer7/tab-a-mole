export function setupOpenSettingsButton() {
  const button = document.getElementById('openSettings');
  button?.addEventListener('click', () => chrome.runtime.openOptionsPage());
}
