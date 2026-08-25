import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import { getGuestIdentity } from '../lib/guestIdentity';
import { supabaseConfigured } from '../lib/supabase';
import { showGuestNotification } from '../lib/webNotifications';
import {
  fetchConciergeMessages,
  fetchGuestConciergeConversations,
  getConciergeMessageBody,
  isStaffOnlyConciergeMessage,
  type ConciergeMessage,
} from '../services/supabase/concierge';

const POLL_MS = 4_000;
const LAST_KEY = 'otelapps_web_concierge_last_notified';

type LastSeen = { conversationId: string; messageId: string };

function readLastSeen(guestId: string): LastSeen | null {
  try {
    const raw = localStorage.getItem(`${LAST_KEY}:${guestId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastSeen;
    if (!parsed?.conversationId || !parsed?.messageId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLastSeen(guestId: string, seen: LastSeen): void {
  localStorage.setItem(`${LAST_KEY}:${guestId}`, JSON.stringify(seen));
}

function isIncoming(message: ConciergeMessage): boolean {
  return message.sender_type !== 'guest' && !isStaffOnlyConciergeMessage(message);
}

export function useConciergeNotifications() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;
  const busyRef = useRef(false);

  useEffect(() => {
    if (!supabaseConfigured || !isAuthenticated) return undefined;

    const tick = async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const guest = await getGuestIdentity();
        if (!guest.guest_external_id) return;
        const open = (await fetchGuestConciergeConversations()).find((c) => c.status === 'open');
        if (!open) return;

        const messages = await fetchConciergeMessages(open.id);
        const incoming = messages.filter(isIncoming);
        const last = incoming[incoming.length - 1];
        if (!last) return;

        const prev = readLastSeen(guest.guest_external_id);
        writeLastSeen(guest.guest_external_id, { conversationId: open.id, messageId: last.id });

        if (!prev) return;
        if (prev.conversationId === open.id && prev.messageId === last.id) return;

        const onChat = pathRef.current === '/chat';
        const looking = onChat && document.visibilityState === 'visible';
        if (looking) return;

        const body = getConciergeMessageBody(last).trim() || t('conciergeNewMessage');
        await showGuestNotification({
          title: t('conciergeNotifyTitle'),
          body: body.slice(0, 140),
          url: '/chat',
          tag: `concierge-${open.id}`,
        });
      } catch {
        // offline / RPC
      } finally {
        busyRef.current = false;
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAuthenticated, t]);
}
