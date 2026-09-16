import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement matchMedia. ThemeProvider reads it on mount to fall back to
// the system preference, so every test that renders it (directly or via AppShell) needs
// this — without it, `window.matchMedia is not a function` fails before any assertion runs.
window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList
