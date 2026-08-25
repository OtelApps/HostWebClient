import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { CatalogCard } from '../components/ui/CatalogCard';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { fetchHotelRoomTypes } from '../services/supabase/rooms';

export function RoomsListPage() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: ['rooms'], queryFn: fetchHotelRoomTypes });

  return (
    <div>
      <PageHeader title={t('roomsOffer')} backTo="/" />
      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? <ErrorBlock onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.length === 0 ? <EmptyBlock /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {query.data?.map((room) => (
          <CatalogCard
            key={room.id}
            to={`/rooms/${room.slug}`}
            title={room.title}
            description={room.list_description}
            image={room.image_key}
            fallbackKey="room"
            label={room.size_text}
          />
        ))}
      </div>
    </div>
  );
}
