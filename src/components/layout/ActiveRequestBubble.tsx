import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';

import { useServiceRequests } from '../../contexts/ServiceRequestContext';
import { StatusBadge } from '../ui/StatusBadge';

const SERVICE_PATHS = new Set([
  'housekeeping',
  'supplies',
  'maintenance',
  'room-service',
]);

function isRequestDetailPath(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  return parts[0] === 'requests' && Boolean(parts[1]) && !SERVICE_PATHS.has(parts[1]);
}

export function ActiveRequestBubble() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { activeRequests } = useServiceRequests();
  const latest = activeRequests[0];

  if (!latest) return null;
  if (pathname === '/signin' || pathname.startsWith('/signin')) return null;
  if (isRequestDetailPath(pathname)) return null;

  return (
    <Link
      to={`/requests/${latest.id}`}
      className="fixed bottom-24 right-4 z-40 flex max-w-[min(18rem,calc(100vw-2rem))] items-center gap-3 rounded-full border border-primary/20 bg-white py-2 pl-2 pr-4 shadow-lg md:bottom-6"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-primary text-white">
        <Bell className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-primary">
          {t('activeRequestBubble')}
          {activeRequests.length > 1 ? ` · ${activeRequests.length}` : ''}
        </span>
        <span className="block truncate text-sm font-medium text-header">{latest.request_text}</span>
      </span>
      <StatusBadge status={latest.status} />
    </Link>
  );
}
