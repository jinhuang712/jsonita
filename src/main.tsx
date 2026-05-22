import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initI18n } from './i18n';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('root element not found');

// i18n 必须在 React mount 前 init 完成 ── 否则首屏会闪 raw key
await initI18n();

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
