import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useHotelModules } from '../../contexts/ModulesContext';

type ModuleRouteProps = {
  module: string | string[];
  mode?: 'all' | 'any';
  children: ReactNode;
};

export function ModuleRoute({ module, mode = 'all', children }: ModuleRouteProps) {
  const { ready, isEnabled, isAnyEnabled } = useHotelModules();

  if (!ready) {
    return null;
  }

  const keys = Array.isArray(module) ? module : [module];
  const allowed = mode === 'any' ? isAnyEnabled(keys) : keys.every((key) => isEnabled(key));
  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}
