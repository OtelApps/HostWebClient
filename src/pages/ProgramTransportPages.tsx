import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/Button';
import { CatalogCard, Cover } from '../components/ui/CatalogCard';
import { PageHeader } from '../components/ui/PageHeader';
import { fetchWellnessProgramEvents } from '../services/supabase/wellness';

const dayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

export function ProgramPage() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t('hotelProgram')} backTo="/" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-serif text-xl text-header">{t('sport')}</h2>
          <p className="mt-1 text-sm text-muted">{t('moreInApp')}</p>
        </div>
        <Link to="/program/wellness" className="rounded-2xl border border-line bg-white p-5 hover:shadow-md">
          <h2 className="font-serif text-xl text-header">{t('wellness')}</h2>
          <p className="mt-1 text-sm text-muted">{t('clickForDetail')}</p>
        </Link>
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-serif text-xl text-header">{t('nightShow')}</h2>
          <p className="mt-1 text-sm text-muted">{t('moreInApp')}</p>
        </div>
      </div>
    </div>
  );
}

export function WellnessProgramPage() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: ['wellness-program'], queryFn: fetchWellnessProgramEvents });

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock onRetry={() => void query.refetch()} />;

  const grouped = new Map<number, NonNullable<typeof query.data>>();
  for (const event of query.data ?? []) {
    const list = grouped.get(event.day_order) ?? [];
    list.push(event);
    grouped.set(event.day_order, list);
  }

  return (
    <div>
      <PageHeader title={t('wellness')} backTo="/program" />
      {grouped.size === 0 ? <EmptyBlock /> : null}
      <div className="space-y-6">
        {[...grouped.entries()].map(([day, events]) => (
          <section key={day}>
            <h2 className="mb-2 font-serif text-lg text-header">{dayNames[day] ?? `${t('schedule')} ${day}`}</h2>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
              {events.map((event, index) => (
                <li key={`${event.start_time}-${index}`} className="px-4 py-3">
                  <p className="text-xs font-semibold text-primary">{event.start_time}</p>
                  <p className="font-medium">{event.title}</p>
                  {event.description ? <p className="text-sm text-muted">{event.description}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export function TransportPage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader title={t('transport')} backTo="/" />
      <div className="grid gap-4 sm:grid-cols-2">
        <CatalogCard
          to="/transport/mhd"
          title={t('mhd')}
          description={t('mhdLead')}
          image="metro"
          fallbackKey="metro"
          label={t('cityTransport')}
        />
        <CatalogCard
          to="/transport/bolt"
          title="Bolt"
          description={t('boltLead')}
          image="bolt"
          fallbackKey="bolt"
          label={t('privateTransport')}
        />
        <CatalogCard
          to="/transport/uber"
          title="Uber"
          description={t('uberLead')}
          image="uber"
          fallbackKey="uber"
          label={t('privateTransport')}
        />
        <CatalogCard
          to="/transport/lime"
          title="Lime"
          description={t('limeLead')}
          image="lime"
          fallbackKey="lime"
          label={t('privateTransport')}
        />
      </div>
    </div>
  );
}

const MHD_KINDS = {
  metro: { titleKey: 'metro', leadKey: 'metroLead', image: 'metro', href: 'https://pid.cz' },
  tram: { titleKey: 'trams', leadKey: 'tramsLead', image: 'tram', href: 'https://pid.cz' },
  trolley: { titleKey: 'trolleys', leadKey: 'trolleysLead', image: 'trolley', href: 'https://pid.cz' },
} as const;

export function TransportMhdPage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader title={t('mhdTitle')} backTo="/transport" />
      <Cover image="metro" title={t('mhdTitle')} fallbackKey="metro" />
      <p className="mb-6 whitespace-pre-line text-muted">{t('mhdLead')}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(MHD_KINDS) as Array<keyof typeof MHD_KINDS>).map((kind) => {
          const item = MHD_KINDS[kind];
          return (
            <CatalogCard
              key={kind}
              to={`/transport/mhd/${kind}`}
              title={t(item.titleKey)}
              description={t(item.leadKey)}
              image={item.image}
              fallbackKey={item.image}
              label={t('cityTransport')}
            />
          );
        })}
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <a
          href="https://pid.cz"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
        >
          <span className="font-medium">{t('buyTicket')}</span>
          <span className="text-sm text-primary">{t('openExternal')}</span>
        </a>
        <a
          href="https://pid.cz/jizdne/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between border-t border-line px-4 py-3 hover:bg-gray-50"
        >
          <span className="font-medium">{t('ticketPrices')}</span>
          <span className="text-sm text-primary">{t('openExternal')}</span>
        </a>
        <a
          href="https://pid.cz"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between border-t border-line px-4 py-3 hover:bg-gray-50"
        >
          <span className="font-medium">{t('pidSite')}</span>
          <span className="text-sm text-primary">PID.cz</span>
        </a>
      </div>
    </div>
  );
}

export function TransportMhdKindPage() {
  const { t } = useTranslation();
  const { kind = '' } = useParams();
  const item = MHD_KINDS[kind as keyof typeof MHD_KINDS];
  if (!item) return <Navigate to="/transport/mhd" replace />;

  return (
    <div>
      <PageHeader title={t(item.titleKey)} backTo="/transport/mhd" />
      <Cover image={item.image} title={t(item.titleKey)} fallbackKey={item.image} />
      <p className="mb-6 whitespace-pre-line text-muted">{t(item.leadKey)}</p>
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
      >
        {t('pidSite')}
      </a>
    </div>
  );
}

const PROVIDERS = {
  bolt: { title: 'Bolt', leadKey: 'boltLead', image: 'bolt', href: 'https://bolt.eu' },
  uber: { title: 'Uber', leadKey: 'uberLead', image: 'uber', href: 'https://www.uber.com' },
  lime: { title: 'Lime', leadKey: 'limeLead', image: 'lime', href: 'https://www.li.me' },
} as const;

export function TransportProviderPage() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const item = PROVIDERS[id as keyof typeof PROVIDERS];
  if (!item) return <EmptyBlock message={t('notFound')} />;

  return (
    <div>
      <PageHeader title={item.title} backTo="/transport" />
      <Cover image={item.image} title={item.title} fallbackKey={item.image} />
      <p className="mb-6 text-muted">{t(item.leadKey)}</p>
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
      >
        {t('openExternal')} {item.title}
      </a>
    </div>
  );
}
