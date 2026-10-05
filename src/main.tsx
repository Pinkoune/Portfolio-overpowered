import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/instrument-sans/wght.css';
import '@fontsource-variable/martian-mono/wdth.css';
import './design/tokens.css';
import './ui/global.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
