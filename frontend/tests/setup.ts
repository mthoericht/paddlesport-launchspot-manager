import { vi } from 'vitest';

// Mock window.location – nur in happy-dom/jsdom; in echtem Browser (Storybook) nicht redefinierbar
try
{
  Object.defineProperty(window, 'location', {
    value: {
      href: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn()
    },
    writable: true,
    configurable: true
  });
}
catch
{
  // location bereits definiert (z.B. Playwright-Browser) – überspringen
}

// Mock window.open
window.open = vi.fn();

// Mock navigator
try
{
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    writable: true,
    configurable: true
  });
}
catch
{
  // userAgent bereits definiert – überspringen
}

