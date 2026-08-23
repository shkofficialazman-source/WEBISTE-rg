// Ensure window.fetch can be safely assigned to even in sandboxed environments with getter-only descriptors
if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  try {
    const originalFetch = window.fetch.bind(window);
    let activeFetch = originalFetch;
    Object.defineProperty(window, 'fetch', {
      get() {
        return activeFetch;
      },
      set(fn) {
        if (typeof fn === 'function') {
          activeFetch = fn;
        }
      },
      configurable: true,
      enumerable: true,
    });
  } catch (_e) {
    // Ignore descriptor define errors if already non-configurable
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

