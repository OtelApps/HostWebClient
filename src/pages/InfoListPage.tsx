import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { CatalogCard } from '../components/ui/CatalogCard';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { fetchHotelInfoTopics } from '../services/supabase/hotelInfo';

export function InfoListPage() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: ['hotel-info'], queryFn: fetchHotelInfoTopics });

  return (
    <div>
      <PageHeader title={t('hotelInfo')} backTo="/" />
      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? <ErrorBlock onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.length === 0 ? <EmptyBlock /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {query.data?.map((topic) => (
          <CatalogCard
            key={topic.id}
            to={`/info/${topic.slug}`}
            title={topic.title}
            description={topic.list_description}
            image={topic.list_image_key}
            fallbackKey="informace"
          />
        ))}
      </div>
    </div>
  );
}
