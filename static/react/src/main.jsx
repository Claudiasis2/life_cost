import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App, AppProviders } from '@/app';
import { GlobalErrorBoundary } from '@/shared/components';
import '@/app/styles/variables.css';
import '@/app/styles/globals.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <BrowserRouter>
        <AppProviders><App /></AppProviders>
      </BrowserRouter>
    </GlobalErrorBoundary>
  </StrictMode>,
);
