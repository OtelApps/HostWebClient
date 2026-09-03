import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon } from 'lucide-react';

import { PageHeader } from '../components/ui/PageHeader';
import { EmptyBlock, LoadingBlock } from '../components/ui/Button';
import { useLoginPrompt } from '../contexts/LoginPromptContext';
import { useHotelModules } from '../contexts/ModulesContext';
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
  module?: string;
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
  const { isEnabled } = useHotelModules();
  const [query, setQuery] = useState('');
  const info = useQuery({
    queryKey: ['hotel-info'],
    queryFn: fetchHotelInfoTopics,
    enabled: isEnabled('hotel_info'),
  });
  const rooms = useQuery({
    queryKey: ['rooms'],
    queryFn: fetchHotelRoomTypes,
    enabled: isEnabled('hotel_rooms'),
  });
  const venues = useQuery({
    queryKey: ['venues'],
    queryFn: fetchVenues,
    enabled: isEnabled('restaurants_bars'),
  });
  const wellness = useQuery({
    queryKey: ['wellness'],
    queryFn: fetchWellnessFacilities,
    enabled: isEnabled('wellness_spa'),
  });
  const fitness = useQuery({
    queryKey: ['fitness'],
    queryFn: fetchFitnessFacilities,
    enabled: isEnabled('sports'),
  });

  const loading =
    info.isLoading || rooms.isLoading || venues.isLoading || wellness.isLoading || fitness.isLoading;

  const hits = useMemo(() => {
    const modules: Hit[] = [
      { id: 'info', title: t('hotelInfo'), path: '/info', module: 'hotel_info' },
      { id: 'rooms', title: t('roomsOffer'), path: '/rooms', module: 'hotel_rooms' },
      { id: 'parking', title: t('parking'), path: '/parking', module: 'parking' },
      { id: 'restaurants', title: t('restaurantsBars'), path: '/restaurants', module: 'restaurants_bars' },
      { id: 'wellness', title: t('wellnessSpa'), path: '/wellness', module: 'wellness_spa' },
      { id: 'fitness', title: t('gymSport'), path: '/fitness', module: 'sports' },
      { id: 'program', title: t('hotelProgram'), path: '/program', module: 'leisure' },
      { id: 'map', title: t('pragueMapTitle'), path: '/map', module: 'places_of_interest' },
      { id: 'transport', title: t('transport'), path: '/transport', module: 'transportation' },
      { id: 'chat', title: t('chat'), path: '/chat', module: 'concierge_chat' },
      { id: 'requests', title: t('requests'), path: '/requests', protected: true, module: 'requests' },
      { id: 'housekeeping', title: t('housekeeping'), path: '/requests/housekeeping', protected: true, module: 'laundry' },
      { id: 'supplies', title: t('suppliesShort'), path: '/requests/supplies', protected: true, module: 'amenities' },
      { id: 'maintenance', title: t('maintenanceShort'), path: '/requests/maintenance', protected: true, module: 'issues_repairs' },
      { id: 'room-service', title: t('roomServiceShort'), path: '/requests/room-service', protected: true, module: 'room_service' },
    ].filter((item) => !item.module || isEnabled(item.module));

    const catalog: Hit[] = [
      ...(isEnabled('hotel_info') ? (info.data ?? []) : []).map((row) => ({
        id: `info-${row.slug}`,
        title: row.title,
        path: `/info/${row.slug}`,
        module: 'hotel_info',
      })),
      ...(isEnabled('hotel_rooms') ? (rooms.data ?? []) : []).map((row) => ({
        id: `room-${row.slug}`,
        title: row.title,
        path: `/rooms/${row.slug}`,
        module: 'hotel_rooms',
      })),
      ...(isEnabled('restaurants_bars') ? (venues.data ?? []) : []).map((row) => ({
        id: `venue-${row.slug}`,
        title: row.title,
        path: `/restaurants/${row.slug}`,
        module: 'restaurants_bars',
      })),
      ...(isEnabled('wellness_spa') ? (wellness.data ?? []) : []).map((row) => ({
        id: `wellness-${row.slug}`,
        title: row.title,
        path: `/wellness/${row.slug}`,
        module: 'wellness_spa',
      })),
      ...(isEnabled('sports') ? (fitness.data ?? []) : []).map((row) => ({
        id: `fitness-${row.slug}`,
        title: row.title,
        path: `/fitness/${row.slug}`,
        module: 'sports',
      })),
    ].filter((item) => !item.module || isEnabled(item.module));

    const all = [...modules, ...catalog];
    const q = norm(query.trim());
    if (!q) return all.slice(0, 16);
    return all.filter((hit) => norm(hit.title).includes(q));
  }, [fitness.data, info.data, isEnabled, query, rooms.data, t, venues.data, wellness.data]);

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
