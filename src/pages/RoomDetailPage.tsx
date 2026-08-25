import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Cover } from '../components/ui/CatalogCard';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { fetchHotelRoomTypeDetail } from '../services/supabase/rooms';

export function RoomDetailPage() {
  const { t } = useTranslation();
  const { slug = '' } = useParams();
  const query = useQuery({
    queryKey: ['rooms', slug],
    queryFn: () => fetchHotelRoomTypeDetail(slug),
    enabled: Boolean(slug),
  });

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock onRetry={() => void query.refetch()} />;
  if (!query.data) return <EmptyBlock message={t('notFound')} />;

  const { room, features } = query.data;

  return (
    <div>
      <PageHeader title={room.title} backTo="/rooms" />
      <Cover image={room.image_key} title={room.title} fallbackKey="room" />
      {room.size_text ? <p className="mb-2 text-sm font-medium text-primary">{room.size_text}</p> : null}
      <p className="mb-6 whitespace-pre-line text-muted">{room.detail_info}</p>
      {features.length > 0 ? (
        <section>
          <h2 className="mb-3 font-serif text-xl text-header">{t('features')}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="rounded-xl border border-line bg-white px-4 py-3 text-sm">
                {feature}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
