import type { TabGroup } from './tab-grouping';

/*
 * Purpose:
 *  - Groups tabs based on similarity of their page titles.
 *
 * Approach:
 *  - Strategies consume an ordered array of title strings and return indexes.
 *  - The entrypoint maps those indexes back to the original tabs.
 */

/* ---------------------------------------------------------
 * Interfaces
 * ------------------------------------------------------ */

export interface TitleGroupingConfig {
  titleThreshold?: number;
  titleConfidenceThreshold?: number;
  titleGroupingFunction?: TitleGroupingFunction;
  titleNormalizationFunction?: PhraseNormalizationFunction;
  titleTokenizationFunction?: PhraseTokenizationFunction;
}

export interface TitleGroupCandidate {
  tabIndexes: number[];
  confidence: number;
}

export interface TitleGroupingOptions {
  threshold: number;
  normalizationFunction: PhraseNormalizationFunction;
  tokenizationFunction: PhraseTokenizationFunction;
}

export type TitleGroupingFunction = (
  _titles: readonly string[],
  _options: TitleGroupingOptions
) => TitleGroupCandidate[];

export interface PhraseNormalizationFunction {
  (_phrase: string): string;
}

export interface PhraseTokenizationFunction {
  (_normalizedPhrase: string): Set<string>;
}

/* ---------------------------------------------------------
 * Normalization functions
 * ------------------------------------------------------ */

// simple suffix-based singularization
function simpleStemming(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && /(?:x|ch|sh|z)es$/.test(token)) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s') && !/(?:ss|us|is)$/.test(token)) {
    return token.slice(0, -1);
  }
  return token;
}

// lowercasing, remove accent marks, remove punctuation, singularization
const normalizePhraseDiacriticsAndInflections: PhraseNormalizationFunction = (title) =>
  title
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(simpleStemming)
    .join(' ');

/* ---------------------------------------------------------
 * Tokenizing functions
 * ------------------------------------------------------ */

const tokenizeTitle: PhraseTokenizationFunction = (normalizedTitle) =>
  new Set(normalizedTitle.split(/\s+/).filter(Boolean));

/* ---------------------------------------------------------
 * Filtering function
 * ------------------------------------------------------ */

const ignoredTitleTokens = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'because',
  'by',
  'for',
  'from',
  'how',
  'in',
  'is',
  'it',
  'maybe',
  'not',
  'of',
  'on',
  'or',
  'the',
  'to',
  'was',
  'what',
  'where',
  'who',
  'why',
  'with'
]);

// Super function, used by the new similarity kernel
function normalizeTokenizeAndFilterPhrase(title: string): Set<string> {
  const tokens = tokenizeTitle(normalizePhraseDiacriticsAndInflections(title));
  return new Set([...tokens].filter((token) => !ignoredTitleTokens.has(token)));
}

/* ---------------------------------------------------------
 * Similarity functions: Jaccard
 * ------------------------------------------------------ */

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionSize = 0;
  for (const token of setA) {
    if (setB.has(token)) intersectionSize += 1;
  }
  return intersectionSize / (setA.size + setB.size - intersectionSize);
}

/** Existing greedy Jaccard grouping, adapted to the pluggable strategy contract. */
export const jaccardTitleGrouping: TitleGroupingFunction = (titles, options) => {
  const { threshold, normalizationFunction, tokenizationFunction } = options;

  const tokenizedTitles = titles.map((title) =>
    tokenizationFunction(normalizationFunction(title))
  );
  const visited = new Array(titles.length).fill(false);
  const candidates: TitleGroupCandidate[] = [];

  for (let i = 0; i < titles.length; i += 1) {
    if (visited[i]) continue;
    const tabIndexes = [i];
    let totalSimilarity = 0;
    visited[i] = true;
    for (let j = i + 1; j < titles.length; j += 1) {
      if (visited[j]) continue;
      const similarity = jaccardSimilarity(tokenizedTitles[i], tokenizedTitles[j]);
      if (similarity >= threshold) {
        tabIndexes.push(j);
        totalSimilarity += similarity;
        visited[j] = true;
      }
    }
    if (tabIndexes.length > 1) {
      candidates.push({
        tabIndexes,
        confidence: totalSimilarity / (tabIndexes.length - 1)
      });
    }
  }
  return candidates;
};

/* ---------------------------------------------------------
 * Similarity functions: Informative Token
 * ------------------------------------------------------ */

/**
 * Forms overlapping topic candidates around informative title tokens.
 * Token * weights use inverse document frequency so common title words contribute less.
 */
