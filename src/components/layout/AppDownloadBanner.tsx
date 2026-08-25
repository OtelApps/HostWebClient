import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Smartphone, X } from 'lucide-react';

import { getAppStoreUrl, getPlayStoreUrl } from '../../lib/hotel';

const DISMISS_KEY = 'otelapps_app_banner_dismissed';

type Props = {
  dismissed: boolean;
  onDismiss: () => void;
};

export function AppDownloadBanner({ dismissed, onDismiss }: Props) {
  const { t } = useTranslation();
  const appStore = getAppStoreUrl();
  const playStore = getPlayStoreUrl();

  if (dismissed) return null;

  return (
    <div className="bg-header text-white">
      <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-2.5">
        <Smartphone className="size-5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{t('downloadAppTitle')}</p>
          <p className="hidden truncate text-xs text-white/70 sm:block">{t('downloadAppSubtitle')}</p>
        </div>
        {appStore || playStore ? (
          <a
            href={appStore || playStore}
            className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-header"
            target="_blank"
            rel="noreferrer"
          >
            {t('downloadAppCta')}
          </a>
        ) : (
          <Link
            to="/app"
            className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-header"
          >
            {t('downloadAppCta')}
          </Link>
        )}
        <button
          type="button"
          aria-label={t('downloadAppDismiss')}
          className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, '1');
            onDismiss();
          }}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function isAppBannerDismissed(): boolean {
  return localStorage.getItem(DISMISS_KEY) === '1';
}
