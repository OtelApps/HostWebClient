import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bell, KeyRound, Smartphone } from 'lucide-react';

import { Button, EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { clearGuestIdentity, getGuestIdentity, type GuestIdentity } from '../lib/guestIdentity';
import {
  getNotificationPermission,
  notificationsSupported,
  requestNotificationPermission,
} from '../lib/webNotifications';
import { fetchGuestConciergeCaseSummaries } from '../services/supabase/concierge';

function NotificationPrefs() {
  const { t } = useTranslation();
  const [permission, setPermission] = useState(getNotificationPermission);
  const [asking, setAsking] = useState(false);

  if (!notificationsSupported() || permission === 'unsupported') return null;

  return (
    <section className="mt-4 rounded-3xl border border-line bg-white p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bell className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-header">{t('enableNotificationsTitle')}</p>
          {permission === 'granted' ? (
            <p className="mt-1 text-sm text-muted">{t('notificationsEnabled')}</p>
          ) : null}
          {permission === 'denied' ? (
            <p className="mt-1 text-sm text-muted">{t('notificationsBlocked')}</p>
          ) : null}
          {permission === 'default' ? (
            <>
              <p className="mt-1 text-sm text-muted">{t('enableNotificationsLead')}</p>
              <Button
                className="mt-3"
                disabled={asking}
                onClick={() => {
                  setAsking(true);
                  void requestNotificationPermission().then(() => {
                    setPermission(getNotificationPermission());
                    setAsking(false);
                  });
                }}
              >
                {t('enableNotificationsProfile')}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const [guest, setGuest] = useState<GuestIdentity | null>(null);

  useEffect(() => {
    void getGuestIdentity().then(setGuest);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div>
        <PageHeader title={t('profile')} />
        <div className="rounded-3xl border border-line bg-white p-6 text-center">
          <p className="mb-4 text-muted">{t('loginRequired')}</p>
          <Button onClick={() => navigate('/signin')}>{t('signIn')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('profile')} />
      <section className="rounded-3xl border border-line bg-white p-6">
        <p className="text-sm text-muted">{t('guest')}</p>
        <h2 className="font-serif text-2xl text-header">{guest?.guest_display_name}</h2>
        <p className="mt-1 text-muted">
          {t('room')} {guest?.room_number || '—'}
        </p>
        {guest?.reservation_number ? (
          <p className="text-sm text-muted">
            {t('reservation')}: {guest.reservation_number}
          </p>
        ) : null}
      </section>

      <NotificationPrefs />

      <div className="mt-4 grid gap-3">
        <Link to="/stay" className="rounded-2xl border border-line bg-white px-4 py-3 font-medium">
          {t('stayInfo')}
        </Link>
        <Link to="/orders" className="rounded-2xl border border-line bg-white px-4 py-3 font-medium">
          {t('orderHistory')}
        </Link>
        <Link to="/profile/chats" className="rounded-2xl border border-line bg-white px-4 py-3 font-medium">
          {t('chatHistory')}
        </Link>
        <Link
          to="/app"
          className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-orange-50 px-4 py-3 font-medium"
        >
          <KeyRound className="size-4 text-accent" />
          {t('digitalKey')}
        </Link>
        <Link
          to="/app"
          className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-orange-50 px-4 py-3 font-medium"
        >
          <Smartphone className="size-4 text-accent" />
          {t('downloadAppCta')}
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        {(['cs', 'en', 'de'] as const).map((lng) => (
          <button
            key={lng}
            type="button"
            onClick={() => void i18n.changeLanguage(lng)}
            className="rounded-full border border-line px-3 py-1 text-sm"
          >
            {lng.toUpperCase()}
          </button>
        ))}
      </div>

      <Button
        className="mt-6"
        variant="ghost"
        onClick={() => {
          signOut();
          clearGuestIdentity();
          navigate('/');
        }}
      >
        {t('signOut')}
      </Button>
    </div>
  );
}

export function StayPage() {
  const { t } = useTranslation();
  const [guest, setGuest] = useState<GuestIdentity | null>(null);

  useEffect(() => {
    void getGuestIdentity().then(setGuest);
  }, []);

  return (
    <div>
      <PageHeader title={t('stayInfo')} backTo="/profile" />
      <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {[
          [t('guest'), guest?.guest_display_name],
          [t('room'), guest?.room_number],
          [t('reservation'), guest?.reservation_number],
          [t('segment'), guest?.segment],
          [t('loyalty'), guest?.loyalty_points],
          [t('stays'), guest?.stay_count],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex justify-between px-4 py-3 text-sm">
            <dt className="text-muted">{label}</dt>
            <dd className="font-medium">{value ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ChatHistoryPage() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ['concierge-history'],
    queryFn: fetchGuestConciergeCaseSummaries,
  });

  return (
    <div>
      <PageHeader title={t('chatHistory')} backTo="/profile" />
      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? <ErrorBlock onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
        <EmptyBlock message={t('emptyChatHistory')} />
      ) : null}
      <ul className="space-y-2">
        {query.data?.map((item) => (
          <li key={item.id} className="rounded-2xl border border-line bg-white p-4 text-sm">
            <p>{item.summary_cs || item.summary}</p>
            {item.resolved_at ? (
              <p className="mt-2 text-xs text-muted">{new Date(item.resolved_at).toLocaleString()}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
