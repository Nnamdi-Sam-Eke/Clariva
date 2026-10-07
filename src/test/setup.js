import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: window.innerWidth <= 980 && query.includes('max-width: 980px'),
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  });
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.body.removeAttribute('data-role');
});
