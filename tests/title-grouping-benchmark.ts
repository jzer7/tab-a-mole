/**
 * Benchmark helpers use a small hand-labeled fixture of 12 titles across
 * containers, California, Gates, and pets topics. Titles sharing any topic are
 * considered related; the California/Gates bridge title has both labels, so it
 * can be relevant to groups from either topic.
 */
import type { TitleGroupCandidate } from '../background/grouping-by-title';
import type { LabeledTitle } from './fixtures/title-grouping-dataset';

export function pairwiseGroupPrecision(
  candidate: TitleGroupCandidate,
  titles: LabeledTitle[]
): number {
  let possiblePairs = 0;
  let relatedPairs = 0;
  for (let left = 0; left < candidate.tabIndexes.length; left += 1) {
    for (let right = left + 1; right < candidate.tabIndexes.length; right += 1) {
      const leftTitle = titles[candidate.tabIndexes[left]];
      const rightTitle = titles[candidate.tabIndexes[right]];
      if (!leftTitle || !rightTitle) continue;
      possiblePairs += 1;
      if (leftTitle.topics.some((topic) => rightTitle.topics.includes(topic))) {
        relatedPairs += 1;
      }
    }
  }
  return possiblePairs === 0 ? 0 : relatedPairs / possiblePairs;
}

export interface BenchmarkGroupResult {
  titles: string[];
  precision: number;
  confidence: number;
}

export function topThreeGroupResults(
  candidates: TitleGroupCandidate[],
  titles: LabeledTitle[]
): BenchmarkGroupResult[] {
  return candidates
    .filter((candidate) => candidate.tabIndexes.length > 1)
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 3)
    .map((candidate) => ({
      titles: candidate.tabIndexes
        .map((index) => titles[index]?.title)
        .filter((title): title is string => title !== undefined),
      precision: pairwiseGroupPrecision(candidate, titles),
      confidence: candidate.confidence
    }));
}

export function topThreeGroupPrecisionScore(
  candidates: TitleGroupCandidate[],
  titles: LabeledTitle[]
): number {
  return topThreeGroupResults(candidates, titles).reduce(
    (total, result) => total + result.precision,
    0
  );
}
