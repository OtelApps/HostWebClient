import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { isAnyModuleEnabled, isModuleEnabled } from '../lib/modules';
import { getHotelSlug } from '../lib/hotel';
import { fetchHotelPublicConfig, type HotelPublicConfig } from '../services/hotelConfig';

type ModulesContextValue = {
  config: HotelPublicConfig | null;
  ready: boolean;
  loading: boolean;
  error: boolean;
  reload: () => void;
  isEnabled: (module: string) => boolean;
  isAnyEnabled: (modules: readonly string[]) => boolean;
};

const ModulesContext = createContext<ModulesContextValue>({
  config: null,
  ready: false,
  loading: true,
  error: false,
  reload: () => undefined,
  isEnabled: () => false,
  isAnyEnabled: () => false,
});

export function ModulesProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ['hotel-public-config', getHotelSlug()],
    queryFn: fetchHotelPublicConfig,
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const value = useMemo<ModulesContextValue>(() => {
    const config = query.data ?? null;
    return {
      config,
      ready: Boolean(config),
      loading: query.isPending || (query.isFetching && !config),
      error: !config && !query.isPending && !query.isFetching,
      reload: () => {
        void query.refetch();
      },
      isEnabled: (module: string) => isModuleEnabled(config?.modules, module),
      isAnyEnabled: (modules: readonly string[]) => isAnyModuleEnabled(config?.modules, modules),
    };
  }, [query]);

  return <ModulesContext.Provider value={value}>{children}</ModulesContext.Provider>;
}

export function useHotelModules(): ModulesContextValue {
  return useContext(ModulesContext);
}
