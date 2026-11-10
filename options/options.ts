import {
  normalizeTitleGroupingSettings,
  titleGroupingSettingsKey
} from '../scripts/title-grouping-settings';
import type { TitleGroupingSettings } from '../scripts/title-grouping-settings';

const form = document.getElementById('settingsForm') as HTMLFormElement;
const methodInput = document.getElementById('groupingMethod') as HTMLSelectElement;
const thresholdInput = document.getElementById('threshold') as HTMLInputElement;
const confidenceInput = document.getElementById(
  'confidenceThreshold'
) as HTMLInputElement;
const saveStatus = document.getElementById('saveStatus') as HTMLParagraphElement;

chrome.storage.local.get(titleGroupingSettingsKey, (stored) => {
  const settings = normalizeTitleGroupingSettings(
    stored[titleGroupingSettingsKey] as Partial<TitleGroupingSettings> | undefined
  );
  methodInput.value = settings.method;
  thresholdInput.value = String(settings.threshold);
  confidenceInput.value = String(settings.confidenceThreshold);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  saveStatus.textContent = '';

  const threshold = thresholdInput.valueAsNumber;
  const confidenceThreshold = confidenceInput.valueAsNumber;
  if (!Number.isFinite(threshold) || !Number.isFinite(confidenceThreshold)) {
    saveStatus.textContent = 'Enter a valid number for each threshold.';
    return;
  }

  const settings = normalizeTitleGroupingSettings({
    method: methodInput.value === 'informative-token' ? 'informative-token' : 'jaccard',
    threshold,
    confidenceThreshold
  });
  thresholdInput.value = String(settings.threshold);
  confidenceInput.value = String(settings.confidenceThreshold);

  chrome.storage.local.set({ [titleGroupingSettingsKey]: settings }, () => {
    saveStatus.textContent = chrome.runtime.lastError
      ? 'Could not save settings. Please try again.'
      : 'Settings saved.';
  });
});
