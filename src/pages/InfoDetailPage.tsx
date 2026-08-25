import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Cover } from '../components/ui/CatalogCard';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { fetchHotelInfoTopicDetail } from '../services/supabase/hotelInfo';

export function InfoDetailPage() {
  const { t } = useTranslation();
  const { slug = '' } = useParams();
  const query = useQuery({
    queryKey: ['hotel-info', slug],
    queryFn: () => fetchHotelInfoTopicDetail(slug),
    enabled: Boolean(slug),
  });

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock onRetry={() => void query.refetch()} />;
  if (!query.data) return <EmptyBlock message={t('notFound')} />;

  const { topic, sections } = query.data;

  return (
    <div>
      <PageHeader title={topic.title} backTo="/info" />
      <Cover image={topic.detail_image_key ?? topic.list_image_key} title={topic.title} fallbackKey="informace" />
      {topic.detail_info ? <p className="mb-6 whitespace-pre-line text-muted">{topic.detail_info}</p> : null}
      <div className="space-y-3">
        {sections.map((section) => (
          <article key={section.slug} className="rounded-2xl border border-line bg-white p-4">
            <h3 className="font-semibold text-header">{section.title}</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-muted">{section.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
