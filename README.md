# Tab-a-mole

"Tab-a-mole" is a Chrome extension that helps you find and manage duplicate tabs.

## Important Files

* `manifest.json`: The core configuration file for the Chrome extension.
  It defines the extension's name, version, permissions, and the files it uses.
* `popup.html`: The HTML structure for the extension's user interface, which is
  shown when you click the extension's icon.
* `popup.css`: The stylesheet for the popup interface.
* `popup.js`: The JavaScript file that controls the behavior of the popup.
  It handles user interactions, communicates with the background script, and
  displays the results.

### Communication

(REWRITE in a cleaner way) The click happens, a function in popup.js emits a message, a function in background.js picks up the message, and starts working. Once it completes, it sends messages. A function in popup.js reads those messages and displays them on the popup window. Important messages are `{message:find_duplicates, matchLevel:_, scope:_}` and `{message:duplicate_tabs, tabs:[{url, tabids}]}`.

## Development

To install the extension for development in Chrome:

1. Clone or download this repository.
2. Open Chrome and navigate to the extensions page by entering
   `chrome://extensions` in the address bar.
3. Enable "Developer mode".
4. Click the "Load unpacked" button that appears on the top-left.
5. In the file selection dialog, navigate to the directory with these files.
6. The "Tab-a-mole" extension is loaded. Access the icon by clicking on the extension button.
