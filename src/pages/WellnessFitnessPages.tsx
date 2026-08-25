import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { CatalogCard, Cover, HoursList } from '../components/ui/CatalogCard';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { resolveImageUrl } from '../lib/images';
import {
  fetchFitnessFacilities,
  fetchFitnessFacilityDetail,
} from '../services/supabase/fitness';
import {
  fetchWellnessFacilities,
  fetchWellnessFacilityDetail,
  formatDurationMinutes,
  formatWellnessPrice,
} from '../services/supabase/wellness';

export function WellnessListPage() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: ['wellness'], queryFn: fetchWellnessFacilities });

  return (
    <div>
      <PageHeader title={t('wellnessSpa')} backTo="/" />
      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? <ErrorBlock onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.length === 0 ? <EmptyBlock /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {query.data?.map((item) => (
          <CatalogCard
            key={item.id}
            to={`/wellness/${item.slug}`}
            title={item.title}
            description={item.schedule_summary}
            image={item.image_key}
            fallbackKey="sauna"
            label={item.list_label}
          />
        ))}
      </div>
    </div>
  );
}

export function WellnessDetailPage() {
  const { t } = useTranslation();
  const { slug = '' } = useParams();
  const query = useQuery({
    queryKey: ['wellness', slug],
    queryFn: () => fetchWellnessFacilityDetail(slug),
    enabled: Boolean(slug),
  });

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock onRetry={() => void query.refetch()} />;
  if (!query.data) return <EmptyBlock message={t('notFound')} />;

  const { facility, openingHours, services } = query.data;

  return (
    <div>
      <PageHeader title={facility.title} backTo="/wellness" />
      <Cover image={facility.image_key} title={facility.title} fallbackKey="sauna" />
      {facility.description_long ? (
        <p className="mb-6 whitespace-pre-line text-muted">{facility.description_long}</p>
      ) : null}
      <h2 className="mb-3 font-serif text-xl text-header">{t('openingHours')}</h2>
      <HoursList hours={openingHours} />
      {services.length > 0 ? (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {services.map((service) => (
            <li key={service.slug} className="flex justify-between px-4 py-3">
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted">{formatDurationMinutes(service.duration_minutes)}</p>
              </div>
              <span className="font-semibold text-primary">
                {formatWellnessPrice(service.price_amount)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function FitnessListPage() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: ['fitness'], queryFn: fetchFitnessFacilities });

  return (
    <div>
      <PageHeader title={t('gymSport')} backTo="/" />
      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? <ErrorBlock onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.length === 0 ? <EmptyBlock /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {query.data?.map((item) => (
          <CatalogCard
            key={item.id}
            to={`/fitness/${item.slug}`}
            title={item.title}
            description={item.schedule_summary}
            image={item.image_key}
            fallbackKey="gym"
            label={item.list_label}
          />
        ))}
      </div>
    </div>
  );
}

export function FitnessDetailPage() {
  const { t } = useTranslation();
  const { slug = '' } = useParams();
  const query = useQuery({
    queryKey: ['fitness', slug],
    queryFn: () => fetchFitnessFacilityDetail(slug),
    enabled: Boolean(slug),
  });

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock onRetry={() => void query.refetch()} />;
  if (!query.data) return <EmptyBlock message={t('notFound')} />;

  const { facility, openingHours, images } = query.data;
  const gallery = images
    .map((img) => resolveImageUrl(img.image_url ?? img.image_key, 'gym'))
    .filter((src): src is string => Boolean(src));

  return (
    <div>
      <PageHeader title={facility.title} backTo="/fitness" />
      <Cover image={facility.image_key} title={facility.title} fallbackKey="gym" />
      {facility.description_long ? (
        <p className="mb-6 whitespace-pre-line text-muted">{facility.description_long}</p>
      ) : null}
      <h2 className="mb-3 font-serif text-xl text-header">{t('openingHours')}</h2>
      <HoursList hours={openingHours} />
      {gallery.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 font-serif text-xl text-header">{t('gallery')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {gallery.map((src) => (
              <img key={src} src={src} alt="" className="h-36 w-full rounded-2xl object-cover" />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
