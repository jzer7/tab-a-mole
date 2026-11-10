# CSS conventions

This guide explains where extension styles live and how to extend them without
breaking the shared light/dark theme or the visual conventions.

## Stylesheet map

- [color.css](../pages/css/color.css) owns semantic colors. Each color token
  uses `light-dark(light-value, dark-value)` so it follows the active theme.
- [geometry.css](../pages/css/geometry.css) owns spacing, radii, typography,
  font weights, and shared transitions.
- [popup.css](../popup/popup.css) provides common layout and component styles
  for the popup and surfaces that import it.
- [sidepanel.css](../sidepanel/sidepanel.css) imports popup styles, then adds
  only side-panel layout overrides.
- [options.css](../options/options.css) imports popup styles and adds
  options-page layout and settings styles.
- [main.css](../pages/css/main.css) is the general page stylesheet. It imports
  the shared color and geometry token files directly.

The popup, side panel, and options HTML files load their corresponding CSS entry
points. Keep shared tokens in the two token files rather than defining parallel
palettes in a surface stylesheet.

## Theme behavior

The root in `color.css` defines both color values with `light-dark()` and sets
`color-scheme: light dark` for native browser controls. The theme script sets a
`data-theme="light"` or `data-theme="dark"` attribute and the root
`color-scheme` when a user selects a theme. When no theme attribute is present,
the browser's system preference determines the active colors.

Do not add a second `prefers-color-scheme` palette or duplicate dark and light
token blocks in component stylesheets. The manual selection must continue to
override the system preference. If you change how themes are selected, keep the
popup, side panel, options page, and native controls in sync.

## Using design tokens

Use semantic tokens at component call sites instead of raw colors or one-off
spacing values. For example:

```css
.new-card {
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg-panel);
  color: var(--color-text);
}
```

Choose tokens by role, not by the specific color they currently contain:

- Surfaces: `--color-bg`, `--color-bg-panel`, `--color-bg-group`
- Text: `--color-text`, `--color-text-emphasis`, `--color-text-muted`
- Actions: `--color-primary`, `--color-primary-dark`, `--color-primary-bg`,
  `--color-text-on-primary`
- Status: `--color-danger`, `--color-danger-dark`, `--color-danger-bg`
- Lines and depth: `--color-border`, `--color-border-group`,
  `--color-border-list`, `--color-shadow`
- Layout and type: `--space-*`, `--radius*`, `--font-*`, `--transition`

For new semantic colors, add matching light and dark values in `color.css`. For
new shared spacing, typography, or radius values, add a named token in
`geometry.css`. Use existing tokens whenever they fit; avoid adding aliases or
near-duplicate values just to rename an existing token.

Tab group chips use paired `--chip-<name>-bg` and `--chip-<name>-text` tokens.
When adding a chip color, define both theme values in `color.css` and use them
from the corresponding `[data-color]` selector in `popup.css`. Keep both text
and background readable in both themes.

## Adding or changing components

1. Decide whether the style is shared or specific to one surface. Put shared
   components in `popup.css`; keep page-only rules in that page's stylesheet.
2. Prefer a component class over broad element selectors or IDs. Follow the
   existing block/element naming pattern, such as `.tab-group__header` and
   `.settings-card`.
3. Use the shared tokens for colors, spacing, radii, typography, and
   transitions. Do not hardcode theme-dependent values in component rules.
4. Include visible hover and keyboard-focus states for interactive elements.
   Keep focus indicators visible in both themes; do not remove outlines without
   an accessible replacement.
5. Check the component in light and dark themes, and make sure it still fits
   popup, side panel, and options surfaces wherever the style is shared.
6. Keep overrides narrow and intentional. Avoid duplicate declarations,
   `!important`, and repeated token definitions.

Raw values are appropriate for one-off layout constraints (for example, a
surface's `max-width` or a responsive breakpoint) when no shared token makes
sense. They are not appropriate for theme-sensitive foreground, background,
border, or status colors.

## Validation

After CSS changes, build the extension and run the test suite. Check formatting
and the final diff as well:

```sh
bun run build
bun test
bunx prettier --check pages/css/color.css pages/css/geometry.css pages/css/main.css popup/popup.css options/options.css sidepanel/sidepanel.css
```

For visual changes, inspect each affected surface in both themes. Do not edit
generated files under `dist/`; update the source stylesheet instead.
