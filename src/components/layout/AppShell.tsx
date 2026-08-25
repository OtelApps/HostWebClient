import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { useConciergeNotifications } from '../../hooks/useConciergeNotifications';
import { unlockNotificationAudio } from '../../lib/webNotifications';
import { ActiveRequestBubble } from './ActiveRequestBubble';
import { AppDownloadBanner, isAppBannerDismissed } from './AppDownloadBanner';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { NotificationPermissionBanner } from './NotificationPermissionBanner';
import { RequestStatusNotices } from './RequestStatusNotices';

export function AppShell() {
  const [bannerDismissed, setBannerDismissed] = useState(isAppBannerDismissed);
  const navigate = useNavigate();
  useConciergeNotifications();

  useEffect(() => {
    const unlock = () => unlockNotificationAudio();
    document.addEventListener('pointerdown', unlock, { once: true });
    return () => document.removeEventListener('pointerdown', unlock);
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'otelapps-open' || typeof event.data.url !== 'string') return;
      navigate(event.data.url);
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [navigate]);

  return (
    <div className="min-h-dvh bg-page pb-20 md:pb-0">
      <AppDownloadBanner dismissed={bannerDismissed} onDismiss={() => setBannerDismissed(true)} />
      <AppHeader />
      <main className="mx-auto w-full max-w-[1100px] px-4 py-6">
        <Outlet />
      </main>
      <ActiveRequestBubble />
      <RequestStatusNotices />
      <NotificationPermissionBanner />
      <BottomNav />
    </div>
  );
}
