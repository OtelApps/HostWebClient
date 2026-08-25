import { Smartphone, Bell, KeyRound, MapPinned, ClipboardCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '../components/ui/PageHeader';
import { getAppStoreUrl, getPlayStoreUrl } from '../lib/hotel';

export function AppDownloadPage() {
  const { t } = useTranslation();
  const appStore = getAppStoreUrl();
  const playStore = getPlayStoreUrl();

  const reasons = [
    { icon: KeyRound, text: t('appLandingKey') },
    { icon: Bell, text: t('appLandingPush') },
    { icon: ClipboardCheck, text: t('appLandingCheckIn') },
    { icon: MapPinned, text: t('appLandingTrip') },
  ];

  return (
    <div>
      <PageHeader title={t('appLandingTitle')} backTo="/" />
      <section className="overflow-hidden rounded-3xl bg-linear-to-br from-header to-primary p-8 text-white">
        <Smartphone className="size-10 text-accent" />
        <p className="mt-4 max-w-xl text-white/85">{t('appLandingLead')}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {appStore ? (
            <a
              href={appStore}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-header"
              target="_blank"
              rel="noreferrer"
            >
              {t('appStore')}
            </a>
          ) : null}
          {playStore ? (
            <a
              href={playStore}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-header"
              target="_blank"
              rel="noreferrer"
            >
              {t('playStore')}
            </a>
          ) : null}
          {!appStore && !playStore ? (
            <p className="text-sm text-white/70">{t('appLinksMissing')}</p>
          ) : null}
        </div>
      </section>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {reasons.map((reason) => (
          <li key={reason.text} className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
            <reason.icon className="mt-0.5 size-5 text-accent" />
            <span className="font-medium text-header">{reason.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
