/*
 * Watches configuration controls, and saves selection to localStorage.
 *
 * Code has to be here, as extensions do not allow inline scripts in HTML.
 */
document.addEventListener('DOMContentLoaded', function () {
  console.log('Options script loaded');
  // Load theme from LocalStorage, or default to system
  const savedTheme = localStorage.getItem('theme') || 'system';

  // Update storage, writes the value to localStorage. Other pages with the
  // same Origin can listen to it. To inform the current page about it, it also
  // dispatches a storage event
  //
  // Note: localStorage.setItem does not trigger a storage event on the same page.
  // See https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event
  function updateLocalStorage(key, newValue) {
    const oldValue = localStorage.getItem(key);
    localStorage.setItem(key, newValue);

    const storageEvent = new StorageEvent('storage', {
      key: key,
      oldValue: oldValue,
      newValue: newValue,
      url: window.location.href,
      storageArea: localStorage
    });

    window.dispatchEvent(storageEvent);
  }

  // Configure the radios
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  for (const radio of themeRadios) {
    // Set the radio button to the saved theme
    radio.checked = radio.value === savedTheme;

    // Event listener
    radio.addEventListener('change', function () {
      if (this.checked) {
        // Update value in LocalStorage.
        updateLocalStorage('theme', this.value);
        console.log('Theme changed to:', this.value);
      }
    });
  }
});