export const informativeTokenTitleGrouping: TitleGroupingFunction = (titles, options) => {
  const { threshold } = options;
  const tokenizedTitles = titles.map(normalizeTokenizeAndFilterPhrase);
  const documentFrequency = new Map<string, number>();
  tokenizedTitles.forEach((tokens) => {
    tokens.forEach((token) => {
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    });
  });
  const tokenWeight = (token: string) =>
    Math.log(1 + titles.length / (1 + (documentFrequency.get(token) || 0)));
  const candidates: TitleGroupCandidate[] = [];

  for (let i = 0; i < titles.length; i += 1) {
    const anchors = tokenizedTitles[i];
    if (anchors.size === 0) continue;
    const matchedIndexes = [i];
    let totalScore = 0;
    for (let j = 0; j < titles.length; j += 1) {
      if (i === j) continue;
      const otherTokens = tokenizedTitles[j];
      let sharedWeight = 0;
      let anchorWeight = 0;
      let otherWeight = 0;
      anchors.forEach((token) => {
        const weight = tokenWeight(token);
        anchorWeight += weight;
        if (otherTokens.has(token)) sharedWeight += weight;
      });
      otherTokens.forEach((token) => {
        otherWeight += tokenWeight(token);
      });
      const overlapCoefficient = sharedWeight / Math.min(anchorWeight, otherWeight);
      if (sharedWeight > 0 && overlapCoefficient >= threshold) {
        matchedIndexes.push(j);
        totalScore += overlapCoefficient;
      }
    }
    if (matchedIndexes.length > 1) {
      candidates.push({
        tabIndexes: matchedIndexes,
        confidence: totalScore / (matchedIndexes.length - 1)
      });
    }
  }
  return candidates;
};

/* ---------------------------------------------------------
 * Entrypoint
 * ------------------------------------------------------ */

/**
 * Groups tabs using an injectable candidate generator. The default strategy
 * preserves the original Jaccard behavior; alternate strategies may overlap.
 */
function groupTabsByTitle(
  tabs: chrome.tabs.Tab[],
  config: TitleGroupingConfig = {}
): TabGroup[] {
  const defaults = getDefaultTitleGroupingConfig();
  const confidenceThreshold =
    config.titleConfidenceThreshold ?? defaults.titleConfidenceThreshold;
  const groupingFunction = config.titleGroupingFunction ?? defaults.titleGroupingFunction;
  const options: TitleGroupingOptions = {
    threshold: config.titleThreshold ?? defaults.titleThreshold,
    normalizationFunction:
      config.titleNormalizationFunction ?? defaults.titleNormalizationFunction,
    tokenizationFunction:
      config.titleTokenizationFunction ?? defaults.titleTokenizationFunction
  };

  const uniqueCandidates = new Map<string, TitleGroupCandidate>();
  const titles = tabs.map((tab) => tab.title ?? '');

  groupingFunction(titles, options).forEach((candidate) => {
    const { tabIndexes, confidence } = candidate;
    if (
      tabIndexes.length < 2 ||
      !Number.isFinite(confidence) ||
      !tabIndexes.every(
        (index) => Number.isInteger(index) && index >= 0 && index < tabs.length
      )
    ) {
      return;
    }
    const normalizedIndexes = [...new Set(tabIndexes)].sort((a, b) => a - b);
    if (normalizedIndexes.length < 2) return;
    const key = normalizedIndexes.join(',');
    if (
      key &&
      (!uniqueCandidates.has(key) || uniqueCandidates.get(key)!.confidence < confidence)
    ) {
      uniqueCandidates.set(key, { tabIndexes: key.split(',').map(Number), confidence });
    }
  });

  const candidates = [...uniqueCandidates.values()].sort(
    (a, b) => b.confidence - a.confidence
  );
  const selected = candidates.filter(
    (candidate, index) => index < 5 || candidate.confidence > confidenceThreshold
  );

  return selected.map(({ tabIndexes }) => ({
    name: '?',
    tabs: [...new Set(tabIndexes)].map((index) => tabs[index])
  }));
}

/* ---------------------------------------------------------
 * Configuration
 * ------------------------------------------------------ */

/** Returns a fresh config containing the default title grouping options. */
export function getDefaultTitleGroupingConfig(): Required<TitleGroupingConfig> {
  return {
    titleThreshold: 0.5,
    titleConfidenceThreshold: 0.5,
    titleGroupingFunction: jaccardTitleGrouping,
    titleNormalizationFunction: normalizePhraseDiacriticsAndInflections,
    titleTokenizationFunction: tokenizeTitle
  };
}

export { groupTabsByTitle };
