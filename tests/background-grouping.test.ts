import { describe, expect, it } from 'bun:test';
import {
  type TitleGroupCandidate,
  getDefaultTitleGroupingConfig,
  groupTabsByTitle,
  informativeTokenTitleGrouping,
  jaccardTitleGrouping
} from '../background/grouping-by-title';
import { groupTabsByUrl } from '../background/grouping-by-url';
import { titleGroupingDataset } from './fixtures/title-grouping-dataset';
import {
  topThreeGroupPrecisionScore,
  topThreeGroupResults
} from './title-grouping-benchmark';

describe('groupTabsByTitle', () => {
  it('returns the default configuration', () => {
    const config = getDefaultTitleGroupingConfig();

    expect(config).toEqual({
      titleThreshold: 0.5,
      titleConfidenceThreshold: 0.5,
      titleGroupingFunction: jaccardTitleGrouping,
      titleNormalizationFunction: expect.any(Function),
      titleTokenizationFunction: expect.any(Function)
    });
  });

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
    expect(groups[0].name).toBe('sub.example.com');
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

  it('normalizes informative titles before tokenizing them', () => {
    const tabs = [
      { id: 1, title: 'Café Companies', url: 'https://a.com' },
      { id: 2, title: 'cafe company', url: 'https://b.com' }
    ] as chrome.tabs.Tab[];
    const defaults = getDefaultTitleGroupingConfig();
    const candidates = informativeTokenTitleGrouping(
      tabs.map((tab) => tab.title ?? ''),
      {
        threshold: 1,
        normalizationFunction: defaults.titleNormalizationFunction,
        tokenizationFunction: defaults.titleTokenizationFunction
      }
    );
    expect(candidates).toHaveLength(2);
    expect(candidates.every(({ tabIndexes }) => tabIndexes.length === 2)).toBe(true);
  });

  it('passes configured options to a pluggable candidate generator', () => {
    const tabs = [
      { id: 1, title: 'one', url: 'https://a.com' },
      { id: 2, title: 'two', url: 'https://b.com' }
    ] as chrome.tabs.Tab[];
    const normalizationFunction = (phrase: string) => phrase;
    const tokenizationFunction = (phrase: string) => new Set([phrase]);
    const receivedOptions: {
      value: Parameters<typeof jaccardTitleGrouping>[1] | undefined;
    } = { value: undefined };
    const plugin = (
      titles: readonly string[],
      options: Parameters<typeof jaccardTitleGrouping>[1]
    ) => {
      expect(titles).toEqual(['one', 'two']);
      receivedOptions.value = options;
      return [{ tabIndexes: [0, 1], confidence: 0.8 }];
    };

    groupTabsByTitle(tabs, {
      titleThreshold: 0.7,
      titleGroupingFunction: plugin,
      titleNormalizationFunction: normalizationFunction,
      titleTokenizationFunction: tokenizationFunction
    });

    expect(receivedOptions.value).toEqual({
      threshold: 0.7,
      normalizationFunction,
      tokenizationFunction
    });
  });

  it('maps title indexes back to tabs and preserves missing titles as empty strings', () => {
    const tabs = [
      { id: 1, title: undefined, url: 'https://a.com' },
      { id: 2, title: 'middle', url: 'https://b.com' },
      { id: 3, title: 'last', url: 'https://c.com' }
    ] as chrome.tabs.Tab[];
    const plugin = (titles: readonly string[]) => {
      expect(titles).toEqual(['', 'middle', 'last']);
      return [{ tabIndexes: [0, 2], confidence: 0.8 }];
    };

    const groups = groupTabsByTitle(tabs, { titleGroupingFunction: plugin });

    expect(groups).toHaveLength(1);
    expect(groups[0].tabs).toEqual([tabs[0], tabs[2]]);
  });

  it('accepts a pluggable candidate generator and deduplicates indexes', () => {
    const tabs = [
      { id: 1, title: 'one', url: 'https://a.com' },
      { id: 2, title: 'two', url: 'https://b.com' }
    ] as chrome.tabs.Tab[];
    const plugin = () => [
      { tabIndexes: [0, 1, 1], confidence: 0.8 },
      { tabIndexes: [0], confidence: 1 }
    ];
    const groups = groupTabsByTitle(tabs, { titleGroupingFunction: plugin });
    expect(groups).toHaveLength(1);
    expect(groups[0].tabs).toEqual([tabs[0], tabs[1]]);
  });

  it('preserves Jaccard as the default and accepts a confidence threshold of zero', () => {
    const tabs = [
      { id: 1, title: 'shared words', url: 'https://a.com' },
      { id: 2, title: 'shared words extra', url: 'https://b.com' }
    ] as chrome.tabs.Tab[];
    const defaults = getDefaultTitleGroupingConfig();
    expect(groupTabsByTitle(tabs, {}).length).toBe(
      jaccardTitleGrouping(
        tabs.map((tab) => tab.title ?? ''),
        {
          threshold: defaults.titleThreshold,
          normalizationFunction: defaults.titleNormalizationFunction,
          tokenizationFunction: defaults.titleTokenizationFunction
        }
      ).length
    );
    expect(
      groupTabsByTitle(tabs, { titleThreshold: 0, titleConfidenceThreshold: 0 })
    ).toHaveLength(1);
  });

  it('uses the configured normalization and tokenization functions in Jaccard grouping', () => {
    const tabs = [
      { id: 1, title: 'left title', url: 'https://a.com' },
      { id: 2, title: 'right title', url: 'https://b.com' }
    ] as chrome.tabs.Tab[];
    const normalizedTitles: string[] = [];
    const normalize = (phrase: string) => {
      normalizedTitles.push(phrase);
      return phrase;
    };
    const tokenize = (phrase: string) =>
      new Set([phrase.replace(/left|right/g, 'shared')]);
    const grouped = groupTabsByTitle(tabs, {
      titleThreshold: 1,
      titleConfidenceThreshold: 0,
      titleNormalizationFunction: normalize,
      titleTokenizationFunction: tokenize
    });

    expect(normalizedTitles).toEqual(['left title', 'right title']);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].tabs).toEqual(tabs);
  });

  it('supports overlapping topic groups and ignores stopwords', () => {
    const tabs = [
      { id: 1, title: 'california golden gate bridge', url: 'a' },
      { id: 2, title: 'california golden raisins', url: 'b' },
      { id: 3, title: 'electric gates', url: 'c' },
      { id: 4, title: 'Bill Gates and his legacy', url: 'd' },
      { id: 5, title: 'nginx and docker', url: 'e' },
      { id: 6, title: 'famous golden california beaches', url: 'f' }
    ] as chrome.tabs.Tab[];
    const groups = groupTabsByTitle(tabs, {
      titleGroupingFunction: informativeTokenTitleGrouping,
      titleThreshold: 0.2
    });
    const hasGroup = (left: number, right: number) =>
      groups.some((group) =>
        [left, right].every((id) => group.tabs.some((tab) => tab.id === id))
      );
    expect(hasGroup(1, 2)).toBe(true);
    expect(hasGroup(1, 3)).toBe(true);
    expect(hasGroup(1, 4)).toBe(true);
    expect(hasGroup(2, 6)).toBe(true);
    expect(hasGroup(5, 4)).toBe(false);
  });

  it('keeps the top five candidates and includes additional candidates over threshold', () => {
    const tabs = Array.from({ length: 8 }, (_, index) => ({
      id: index,
      title: `tab ${index}`,
      url: `https://${index}.com`
    })) as chrome.tabs.Tab[];
    const candidates: TitleGroupCandidate[] = Array.from({ length: 7 }, (_, index) => ({
      tabIndexes: [0, index + 1],
      confidence: index < 6 ? 0.9 : 0.4
    }));
    const groups = groupTabsByTitle(tabs, {
      titleGroupingFunction: () => candidates,
      titleConfidenceThreshold: 0.5
    });
    expect(groups).toHaveLength(6);
  });

  it('compares top-three pairwise precision for both heuristics', () => {
    const tabs = titleGroupingDataset.map(({ title }, id) => ({
      id,
      title,
      url: `https://example.com/${id}`
    })) as chrome.tabs.Tab[];
    const defaults = getDefaultTitleGroupingConfig();
    const options = {
      threshold: 0.3,
      normalizationFunction: defaults.titleNormalizationFunction,
      tokenizationFunction: defaults.titleTokenizationFunction
    };
    const titles = tabs.map((tab) => tab.title ?? '');
    const jaccardCandidates = jaccardTitleGrouping(titles, options);
    const informativeCandidates = informativeTokenTitleGrouping(titles, options);
    const jaccardScore = topThreeGroupPrecisionScore(
      jaccardCandidates,
      titleGroupingDataset
    );
    const informativeScore = topThreeGroupPrecisionScore(
      informativeCandidates,
      titleGroupingDataset
    );
    expect(jaccardScore).toBeGreaterThanOrEqual(0);
    expect(informativeScore).toBeGreaterThanOrEqual(0);
    expect(informativeScore).not.toBe(jaccardScore);
    const topResults = topThreeGroupResults(informativeCandidates, titleGroupingDataset);
    expect(topResults.length).toBeLessThanOrEqual(3);
    expect(topResults[0].titles.length).toBeGreaterThan(1);
    expect(topResults[0].precision).toBeGreaterThanOrEqual(0);
    expect(topResults[0].confidence).toBeGreaterThan(0);
  });

  it('handles 300 titles of up to 50 words', () => {
    const words = Array.from({ length: 50 }, (_, index) => `topic${index}`);
    const tabs = Array.from({ length: 300 }, (_, index) => ({
      id: index,
      title: `${words.join(' ')} article${index}`,
      url: `https://example.com/${index}`
    })) as chrome.tabs.Tab[];
    const groups = groupTabsByTitle(tabs, {
      titleGroupingFunction: informativeTokenTitleGrouping,
      titleThreshold: 0.5
    });
    expect(groups.length).toBeGreaterThan(0);
  });
});
