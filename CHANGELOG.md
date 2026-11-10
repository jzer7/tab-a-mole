# Changelog

Notable changes are documented here, based on the repository's tagged history.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v2.1.3] - 2026-11-09]

### Added

- Add a settings page for title-grouping method and thresholds, accessible from the
  popup, sidebar, and toolbar context menu.
- Automate common TypeScript development flows using Makefile.
- Add configurable, pluggable title-grouping heuristics and a benchmark.

### Changed

- Unify light and dark theme tokens across the popup, sidebar, options, and page
  styles while preserving system preference and manual theme selection.
- Persist title-grouping preferences and apply them to title-based searches.
- Refactor tab grouping to separate URL and title grouping, with title indexes
  mapped back to tabs.
- Improve tests for background grouping and the **popup** component.
- Update development configuration and tooling.

## [v2.1.2] - 2026-11-07

### Changed

- Updated development dependencies and tooling.
- Clarified search behavior, installation, and development instructions.

### Fixed

- Prevented GitHub checkout credentials from persisting in CI jobs.

## [v2.1.1] - 2026-08-10

### Changed

- Updated dependencies and development tooling.

## [v2.1.0] - 2026-08-03

### Changed

- Updated development tooling and build configuration.

## [v2.0.3] - 2026-07-22

### Changed

- Updated dependencies.

## [v2.0.2] - 2026-07-02

### Changed

- Updated JavaScript and GitHub Actions dependencies.
- Required dependencies to be at least seven days old to reduce supply-chain
  risk.

## [v2.0.1] - 2026-05-02

### Added

- Search for duplicate tabs in a popup and open results in a sidebar.
- Retain search results in the sidebar.
- Embed icons so the extension works without network access.
- Toggle between light and dark color palettes.

### Fixed

- Resolve two race conditions involving search results and searches.
