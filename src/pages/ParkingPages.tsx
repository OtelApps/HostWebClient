import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { CatalogCard, Cover } from '../components/ui/CatalogCard';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { fetchParkingTopicDetail, fetchParkingTopics } from '../services/supabase/parking';

export function ParkingListPage() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: ['parking'], queryFn: fetchParkingTopics });

  return (
    <div>
      <PageHeader title={t('parking')} backTo="/" />
      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? <ErrorBlock onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.length === 0 ? <EmptyBlock /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {query.data?.map((topic) => (
          <CatalogCard
            key={topic.id}
            to={topic.external_url ? undefined : `/parking/${topic.slug}`}
            href={topic.external_url ?? undefined}
            title={topic.title}
            description={topic.list_description}
            image={topic.list_image_key}
            fallbackKey="reception"
          />
        ))}
      </div>
    </div>
  );
}

export function ParkingDetailPage() {
  const { t } = useTranslation();
  const { slug = '' } = useParams();
  const query = useQuery({
    queryKey: ['parking', slug],
    queryFn: () => fetchParkingTopicDetail(slug),
    enabled: Boolean(slug),
  });

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock onRetry={() => void query.refetch()} />;
  if (!query.data) return <EmptyBlock message={t('notFound')} />;

  const topic = query.data;

  return (
    <div>
      <PageHeader title={topic.title} backTo="/parking" />
      <Cover image={topic.detail_image_key ?? topic.list_image_key} title={topic.title} fallbackKey="reception" />
      {topic.detail_info ? (
        <p className="whitespace-pre-line text-muted">{topic.detail_info}</p>
      ) : (
        <p className="text-muted">{topic.list_description}</p>
      )}
    </div>
  );
}
