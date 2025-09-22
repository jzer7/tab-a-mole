const msgType = Object.freeze({
  GROUP_TABS_CMD: 'get_grouped_tabs',
  GROUP_TABS_ANS: 'grouped_tabs'
});

// Use enum values in code, and make sure the values match the IDs of the divs in the HTML file
const resultState = Object.freeze({
  START: 'startSearch',
  LOADING: 'loadingMessage',
  NO_DUPLICATES: 'noDuplicatesMessage',
  DUPLICATES_FOUND: 'duplicateList'
});

const urlScope = Object.freeze({
  FULL: 'full',
  NO_HASH: 'no-hash',
  NO_QUERY: 'no-query',
  HOSTNAME: 'hostname',
  DOMAIN: 'domain'
});

const sliderToMatchLevel = Object.freeze({
  5: urlScope.FULL,
  4: urlScope.NO_HASH,
  3: urlScope.NO_QUERY,
  2: urlScope.HOSTNAME,
  1: urlScope.DOMAIN
});

const windowScope = Object.freeze({
  ALL: 'all',
  CURRENT: 'current'
});

export { msgType, resultState, sliderToMatchLevel, urlScope, windowScope };
