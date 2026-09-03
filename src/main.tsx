import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import { ConfigGate } from './components/ui/ConfigGate';
import { AuthProvider } from './contexts/AuthContext';
import { ModulesProvider } from './contexts/ModulesContext';
import { ServiceRequestProvider } from './contexts/ServiceRequestContext';
import { ensureHotelPath } from './lib/hotel';
import './i18n';
import './index.css';

if (ensureHotelPath()) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ModulesProvider>
            <ConfigGate>
              <ServiceRequestProvider>
                <App />
              </ServiceRequestProvider>
            </ConfigGate>
          </ModulesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}
