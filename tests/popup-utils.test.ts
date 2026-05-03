// tests/popup-utils.test.js

import { describe, it, expect, beforeEach, vi } from 'bun:test';
import {
  renderTabGroups,
  changeResultState,
  type Callbacks,
  type Group
} from '../popup/popup-utils';

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
    callbacks: Callbacks;

  beforeEach(() => {
    // Set up jsdom global environment
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
    globalThis.window = dom.window as unknown as Window & typeof globalThis;
    globalThis.document = dom.window.document;

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
    const groups: Group[] = [
      {
        criteria: 'example.com',
        tabInfos: [
          {
            id: 1,
            url: 'https://example.com',
            title: 'Example',
            pinned: false,
            lastAccessed: Date.now(),
            elapsed: 1000
          },
          {
            id: 2,
            url: 'https://example.com/page',
            title: 'Page',
            pinned: true,
            lastAccessed: Date.now(),
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
            lastAccessed: Date.now(),
            elapsed: 3000
          }
        ]
      }
    ];

    renderTabGroups(groups, anchor, groupTemplate, itemTemplate, callbacks);

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
    (firstGroup!.querySelector('.tab-group__goto-first') as HTMLElement).click();
    (firstGroup!.querySelector('.tab-group__close-all') as HTMLElement).click();

    expect(callbacks.onGoToFirstTab).toHaveBeenCalled();
    expect(callbacks.onCloseAllTabs).toHaveBeenCalled();
  });

  it('calls changeResultState(NO_DUPLICATES) when groups is empty', () => {
    renderTabGroups([], anchor, groupTemplate, itemTemplate, callbacks);

    const noDuplicates = document.getElementById('NO_DUPLICATES');
    const duplicateList = document.getElementById('duplicateList');
    expect(noDuplicates?.hidden).toBe(false);
    expect(duplicateList?.hidden).toBe(true);
  });

  it('renders pinned tab with pin symbol', () => {
    const groups: Group[] = [
      {
        criteria: 'pinned-test',
        tabInfos: [
          {
            id: 1,
            url: 'https://example.com',
            title: 'Pinned',
            pinned: true,
            lastAccessed: Date.now(),
            elapsed: 0
          },
          {
            id: 2,
            url: 'https://example.com/page',
            title: 'Normal',
            pinned: false,
            lastAccessed: Date.now(),
            elapsed: 0
          }
        ]
      }
    ];

    renderTabGroups(groups, anchor, groupTemplate, itemTemplate, callbacks);

    const symbols = anchor.querySelectorAll('.tab-symbol');
    const pinnedSymbol = [...symbols].find((el) => el.textContent === '📌');
    expect(pinnedSymbol).toBeDefined();
  });

  it('renders elapsed time when provided', () => {
    const groups: Group[] = [
      {
        criteria: 'elapsed-test',
        tabInfos: [
          {
            id: 1,
            url: 'https://example.com',
            title: 'Tab A',
            pinned: false,
            lastAccessed: Date.now(),
            elapsed: 60000 // 1 minute in ms
          },
          {
            id: 2,
            url: 'https://example.com/b',
            title: 'Tab B',
            pinned: false,
            lastAccessed: Date.now(),
            elapsed: 0
          }
        ]
      }
    ];

    renderTabGroups(groups, anchor, groupTemplate, itemTemplate, callbacks);

    const elapsedSpans = anchor.querySelectorAll('.tab-elapsed');
    const filledElapsed = [...elapsedSpans].find((el) => el.textContent !== '');
    expect(filledElapsed).toBeDefined();
  });

  it('renders group criteria and count correctly', () => {
    const groups: Group[] = [
      {
        criteria: 'my-criteria',
        tabInfos: [
          {
            id: 1,
            url: 'https://example.com',
            title: 'A',
            pinned: false,
            lastAccessed: Date.now(),
            elapsed: 0
          },
          {
            id: 2,
            url: 'https://example.com/b',
            title: 'B',
            pinned: false,
            lastAccessed: Date.now(),
            elapsed: 0
          }
        ]
      }
    ];

    renderTabGroups(groups, anchor, groupTemplate, itemTemplate, callbacks);

    const keySpan = anchor.querySelector('.tab-group__key');
    const countSpan = anchor.querySelector('.tab-group__count');
    expect(keySpan?.textContent).toBe('my-criteria');
    expect(countSpan?.textContent).toBe('2');
  });
});

describe('changeResultState', () => {
  beforeEach(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
    globalThis.window = dom.window as unknown as Window & typeof globalThis;
    globalThis.document = dom.window.document;

    document.body.innerHTML = `
      <div id="startSearch"></div>
      <div id="loadingMessage"></div>
      <div id="errorMessage"></div>
      <div id="noDuplicatesMessage"></div>
      <div id="duplicateList"><div id="resultsLiveRegion"></div></div>
    `;
  });

  it('shows the target state element and hides all others', () => {
    changeResultState('loadingMessage');

    expect((document.getElementById('loadingMessage') as HTMLElement).hidden).toBe(false);
    expect((document.getElementById('startSearch') as HTMLElement).hidden).toBe(true);
    expect((document.getElementById('errorMessage') as HTMLElement).hidden).toBe(true);
    expect((document.getElementById('noDuplicatesMessage') as HTMLElement).hidden).toBe(
      true
    );
    expect((document.getElementById('duplicateList') as HTMLElement).hidden).toBe(true);
  });

  it('shows noDuplicatesMessage and clears duplicateList children', () => {
    // Add an extra child that should be cleared
    const extra = document.createElement('div');
    extra.id = 'extra-child';
    document.getElementById('duplicateList')!.appendChild(extra);

    changeResultState('noDuplicatesMessage');

    expect((document.getElementById('noDuplicatesMessage') as HTMLElement).hidden).toBe(
      false
    );
    // The extra child should be removed (not DUPLICATES_FOUND state)
    expect(document.getElementById('extra-child')).toBeNull();
    // resultsLiveRegion should be preserved
    expect(document.getElementById('resultsLiveRegion')).not.toBeNull();
  });

  it('does not clear duplicateList when state is duplicateList (DUPLICATES_FOUND)', () => {
    const extra = document.createElement('div');
    extra.id = 'extra-result';
    document.getElementById('duplicateList')!.appendChild(extra);

    changeResultState('duplicateList');

    expect((document.getElementById('duplicateList') as HTMLElement).hidden).toBe(false);
    // Children should NOT be cleared when showing results
    expect(document.getElementById('extra-result')).not.toBeNull();
  });
});
