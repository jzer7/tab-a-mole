# Tab-a-mole

[![build](https://github.com/jzer7/tab-a-mole/actions/workflows/build.yml/badge.svg)](https://github.com/jzer7/tab-a-mole/actions/workflows/build.yml)

"Tab-a-mole" is a Chrome extension that helps you find and manage duplicate tabs.

This project is coded in TypeScript and uses Bun to manage the environment.

## Important Files

- `manifest.json`: The core configuration file for the Chrome extension.
  It defines the extension's name, version, permissions, and the files it uses.
- `popup.html`: The HTML structure for the extension's user interface, which is
  shown when you click the extension's icon.
- `popup.css`: The stylesheet for the popup interface.
- `popup.js`: The JavaScript file that controls the behavior of the popup.
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

### To debug

I still don't have a great way to debug code here.
What I currently do:

1. Start an _extension.js_ `dev` session with:

   ```sh
   bun dev
   ```

2. _Bun_ will open a _Chrome_ browser with your extension loaded.
   It will also show this message:

   ```txt
   ►►► Tab-a-mole compiled successfully in 2377 ms.
   ►►► Chrome Extension running in development mode.
   ►►► Chrome found 1 targets
   ►►► Chrome target WebSocket URL stored for future connections
   ►►► Chrome CDP Client browser connection established
   ►►► Chrome CDP Client connected to 127.0.0.1:9172
   ```

   Make note of the port number `9172`.

3. On VS Code, use a debug session configured as _Attach to Chrome_.
   Pass the port number.
   What is unclear still is the correlation of lines of code between: what actually runs, what the Chrome development environment shows, and what VS Code shows.
   I think the issue is the `.map` files, which I still do not know how to produce.
