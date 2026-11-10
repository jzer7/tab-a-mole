import type { TitleGroupingMethod } from '../background/grouping-by-title';

export const titleGroupingSettingsKey = 'titleGroupingSettings';

export interface TitleGroupingSettings {
  method: TitleGroupingMethod;
  threshold: number;
  confidenceThreshold: number;
}

export function normalizeTitleGroupingSettings(
  value: Partial<TitleGroupingSettings> | undefined
): TitleGroupingSettings {
  const clamp = (candidate: unknown, fallback: number) =>
    typeof candidate === 'number' && Number.isFinite(candidate)
      ? Math.max(0, Math.min(1, candidate))
      : fallback;

  return {
    method: value?.method === 'informative-token' ? 'informative-token' : 'jaccard',
    threshold: clamp(value?.threshold, 0.5),
    confidenceThreshold: clamp(value?.confidenceThreshold, 0.5)
  };
}
