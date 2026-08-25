import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { ActiveRequestBubble } from './ActiveRequestBubble';
import { AppDownloadBanner, isAppBannerDismissed } from './AppDownloadBanner';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { RequestStatusNotices } from './RequestStatusNotices';

export function AppShell() {
  const [bannerDismissed, setBannerDismissed] = useState(isAppBannerDismissed);

  return (
    <div className="min-h-dvh bg-page pb-20 md:pb-0">
      <AppDownloadBanner dismissed={bannerDismissed} onDismiss={() => setBannerDismissed(true)} />
      <AppHeader />
      <main className="mx-auto w-full max-w-[1100px] px-4 py-6">
        <Outlet />
      </main>
      <ActiveRequestBubble />
      <RequestStatusNotices />
      <BottomNav />
    </div>
  );
}
