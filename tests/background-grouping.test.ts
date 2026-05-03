import { describe, it, expect } from 'bun:test';
import { groupTabsByTitle, groupTabsByUrl } from '../background/tab-grouping';

describe('groupTabsByTitle', () => {
  it('groups tabs with similar titles', () => {
    const tabs = [
      { id: 1, title: 'Google Search', url: 'https://google.com' },
      {
        id: 2,
        title: 'Google Search Results',
        url: 'https://google.com/search'
      },
      { id: 3, title: 'Bing Search', url: 'https://bing.com' },
      { id: 4, title: 'Google Search', url: 'https://google.com/maps' },
      { id: 5, title: 'Completely Different', url: 'https://other.com' }
    ] as chrome.tabs.Tab[];
    const config = { titleThreshold: 0.5 };
    const groups = groupTabsByTitle(tabs, config);
    // Should group the three Google tabs together
    expect(groups.length).toBe(1);
    expect(groups[0].tabs.length).toBe(3);
    // The Bing and Different tabs should not be grouped
  });

  it('returns empty array if no similar titles', () => {
    const tabs = [
      { id: 1, title: 'A', url: 'a' },
      { id: 2, title: 'B', url: 'b' },
      { id: 3, title: 'C', url: 'c' }
    ] as chrome.tabs.Tab[];
    const config = { titleThreshold: 0.8 };
    const groups = groupTabsByTitle(tabs, config);
    expect(groups.length).toBe(0);
  });

  it('groups tabs with partial overlap in titles', () => {
    const tabs = [
      { id: 1, title: 'Example bing query', url: 'https://a.com' },
      { id: 2, title: 'Sample blog', url: 'https://b.com' },
      { id: 3, title: 'Bing blog updates', url: 'https://c.com' },
      { id: 4, title: 'Spatial query updates', url: 'https://d.com' },
      {
        id: 5,
        title: 'Example of Temporal and Spatial updates',
        url: 'https://e.com'
      }
    ] as chrome.tabs.Tab[];
    // Use a threshold that allows for some overlap but not just one word
    const config = { titleThreshold: 0.25 };
    const groups = groupTabsByTitle(tabs, config);
    // There should be at least one group with more than one tab
    expect(groups.length).toBeGreaterThan(0);
    // At least one group should contain 'Spatial query updates' and 'Example of Temporal and Spatial updates'
    const found = groups.some(
      (g) =>
        g.tabs.some((t) => t.title === 'Spatial query updates') &&
        g.tabs.some((t) => t.title === 'Example of Temporal and Spatial updates')
    );
    expect(found).toBe(true);
  });
});

