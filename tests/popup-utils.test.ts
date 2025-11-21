// tests/popup-utils.test.js

import { describe, it, expect, beforeEach, vi } from 'bun:test';
import { renderTabGroups } from '../popup/popup-utils';

// Setup jsdom for DOM APIs
import { JSDOM } from 'jsdom';

// Helper to create a mock template element
function createGroupTemplate() {
  const template = document.createElement('template');
  template.innerHTML = `
    <section class="tab-group">
      <span class="tab-group__key"></span>
      <span class="tab-group__count"></span>
      <button class="tab-group__goto-first"></button>
      <button class="tab-group__close-all"></button>
      <ul class="tab-list"></ul>
    </section>
  `;
  return template;
}

function createItemTemplate() {
  const template = document.createElement('template');
  template.innerHTML = `
    <li>
      <span class="tab-symbol"></span>
      <span class="tab-title"></span>
      <span class="tab-elapsed"></span>
      <button class="tab-goto"><span class="sr-only"></span></button>
      <button class="tab-close"><span class="sr-only"></span></button>
    </li>
  `;
  return template;
}

describe('renderTabGroups', () => {
  let anchor: HTMLElement,
    groupTemplate: HTMLTemplateElement,
    itemTemplate: HTMLTemplateElement,
    callbacks: any;

  beforeEach(() => {
    // Set up jsdom global environment
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
    globalThis.window = dom.window as any;
    globalThis.document = dom.window.document as any;

    // Set up DOM anchor
    anchor = document.createElement('div');
    // Set up templates
    groupTemplate = createGroupTemplate() as HTMLTemplateElement;
    itemTemplate = createItemTemplate() as HTMLTemplateElement;
    // Set up callbacks
    callbacks = {
      onGoToTab: vi.fn(),
      onCloseTab: vi.fn(),
      onGoToFirstTab: vi.fn(),
      onCloseAllTabs: vi.fn()
    };
    // Add required result state elements to DOM
    document.body.innerHTML = `
      <div id="DUPLICATES_FOUND"></div>
      <div id="NO_DUPLICATES"></div>
      <div id="duplicateList"></div>
    `;
  });

  it('renders groups and tabs, and wires up callbacks', () => {
    const groups = [
      {
        criteria: 'example.com',
        tabInfos: [
          {
            id: 1,
            url: 'https://example.com',
            title: 'Example',
            pinned: false,
            elapsed: 1000
          },
          {
            id: 2,
            url: 'https://example.com/page',
            title: 'Page',
            pinned: true,
            elapsed: 2000
          }
        ]
      },
      {
        criteria: 'test.com',
        tabInfos: [
          {
            id: 3,
            url: 'https://test.com',
            title: 'Test',
            pinned: false,
            elapsed: 3000
          }
        ]
      }
    ];

    renderTabGroups(
      groups as any,
      anchor,
      groupTemplate,
      itemTemplate,
      callbacks
    );

    // Check that two groups were rendered
    expect(anchor.querySelectorAll('.tab-group').length).toBe(2);

    // Check that the correct number of tabs were rendered
    expect(anchor.querySelectorAll('.tab-list li').length).toBe(3);

    // Simulate clicking the first tab's goto and close buttons
    const firstTab = anchor.querySelector('.tab-list li');
    (firstTab!.querySelector('.tab-goto') as HTMLElement).click();
    (firstTab!.querySelector('.tab-close') as HTMLElement).click();

    expect(callbacks.onGoToTab).toHaveBeenCalled();
    expect(callbacks.onCloseTab).toHaveBeenCalled();

    // Simulate clicking group-level buttons
    const firstGroup = anchor.querySelector('.tab-group');
    (
      firstGroup!.querySelector('.tab-group__goto-first') as HTMLElement
    ).click();
    (firstGroup!.querySelector('.tab-group__close-all') as HTMLElement).click();

    expect(callbacks.onGoToFirstTab).toHaveBeenCalled();
    expect(callbacks.onCloseAllTabs).toHaveBeenCalled();
  });
});
