/**
 * Benchmarks both title grouping strategies on a seeded synthetic dataset.
 *
 * The dataset has:
 *    100 shuffled random words:
 *       50% are 5–7 characters,
 *       30% are 8–10, and
 *       20% are 11–15.
 *    300 phrases:
 *       50% have 8–10 words from the first 30 source words,
 *       30% have 10–12 words from the first 50, and
 *       20% have 10–20 words from all 100.
 * The seed makes runs reproducible.
 */
import {
  informativeTokenTitleGrouping,
  jaccardTitleGrouping,
  type TitleGroupCandidate
} from '../background/grouping-by-title';

const wordCount = 100;
const phraseCount = 300;
const runs = 5;
const randomSeed = 0x5eed;
const defaultThreshold = 0.2;

type Random = () => number;

function createRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomWord(length: number, random: Random): string {
  let word = '';
  for (let index = 0; index < length; index += 1) {
    word += String.fromCharCode(97 + Math.floor(random() * 26));
  }
  return word;
}

function generateWords(random: Random): string[] {
  const lengths = [
    ...Array.from({ length: wordCount * 0.5 }, () => 5 + Math.floor(random() * 3)),
    ...Array.from({ length: wordCount * 0.3 }, () => 8 + Math.floor(random() * 3)),
    ...Array.from({ length: wordCount * 0.2 }, () => 11 + Math.floor(random() * 5))
  ];
  const words = new Set<string>();

  for (const length of shuffle(lengths, random)) {
    let word = randomWord(length, random);
    while (words.has(word)) {
      word = randomWord(length, random);
    }
    words.add(word);
  }

  return [...words];
}

function shuffle<T>(values: T[], random: Random): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function pickUniqueWords(pool: string[], count: number, random: Random): string[] {
  const words: string[] = [];
  const available = [...pool];
  while (words.length < count) {
    const index = Math.floor(random() * available.length);
    words.push(available.splice(index, 1)[0]!);
  }
  return words;
}

function generateDataset(seed: number): string[] {
  const random = createRandom(seed);
  const words = shuffle(generateWords(random), random);
  const phrases: string[] = [];

  for (let index = 0; index < phraseCount; index += 1) {
    const distribution = index / phraseCount;
    const poolSize = distribution < 0.5 ? 30 : distribution < 0.8 ? 50 : 100;
    const length =
      distribution < 0.5
        ? 8 + Math.floor(random() * 3)
        : distribution < 0.8
          ? 10 + Math.floor(random() * 3)
          : 10 + Math.floor(random() * 11);
    phrases.push(pickUniqueWords(words.slice(0, poolSize), length, random).join(' '));
  }
  return phrases;
}

function coveredPhraseCount(candidates: TitleGroupCandidate[]): number {
  const topGroups = [...candidates]
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 3);
  return new Set(topGroups.flatMap((group) => group.tabIndexes)).size;
}

function parseThreshold(args: string[]): number {
  const thresholdIndex = args.indexOf('--threshold');
  if (thresholdIndex === -1) return defaultThreshold;
  const threshold = Number(args[thresholdIndex + 1]);
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw new Error('--threshold must be a number from 0 to 1');
  }
  return threshold;
}

function benchmark(
  name: string,
  groupingFunction: typeof jaccardTitleGrouping,
  phrases: string[],
  threshold: number
): void {
  console.log(`\n${name}`);
  for (let run = 1; run <= runs; run += 1) {
    const tabs = phrases.map((title) => ({ title }) as chrome.tabs.Tab);
    const started = performance.now();
    const groups = groupingFunction(tabs, { threshold });
    const elapsedMs = performance.now() - started;
    console.log(
      `Run ${run}: ${elapsedMs.toFixed(2)} ms; top-three phrase coverage: ${coveredPhraseCount(groups)}/${phrases.length}; groups: ${groups.length}`
    );
  }
}

const threshold = parseThreshold(Bun.argv.slice(2));
const phrases = generateDataset(randomSeed);
console.log(
  `Synthetic title grouping benchmark (${phraseCount} phrases, seed ${randomSeed}, threshold ${threshold})`
);
benchmark('Jaccard', jaccardTitleGrouping, phrases, threshold);
benchmark('Informative-token overlap', informativeTokenTitleGrouping, phrases, threshold);
