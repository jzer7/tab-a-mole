export const msgType = {
  GROUP_TABS_CMD: 'get_grouped_tabs',
  GROUP_TABS_ANS: 'grouped_tabs'
} as const;

export type MsgType = (typeof msgType)[keyof typeof msgType];

// Use enum values in code, and make sure the values match the IDs of the divs in the HTML file
export const resultState = {
  START: 'startSearch',
  LOADING: 'loadingMessage',
  NO_DUPLICATES: 'noDuplicatesMessage',
  DUPLICATES_FOUND: 'duplicateList'
} as const;

export type ResultState = (typeof resultState)[keyof typeof resultState];

export const urlScope = {
  FULL: 'full',
  NO_HASH: 'no-hash',
  NO_QUERY: 'no-query',
  HOSTNAME: 'hostname',
  DOMAIN: 'domain'
} as const;

export type UrlScope = (typeof urlScope)[keyof typeof urlScope];

export const sliderToMatchLevel: Record<number, UrlScope> = {
  5: urlScope.FULL,
  4: urlScope.NO_HASH,
  3: urlScope.NO_QUERY,
  2: urlScope.HOSTNAME,
  1: urlScope.DOMAIN
};

export const windowScope = {
  ALL: 'all',
  CURRENT: 'current'
} as const;

export type WindowScope = (typeof windowScope)[keyof typeof windowScope];
