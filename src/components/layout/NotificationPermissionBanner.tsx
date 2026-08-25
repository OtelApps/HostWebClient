import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import {
  dismissNotificationBanner,
  getNotificationPermission,
  notificationsSupported,
  requestNotificationPermission,
  wasNotificationBannerDismissed,
} from '../../lib/webNotifications';

export function NotificationPermissionBanner() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [permission, setPermission] = useState(getNotificationPermission);
  const [dismissed, setDismissed] = useState(wasNotificationBannerDismissed);
  const [asking, setAsking] = useState(false);

  if (!isAuthenticated || !notificationsSupported() || permission !== 'default' || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-lg rounded-2xl border border-line bg-white p-4 shadow-lg md:bottom-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bell className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-header">{t('enableNotificationsTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('enableNotificationsLead')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={asking}
              onClick={() => {
                setAsking(true);
                void requestNotificationPermission().then((ok) => {
                  setPermission(ok ? 'granted' : getNotificationPermission());
                  setAsking(false);
                });
              }}
            >
              {t('enableNotificationsCta')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                dismissNotificationBanner();
                setDismissed(true);
              }}
            >
              {t('enableNotificationsLater')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
