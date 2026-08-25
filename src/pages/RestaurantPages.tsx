import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { CatalogCard, Cover, HoursList } from '../components/ui/CatalogCard';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import {
  fetchMenuCategoriesWithItems,
  fetchMenuItemDetail,
  fetchMenuTitle,
  fetchVenueDetail,
  fetchVenues,
} from '../services/supabase/restaurants';

export function RestaurantsListPage() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: ['venues'], queryFn: fetchVenues });

  return (
    <div>
      <PageHeader title={t('restaurantsBars')} backTo="/" />
      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? <ErrorBlock onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.length === 0 ? <EmptyBlock /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {query.data?.map((venue) => (
          <CatalogCard
            key={venue.id}
            to={`/restaurants/${venue.slug}`}
            title={venue.title}
            description={venue.description ?? venue.schedule_summary}
            image={venue.image_key}
            fallbackKey={venue.venue_type === 'bar' ? 'barLobby' : 'restaurant'}
            label={venue.list_label}
          />
        ))}
      </div>
    </div>
  );
}

export function VenueDetailPage() {
  const { t } = useTranslation();
  const { slug = '' } = useParams();
  const query = useQuery({
    queryKey: ['venues', slug],
    queryFn: () => fetchVenueDetail(slug),
    enabled: Boolean(slug),
  });

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock onRetry={() => void query.refetch()} />;
  if (!query.data) return <EmptyBlock message={t('notFound')} />;

  const { venue, openingHours, menus } = query.data;

  return (
    <div>
      <PageHeader title={venue.title} backTo="/restaurants" />
      <Cover image={venue.image_key} title={venue.title} fallbackKey={venue.venue_type === 'bar' ? 'barLobby' : 'restaurant'} />
      {venue.description ? <p className="mb-6 whitespace-pre-line text-muted">{venue.description}</p> : null}
      <h2 className="mb-3 font-serif text-xl text-header">{t('openingHours')}</h2>
      <HoursList hours={openingHours} />
      {menus.length > 0 ? (
        <div className="mt-6 grid gap-3">
          {menus.map((menu) => (
            <Link
              key={menu.slug}
              to={`/restaurants/${venue.slug}/menu/${menu.slug}`}
              className="rounded-2xl border border-line bg-white px-4 py-3 font-semibold text-header hover:bg-gray-50"
            >
              {menu.title}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MenuPage() {
  const { t } = useTranslation();
  const { slug = '', menuSlug = '' } = useParams();
  const titleQuery = useQuery({
    queryKey: ['menu-title', slug, menuSlug],
    queryFn: () => fetchMenuTitle(slug, menuSlug),
    enabled: Boolean(slug && menuSlug),
  });
  const query = useQuery({
    queryKey: ['menu', slug, menuSlug],
    queryFn: () => fetchMenuCategoriesWithItems(slug, menuSlug),
    enabled: Boolean(slug && menuSlug),
  });

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock onRetry={() => void query.refetch()} />;
  if (!query.data) return <EmptyBlock />;

  return (
    <div>
      <PageHeader title={titleQuery.data ?? t('menu')} backTo={`/restaurants/${slug}`} />
      <div className="space-y-8">
        {query.data.map((category) => (
          <section key={category.id}>
            <h2 className="mb-3 font-serif text-xl text-header">{category.title}</h2>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
              {category.items.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/restaurants/${slug}/menu/${menuSlug}/${category.id}/${item.id}`}
                    className="flex items-start justify-between gap-4 px-4 py-3 hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-header">{item.name}</p>
                      {item.description ? (
                        <p className="text-sm text-muted">{item.description}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-primary">{item.price}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export function MenuItemPage() {
  const { t } = useTranslation();
  const { slug = '', menuSlug = '', categorySlug = '', itemSlug = '' } = useParams();
  const query = useQuery({
    queryKey: ['menu-item', slug, menuSlug, categorySlug, itemSlug],
    queryFn: () => fetchMenuItemDetail(slug, menuSlug, categorySlug, itemSlug),
    enabled: Boolean(slug && menuSlug && categorySlug && itemSlug),
  });

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock onRetry={() => void query.refetch()} />;
  if (!query.data) return <EmptyBlock message={t('notFound')} />;

  return (
    <div>
      <PageHeader
        title={query.data.title}
        backTo={`/restaurants/${slug}/menu/${menuSlug}`}
      />
      <p className="mb-2 text-lg font-semibold text-primary">{query.data.price}</p>
      <p className="whitespace-pre-line text-muted">{query.data.info}</p>
      {query.data.allergens.length > 0 ? (
        <p className="mt-4 text-sm text-muted">
          {t('allergens')}: {query.data.allergens.join(', ')}
        </p>
      ) : null}
    </div>
  );
}