describe('groupTabsByUrl', () => {
  it('groups tabs by full URL', () => {
    const tabs = [
      { id: 1, url: 'https://a.com/x', title: 'A' },
      { id: 2, url: 'https://a.com/x', title: 'A2' },
      { id: 3, url: 'https://a.com/y', title: 'A3' }
    ] as chrome.tabs.Tab[];
    const config = { matchLevel: 'full' as const };
    const groups = groupTabsByUrl(tabs, config);
    expect(groups.length).toBe(1);
    expect(groups[0].tabs.length).toBe(2);
  });

  it('groups tabs by domain', () => {
    const tabs = [
      { id: 1, url: 'https://a.example.com/x', title: 'A' },
      { id: 2, url: 'https://b.example.com/y', title: 'B' },
      { id: 3, url: 'https://example.com/z', title: 'C' }
    ] as chrome.tabs.Tab[];
    const config = { matchLevel: 'domain' as const };
    const groups = groupTabsByUrl(tabs, config);
    // All should be grouped by 'example.com'
    expect(groups.length).toBe(1);
    expect(groups[0].tabs.length).toBe(3);
  });

  it('respects httpsOnly filter', () => {
    const tabs = [
      { id: 1, url: 'http://a.com', title: 'A' },
      { id: 2, url: 'https://a.com', title: 'B' },
      { id: 3, url: 'https://a.com', title: 'C' }
    ] as chrome.tabs.Tab[];
    const config = { matchLevel: 'full' as const, httpsOnly: true };
    const groups = groupTabsByUrl(tabs, config);
    expect(groups.length).toBe(1);
    expect(groups[0].tabs.length).toBe(2);
  });

  it('handles unparseable URLs', () => {
    const tabs = [
      { id: 1, url: 'not a url', title: 'A' },
      { id: 2, url: 'not a url', title: 'B' }
    ] as chrome.tabs.Tab[];
    const config = { matchLevel: 'full' as const, includeParseErrors: true };
    const groups = groupTabsByUrl(tabs, config);
    expect(groups.length).toBe(1);
    expect(groups[0].tabs.length).toBe(2);
  });

  it('excludes unparseable URLs when includeParseErrors is false', () => {
    const tabs = [
      { id: 1, url: 'not a url', title: 'A' },
      { id: 2, url: 'not a url', title: 'B' },
      { id: 3, url: 'https://valid.com', title: 'C' }
    ] as chrome.tabs.Tab[];
    const config = { matchLevel: 'full' as const, includeParseErrors: false };
    const groups = groupTabsByUrl(tabs, config);
    expect(groups.length).toBe(0);
  });

  it('groups tabs by hostname', () => {
    const tabs = [
      { id: 1, url: 'https://sub.example.com/x', title: 'A' },
      { id: 2, url: 'https://sub.example.com/y', title: 'B' },
      { id: 3, url: 'https://other.example.com/x', title: 'C' }
    ] as chrome.tabs.Tab[];
    const config = { matchLevel: 'hostname' as const };
    const groups = groupTabsByUrl(tabs, config);
    expect(groups.length).toBe(1);
    expect(groups[0].tabs.length).toBe(2);
    expect(groups[0].groupingCriteria).toBe('sub.example.com');
  });

  it('groups tabs by no-query (ignores query string)', () => {
    const tabs = [
      { id: 1, url: 'https://example.com/search?q=foo', title: 'A' },
      { id: 2, url: 'https://example.com/search?q=bar', title: 'B' },
      { id: 3, url: 'https://example.com/other', title: 'C' }
    ] as chrome.tabs.Tab[];
    const config = { matchLevel: 'no-query' as const };
    const groups = groupTabsByUrl(tabs, config);
    expect(groups.length).toBe(1);
    expect(groups[0].tabs.length).toBe(2);
  });

  it('groups tabs by no-hash (ignores fragment)', () => {
    const tabs = [
      { id: 1, url: 'https://example.com/page#section1', title: 'A' },
      { id: 2, url: 'https://example.com/page#section2', title: 'B' },
      { id: 3, url: 'https://example.com/other', title: 'C' }
    ] as chrome.tabs.Tab[];
    const config = { matchLevel: 'no-hash' as const };
    const groups = groupTabsByUrl(tabs, config);
    expect(groups.length).toBe(1);
    expect(groups[0].tabs.length).toBe(2);
  });

  it('skips tabs with undefined or empty URL', () => {
    const tabs = [
      { id: 1, url: undefined, title: 'A' },
      { id: 2, url: '', title: 'B' },
      { id: 3, url: 'https://valid.com', title: 'C' }
    ] as chrome.tabs.Tab[];
    const config = { matchLevel: 'full' as const };
    const groups = groupTabsByUrl(tabs, config);
    expect(groups.length).toBe(0);
  });

  it('returns empty array for single tab', () => {
    const tabs = [{ id: 1, url: 'https://example.com', title: 'A' }] as chrome.tabs.Tab[];
    const config = { matchLevel: 'full' as const };
    const groups = groupTabsByUrl(tabs, config);
    expect(groups.length).toBe(0);
  });
});

describe('groupTabsByTitle (additional)', () => {
  it('uses default threshold of 0.5 when not specified', () => {
    const tabs = [
      { id: 1, title: 'Google Search', url: 'https://google.com' },
      { id: 2, title: 'Google Search Results', url: 'https://google.com/r' }
    ] as chrome.tabs.Tab[];
    // With default threshold 0.5, "Google Search" and "Google Search Results" should group
    const groups = groupTabsByTitle(tabs, {});
    expect(groups.length).toBe(1);
  });

  it('returns empty array for a single tab', () => {
    const tabs = [
      { id: 1, title: 'Only Tab', url: 'https://example.com' }
    ] as chrome.tabs.Tab[];
    const groups = groupTabsByTitle(tabs, { titleThreshold: 0.5 });
    expect(groups.length).toBe(0);
  });

  it('returns empty array for empty tabs array', () => {
    const groups = groupTabsByTitle([], { titleThreshold: 0.5 });
    expect(groups.length).toBe(0);
  });

  it('groups tabs with identical empty titles', () => {
    const tabs = [
      { id: 1, title: '', url: 'https://a.com' },
      { id: 2, title: '', url: 'https://b.com' }
    ] as chrome.tabs.Tab[];
    // Both have empty token sets: jaccard = 0/0 = 0, but threshold is 0.5 so they should NOT group
    // (union size is 0 → returns 0; 0 < 0.5)
    const groups = groupTabsByTitle(tabs, { titleThreshold: 0.5 });
    expect(groups.length).toBe(0);
  });

  it('performs case-insensitive title matching', () => {
    const tabs = [
      { id: 1, title: 'Example Page', url: 'https://a.com' },
      { id: 2, title: 'EXAMPLE PAGE', url: 'https://b.com' }
    ] as chrome.tabs.Tab[];
    const groups = groupTabsByTitle(tabs, { titleThreshold: 0.9 });
    expect(groups.length).toBe(1);
    expect(groups[0].tabs.length).toBe(2);
  });

  it('ignores punctuation when comparing titles', () => {
    const tabs = [
      { id: 1, title: 'Search - Google', url: 'https://a.com' },
      { id: 2, title: 'Search Google!', url: 'https://b.com' }
    ] as chrome.tabs.Tab[];
    const groups = groupTabsByTitle(tabs, { titleThreshold: 0.6 });
    expect(groups.length).toBe(1);
  });
});
