import { describe, expect, it } from 'bun:test';
import {
  createTitleGroupingConfig,
  informativeTokenTitleGrouping,
  jaccardTitleGrouping
} from '../background/grouping-by-title';
import { normalizeTitleGroupingSettings } from '../scripts/title-grouping-settings';

describe('title grouping settings', () => {
  it('uses current defaults when no preferences are saved', () => {
    expect(normalizeTitleGroupingSettings(undefined)).toEqual({
      method: 'jaccard',
      threshold: 0.5,
      confidenceThreshold: 0.5
    });
  });

  it('maps preferences to the configured grouping function and thresholds', () => {
    expect(
      createTitleGroupingConfig({
        method: 'informative-token',
        threshold: 0.3,
        confidenceThreshold: 0.8
      })
    ).toMatchObject({
      titleGroupingFunction: informativeTokenTitleGrouping,
      titleThreshold: 0.3,
      titleConfidenceThreshold: 0.8
    });
    expect(createTitleGroupingConfig({ method: 'jaccard' }).titleGroupingFunction).toBe(
      jaccardTitleGrouping
    );
  });

  it('clamps thresholds to the supported range', () => {
    expect(
      normalizeTitleGroupingSettings({
        method: 'informative-token',
        threshold: 3,
        confidenceThreshold: -1
      })
    ).toEqual({
      method: 'informative-token',
      threshold: 1,
      confidenceThreshold: 0
    });
  });
});
