const { applyTheme } = require('./theme-utils');

describe('applyTheme', () => {
  let root;
  let prefersDark;

  beforeEach(() => {
    root = {
      setAttribute: jest.fn(),
      style: {}
    };
    prefersDark = { matches: false };
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
    prefersDark.matches = true;
    applyTheme('system', root, prefersDark);
    expect(root.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    expect(root.style.colorScheme).toBe('dark');
  });

  it('applies system theme as light if prefersDark is false', () => {
    prefersDark.matches = false;
    applyTheme('system', root, prefersDark);
    expect(root.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    expect(root.style.colorScheme).toBe('light');
  });
});
