import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useHotelModules } from '../../contexts/ModulesContext';
import { ErrorBlock, LoadingBlock } from './Button';

export function ConfigGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { ready, loading, error, reload } = useHotelModules();

  if (ready) {
    return children;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      {loading || !error ? (
        <LoadingBlock />
      ) : (
        <ErrorBlock message={t('configUnavailable')} onRetry={reload} />
      )}
    </div>
  );
}
