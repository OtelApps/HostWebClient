import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Button, EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/Button';
import { CatalogCard, Cover, HoursList } from '../components/ui/CatalogCard';
import { ConfirmRequestDialog } from '../components/ui/ConfirmRequestDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useServiceRequests } from '../contexts/ServiceRequestContext';
import { useSubmitServiceRequest } from '../hooks/useSubmitServiceRequest';
import { fetchHotelHousekeeping } from '../services/supabase/housekeeping';
import { fetchHotelMaintenance } from '../services/supabase/maintenance';
import { fetchHotelSupplies } from '../services/supabase/supplies';
import {
  fetchRoomServiceMenuDetail,
  fetchRoomServiceMenus,
  formatRoomServicePrice,
} from '../services/supabase/roomService';
import {
  buildAmenitiesMetadata,
  buildLaundryMetadata,
  buildMaintenanceMetadata,
  buildRoomServiceMetadata,
  formatItemsRequestText,
  type CreateServiceRequestInput,
  type ServiceRequestLineItem,
} from '../services/supabase/serviceRequests';
import {
  getRecentDoneRequest,
  RECENT_DONE_MS,
} from '../services/supabase/serviceRequestUi';

export function RequestsHubPage() {
  const { t } = useTranslation();
  const { activeRequests, requests } = useServiceRequests();
  const [now, setNow] = useState(() => Date.now());
  const recentDone = useMemo(() => getRecentDoneRequest(requests, now), [now, requests]);
  const headline = activeRequests.length > 0 ? activeRequests : recentDone ? [recentDone] : [];
  const isDoneHeadline = activeRequests.length === 0 && Boolean(recentDone);

  useEffect(() => {
    if (!recentDone) return undefined;
    const expiresAt = Date.parse(recentDone.updated_at) + RECENT_DONE_MS;
    const delay = Math.max(expiresAt - Date.now() + 250, 1000);
    const id = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(id);
  }, [recentDone]);

  return (
    <div>
      <PageHeader title={t('requests')} />
      {headline.length > 0 ? (
        <div
          className={
            isDoneHeadline
              ? 'mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4'
              : 'mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4'
          }
        >
          <p
            className={
              isDoneHeadline
                ? 'text-sm font-semibold text-emerald-700'
                : 'text-sm font-semibold text-primary'
            }
          >
            {isDoneHeadline ? t('recentDoneRequest') : t('activeRequests')}
          </p>
          <ul className="mt-2 space-y-2">
            {headline.map((req) => (
              <li key={req.id}>
                <Link to={`/requests/${req.id}`} className="flex items-center justify-between text-sm">
                  <span>{req.request_text}</span>
                  <StatusBadge status={req.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted">{t('noActiveRequests')}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <CatalogCard
          to="/requests/housekeeping"
          title={t('housekeeping')}
          image="housekeeping"
          fallbackKey="housekeeping"
        />
        <CatalogCard
          to="/requests/supplies"
          title={t('suppliesShort')}
          image="headerDoplnky"
          fallbackKey="toiletries"
        />
        <CatalogCard
          to="/requests/maintenance"
          title={t('maintenanceShort')}
          image="headerMaintenance"
          fallbackKey="maintenance"
        />
        <CatalogCard
          to="/requests/room-service"
          title={t('roomServiceShort')}
          image="roomServiceIcon"
          fallbackKey="roomServiceIcon"
        />
      </div>
    </div>
  );
}

function SuccessCard({ onView }: { onView: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl border border-green-200 bg-green-50 p-6 text-center">
      <h2 className="font-serif text-2xl text-header">{t('requestSent')}</h2>
      <p className="mt-2 text-sm text-muted">{t('requestSentHint')}</p>
      <div className="mt-4 flex justify-center gap-2">
        <Button onClick={onView}>{t('viewRequests')}</Button>
        <Link to="/app" className="rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-semibold">
          {t('downloadAppCta')}
        </Link>
      </div>
    </div>
  );
}

export function HousekeepingPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ['housekeeping'], queryFn: () => fetchHotelHousekeeping() });
  const { submit, submitting, error } = useSubmitServiceRequest();
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState<CreateServiceRequestInput | null>(null);
  const [note, setNote] = useState('');

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock onRetry={() => void query.refetch()} />;
  if (!query.data) return <EmptyBlock />;
  if (done) return <SuccessCard onView={() => navigate('/requests')} />;

  const data = query.data;

  return (
    <div>
      <PageHeader title={data.title} backTo="/requests" />
      <Cover image={data.header_image_key} title={data.title} fallbackKey="housekeeping" />
      <p className="mb-4 text-muted">{data.description}</p>
      <HoursList hours={data.openingHours} />
      {data.categories.map((category) => (
        <section key={category.slug} className="mt-6">
          <h2 className="mb-2 font-serif text-lg text-header">{category.title}</h2>
          <div className="grid gap-2">
            {category.items.map((item) => (
              <Button
                key={item.slug}
                variant="ghost"
                className="justify-between"
                disabled={submitting}
                onClick={() => {
                  setNote('');
                  setPending({
                    service_module: 'laundry',
                    request_text: item.title,
                    metadata: buildLaundryMetadata(category.slug, item.slug, item.title),
                    guest_locale: i18n.language.slice(0, 2),
                    source_entity_type: 'housekeeping',
                    source_entity_slug: item.slug,
                  });
                }}
              >
                {item.title}
              </Button>
            ))}
          </div>
        </section>
      ))}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <ConfirmRequestDialog
        open={Boolean(pending)}
        summary={pending?.request_text ?? ''}
        note={note}
        submitting={submitting}
        onNoteChange={setNote}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          void submit({ ...pending, guest_note: note.trim() || undefined }).then(
            (ok) => ok && setDone(true)
          );
        }}
      />
    </div>
  );
}

export function SuppliesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ['supplies'], queryFn: () => fetchHotelSupplies() });
  const { submit, submitting, error } = useSubmitServiceRequest();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [note, setNote] = useState('');

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock onRetry={() => void query.refetch()} />;
  if (!query.data) return <EmptyBlock />;
  if (done) return <SuccessCard onView={() => navigate('/requests')} />;

  const data = query.data;
  const selected: ServiceRequestLineItem[] = [];
  for (const category of data.categories) {
    for (const item of category.items) {
      const count = counts[item.slug] ?? 0;
      if (count > 0) selected.push({ id: item.slug, name: item.name, count, icon: item.icon_emoji ?? undefined });
    }
  }

  return (
    <div>
      <PageHeader title={data.title} backTo="/requests" />
      <Cover image={data.header_image_key} title={data.title} fallbackKey="toiletries" />
      <p className="mb-4 text-muted">{data.description}</p>
      {data.categories.map((category) => (
        <section key={category.slug} className="mt-6">
          <h2 className="mb-2 font-serif text-lg text-header">{category.title}</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {category.items.map((item) => {
              const count = counts[item.slug] ?? 0;
              return (
                <li key={item.slug} className="flex items-center justify-between px-4 py-3">
                  <span>
                    {item.icon_emoji ? `${item.icon_emoji} ` : ''}
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="size-8 rounded-full border border-line"
                      onClick={() =>
                        setCounts((c) => ({ ...c, [item.slug]: Math.max(0, (c[item.slug] ?? 0) - 1) }))
                      }
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm">{count}</span>
                    <button
                      type="button"
                      className="size-8 rounded-full border border-line"
                      onClick={() =>
                        setCounts((c) => ({
                          ...c,
                          [item.slug]: Math.min(data.max_quantity_per_item, (c[item.slug] ?? 0) + 1),
                        }))
                      }
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <Button
        className="mt-6 w-full"
        disabled={submitting || selected.length === 0}
        onClick={() => {
          setNote('');
          setConfirmOpen(true);
        }}
      >
        {t('confirm')}
      </Button>
      <ConfirmRequestDialog
        open={confirmOpen}
        summary={formatItemsRequestText(selected)}
        note={note}
        submitting={submitting}
        onNoteChange={setNote}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void submit({
            service_module: 'amenities',
            request_text: formatItemsRequestText(selected),
            metadata: buildAmenitiesMetadata(selected),
            guest_note: note.trim() || undefined,
            guest_locale: i18n.language.slice(0, 2),
            source_entity_type: 'supplies',
          }).then((ok) => ok && setDone(true));
        }}
      />
    </div>
  );
}

export function MaintenancePage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ['maintenance'], queryFn: () => fetchHotelMaintenance() });
  const { submit, submitting, error } = useSubmitServiceRequest();
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState<CreateServiceRequestInput | null>(null);
  const [note, setNote] = useState('');

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock onRetry={() => void query.refetch()} />;
  if (!query.data) return <EmptyBlock />;
  if (done) return <SuccessCard onView={() => navigate('/requests')} />;

  const data = query.data;

  return (
    <div>
      <PageHeader title={data.title} backTo="/requests" />
      <Cover image={data.header_image_key} title={data.title} fallbackKey="maintenance" />
      <p className="mb-4 whitespace-pre-line text-muted">{data.description}</p>
      {data.categories.map((category) => (
        <section key={category.slug} className="mt-6">
          <h2 className="mb-2 font-serif text-lg text-header">{category.title}</h2>
          <div className="grid gap-2">
            {category.items.map((item) => (
              <Button
                key={item.slug}
                variant="ghost"
                className="justify-between"
                disabled={submitting}
                onClick={() => {
                  setNote('');
                  setPending({
                    service_module: 'issues_repairs',
                    request_text: item.label,
                    metadata: buildMaintenanceMetadata(category.slug, item.slug, item.label),
                    guest_locale: i18n.language.slice(0, 2),
                    source_entity_type: 'maintenance',
                    source_entity_slug: item.slug,
                  });
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </section>
      ))}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <ConfirmRequestDialog
        open={Boolean(pending)}
        summary={pending?.request_text ?? ''}
        note={note}
        submitting={submitting}
        onNoteChange={setNote}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          void submit({ ...pending, guest_note: note.trim() || undefined }).then(
            (ok) => ok && setDone(true)
          );
        }}
      />
    </div>
  );
}

export function RoomServiceListPage() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: ['room-service-menus'], queryFn: fetchRoomServiceMenus });

  return (
    <div>
      <PageHeader title={t('roomServiceShort')} backTo="/requests" />
      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? <ErrorBlock onRetry={() => void query.refetch()} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {query.data?.map((menu) => (
          <CatalogCard
            key={menu.slug}
            to={`/requests/room-service/${menu.slug}`}
            title={menu.title}
            description={menu.list_schedule_summary ?? menu.list_label}
            image={menu.list_image_key}
            fallbackKey={
              menu.slug.includes('breakfast') || menu.slug.includes('snidane')
                ? 'breakfast'
                : menu.slug.includes('lunch') || menu.slug.includes('obed')
                  ? 'lunch'
                  : 'dinner'
            }
          />
        ))}
      </div>
    </div>
  );
}

export function RoomServiceMenuPage() {
  const { t, i18n } = useTranslation();
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['room-service', slug],
    queryFn: () => fetchRoomServiceMenuDetail(slug),
    enabled: Boolean(slug),
  });
  const { submit, submitting, error } = useSubmitServiceRequest();
  const [counts, setCounts] = useState<Record<string, { count: number; option?: string }>>({});
  const [done, setDone] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [note, setNote] = useState('');

  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock onRetry={() => void query.refetch()} />;
  if (!query.data) return <EmptyBlock />;
  if (done) return <SuccessCard onView={() => navigate('/requests')} />;

  const data = query.data;
  const selected: ServiceRequestLineItem[] = [];
  let total = 0;
  for (const category of data.categories) {
    for (const item of category.items) {
      const state = counts[item.slug];
      if (!state?.count) continue;
      const option = item.options.find((o) => o.slug === state.option);
      const unit = item.price_amount + (option?.price_amount ?? 0);
      total += unit * state.count;
      selected.push({
        id: item.slug,
        name: option ? `${item.name} (${option.label})` : item.name,
        count: state.count,
        price: unit,
        desc: option?.label,
      });
    }
  }

  return (
    <div>
      <PageHeader title={data.title} backTo="/requests/room-service" />
      <Cover image={data.header_image_key} title={data.title} fallbackKey="roomServiceIcon" />
      <p className="mb-4 text-muted">{data.description}</p>
      {data.categories.map((category) => (
        <section key={category.slug} className="mt-6">
          <h2 className="mb-2 font-serif text-lg text-header">{category.title}</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {category.items.map((item) => {
              const state = counts[item.slug] ?? { count: 0 };
              return (
                <li key={item.slug} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {item.icon_emoji ? `${item.icon_emoji} ` : ''}
                        {item.name}
                      </p>
                      <p className="text-sm text-primary">{formatRoomServicePrice(item.price_amount)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="size-8 rounded-full border border-line"
                        onClick={() =>
                          setCounts((c) => ({
                            ...c,
                            [item.slug]: { ...state, count: Math.max(0, state.count - 1) },
                          }))
                        }
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{state.count}</span>
                      <button
                        type="button"
                        className="size-8 rounded-full border border-line"
                        onClick={() =>
                          setCounts((c) => ({
                            ...c,
                            [item.slug]: { ...state, count: state.count + 1 },
                          }))
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {item.options.length > 0 ? (
                    <select
                      className="mt-2 w-full rounded-xl border border-line px-2 py-1 text-sm"
                      value={state.option ?? ''}
                      onChange={(e) =>
                        setCounts((c) => ({
                          ...c,
                          [item.slug]: { ...state, option: e.target.value || undefined },
                        }))
                      }
                    >
                      <option value="">{data.juice_modal_title ?? '—'}</option>
                      {item.options.map((opt) => (
                        <option key={opt.slug} value={opt.slug}>
                          {opt.label} (+{formatRoomServicePrice(opt.price_amount)})
                        </option>
                      ))}
                    </select>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <p className="mt-4 font-semibold">
        {t('total')}: {formatRoomServicePrice(total)}
      </p>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <Button
        className="mt-4 w-full"
        disabled={submitting || selected.length === 0}
        onClick={() => {
          setNote('');
          setConfirmOpen(true);
        }}
      >
        {t('confirm')}
      </Button>
      <ConfirmRequestDialog
        open={confirmOpen}
        summary={`${formatItemsRequestText(selected)} · ${formatRoomServicePrice(total)}`}
        note={note}
        submitting={submitting}
        onNoteChange={setNote}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void submit({
            service_module: 'room_service',
            request_text: formatItemsRequestText(selected),
            metadata: buildRoomServiceMetadata(data.slug, selected, total),
            guest_note: note.trim() || undefined,
            guest_locale: i18n.language.slice(0, 2),
            source_entity_type: 'room_service',
            source_entity_slug: data.slug,
          }).then((ok) => ok && setDone(true));
        }}
      />
    </div>
  );
}

export function RequestDetailPage() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const { requests, loading } = useServiceRequests();
  const request = requests.find((r) => r.id === id);

  if (loading && !request) return <LoadingBlock />;
  if (!request) return <EmptyBlock message={t('notFound')} />;

  return (
    <div>
      <PageHeader title={request.service_label} backTo="/requests" />
      <div className="rounded-3xl border border-line bg-white p-6">
        <StatusBadge status={request.status} />
        <p className="mt-4 text-lg font-medium">{request.request_text}</p>
        {request.status_guest_note ? (
          <p className="mt-2 text-sm text-muted">{request.status_guest_note}</p>
        ) : null}
        <p className="mt-4 text-xs text-muted">
          {request.request_number ?? request.id} · {new Date(request.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export function OrdersPage() {
  const { t } = useTranslation();
  const { requests, loading } = useServiceRequests();

  return (
    <div>
      <PageHeader title={t('orderHistory')} backTo="/profile" />
      {loading ? <LoadingBlock /> : null}
      {requests.length === 0 ? <EmptyBlock /> : null}
      <ul className="space-y-3">
        {requests.map((req) => (
          <li key={req.id}>
            <Link to={`/requests/${req.id}`} className="block rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{req.request_text}</p>
                <StatusBadge status={req.status} />
              </div>
              <p className="mt-1 text-xs text-muted">{new Date(req.created_at).toLocaleString()}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
