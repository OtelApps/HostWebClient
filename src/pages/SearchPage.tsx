import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon } from 'lucide-react';

import { PageHeader } from '../components/ui/PageHeader';
import { EmptyBlock, LoadingBlock } from '../components/ui/Button';
import { useLoginPrompt } from '../contexts/LoginPromptContext';
import { fetchHotelInfoTopics } from '../services/supabase/hotelInfo';
import { fetchHotelRoomTypes } from '../services/supabase/rooms';
import { fetchVenues } from '../services/supabase/restaurants';
import { fetchWellnessFacilities } from '../services/supabase/wellness';
import { fetchFitnessFacilities } from '../services/supabase/fitness';

type Hit = {
  id: string;
  title: string;
  path: string;
  protected?: boolean;
};

function norm(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function SearchPage() {
  const { t } = useTranslation();
  const { tryProtectedPath } = useLoginPrompt();
  const [query, setQuery] = useState('');
  const info = useQuery({ queryKey: ['hotel-info'], queryFn: fetchHotelInfoTopics });
  const rooms = useQuery({ queryKey: ['rooms'], queryFn: fetchHotelRoomTypes });
  const venues = useQuery({ queryKey: ['venues'], queryFn: fetchVenues });
  const wellness = useQuery({ queryKey: ['wellness'], queryFn: fetchWellnessFacilities });
  const fitness = useQuery({ queryKey: ['fitness'], queryFn: fetchFitnessFacilities });

  const loading =
    info.isLoading || rooms.isLoading || venues.isLoading || wellness.isLoading || fitness.isLoading;

  const hits = useMemo(() => {
    const modules: Hit[] = [
      { id: 'info', title: t('hotelInfo'), path: '/info' },
      { id: 'rooms', title: t('roomsOffer'), path: '/rooms' },
      { id: 'parking', title: t('parking'), path: '/parking' },
      { id: 'restaurants', title: t('restaurantsBars'), path: '/restaurants' },
      { id: 'wellness', title: t('wellnessSpa'), path: '/wellness' },
      { id: 'fitness', title: t('gymSport'), path: '/fitness' },
      { id: 'program', title: t('hotelProgram'), path: '/program' },
      { id: 'map', title: t('pragueMapTitle'), path: '/map' },
      { id: 'transport', title: t('transport'), path: '/transport' },
      { id: 'chat', title: t('chat'), path: '/chat' },
      { id: 'requests', title: t('requests'), path: '/requests', protected: true },
      { id: 'housekeeping', title: t('housekeeping'), path: '/requests/housekeeping', protected: true },
      { id: 'supplies', title: t('suppliesShort'), path: '/requests/supplies', protected: true },
      { id: 'maintenance', title: t('maintenanceShort'), path: '/requests/maintenance', protected: true },
      { id: 'room-service', title: t('roomServiceShort'), path: '/requests/room-service', protected: true },
    ];

    const catalog: Hit[] = [
      ...(info.data ?? []).map((row) => ({
        id: `info-${row.slug}`,
        title: row.title,
        path: `/info/${row.slug}`,
      })),
      ...(rooms.data ?? []).map((row) => ({
        id: `room-${row.slug}`,
        title: row.title,
        path: `/rooms/${row.slug}`,
      })),
      ...(venues.data ?? []).map((row) => ({
        id: `venue-${row.slug}`,
        title: row.title,
        path: `/restaurants/${row.slug}`,
      })),
      ...(wellness.data ?? []).map((row) => ({
        id: `wellness-${row.slug}`,
        title: row.title,
        path: `/wellness/${row.slug}`,
      })),
      ...(fitness.data ?? []).map((row) => ({
        id: `fitness-${row.slug}`,
        title: row.title,
        path: `/fitness/${row.slug}`,
      })),
    ];

    const all = [...modules, ...catalog];
    const q = norm(query.trim());
    if (!q) return all.slice(0, 16);
    return all.filter((hit) => norm(hit.title).includes(q));
  }, [fitness.data, info.data, query, rooms.data, t, venues.data, wellness.data]);

  return (
    <div>
      <PageHeader title={t('search')} backTo="/" />
      <label className="relative block">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          className="w-full rounded-2xl border border-line bg-white py-3 pl-10 pr-4"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <p className="mt-2 text-xs text-muted">{t('searchHint')}</p>
      {loading ? <LoadingBlock /> : null}
      {!loading && hits.length === 0 ? <EmptyBlock message={t('searchEmpty')} /> : null}
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {hits.map((hit) => (
          <li key={hit.id}>
            {hit.protected ? (
              <button
                type="button"
                className="block w-full px-4 py-3 text-left hover:bg-gray-50"
                onClick={() => tryProtectedPath(hit.path)}
              >
                {hit.title}
              </button>
            ) : (
              <Link to={hit.path} className="block px-4 py-3 hover:bg-gray-50">
                {hit.title}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
