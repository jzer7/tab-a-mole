# Popup Baseline Checklist

Use this checklist before and after popup UI changes.

## Smoke Checks

- Open popup and verify controls render without clipping.
- Verify popup width is stable before and after clicking search.
- Verify the initial message is visible before search.

## Search Behavior

- Run search with URL matching and verify loading message appears.
- Verify duplicate groups render with action buttons.
- Verify tabs in groups show a color chip label.
- Switch to title matching and verify URL controls are visually disabled.

## Empty and Error States

- Search with no duplicates and verify no-duplicates message.
- Simulate delayed/no response and verify timeout error message appears.
- Trigger messaging failure (e.g., reload extension while popup open) and verify error message appears.

## Interaction Checks

- Click go-to-tab action and verify browser focuses target tab/window.
- Click close-tab action and verify item is removed from list.
- Click group actions and verify group updates correctly.

## Scroll and Rendering

- With many results, fast-scroll through list and verify smooth painting.
- Verify there is no large blank trailing space at the bottom.

## Persistence Checks

- Change match mode (URL/Title), close popup, reopen, verify mode persists.
- Change slider and checkbox values, close popup, reopen, verify values persist.

## Regression Guard

- Run `bun test` and confirm all tests pass.
