import { describe, it, expect, beforeEach, jest } from 'bun:test';
import { applyTheme } from '../scripts/theme-utils';

describe('applyTheme', () => {
  let root: HTMLElement;
  let prefersDark: boolean;

  beforeEach(() => {
    // Create a mock HTMLElement
    root = document.createElement('div');
    jest.spyOn(root, 'setAttribute');
    prefersDark = false;
  });

  it('applies light theme', () => {
    applyTheme('light', root, prefersDark);
    expect(root.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    expect(root.style.colorScheme).toBe('light');
  });

  it('applies dark theme', () => {
    applyTheme('dark', root, prefersDark);
    expect(root.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    expect(root.style.colorScheme).toBe('dark');
  });

  it('applies system theme as dark if prefersDark is true', () => {
    prefersDark = true;
    applyTheme('system', root, prefersDark);
    expect(root.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    expect(root.style.colorScheme).toBe('dark');
  });

  it('applies system theme as light if prefersDark is false', () => {
    prefersDark = false;
    applyTheme('system', root, prefersDark);
    expect(root.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    expect(root.style.colorScheme).toBe('light');
  });
});
