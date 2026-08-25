import { useCallback, useEffect, useRef, useState } from 'react';

import {
  touchConciergePresence,
  type ConciergePresenceStatus,
} from '../services/supabase/concierge';

const HEARTBEAT_MS = 4000;
const TYPING_IDLE_MS = 2500;

export function useConciergeLiveChannel(conversationId: string | null, enabled = true) {
  const [peerOnline, setPeerOnline] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const typingUntilRef = useRef(0);
  const inFlightRef = useRef(false);
  const visibleRef = useRef(document.visibilityState === 'visible');

  const resolveStatus = useCallback((): ConciergePresenceStatus => {
    if (!visibleRef.current) return 'busy';
    if (Date.now() < typingUntilRef.current) return 'typing';
    return 'in_chat';
  }, []);

  const beat = useCallback(async () => {
    if (!conversationId || !enabled || inFlightRef.current) return;
    if (!visibleRef.current) {
      setPeerOnline(false);
      setPeerTyping(false);
      return;
    }
    inFlightRef.current = true;
    try {
      const peer = await touchConciergePresence(conversationId, resolveStatus());
      if (peer) {
        setPeerOnline(peer.online);
        setPeerTyping(peer.typing);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [conversationId, enabled, resolveStatus]);

  const notifyTyping = useCallback(() => {
    typingUntilRef.current = Date.now() + TYPING_IDLE_MS;
    void beat();
  }, [beat]);

  useEffect(() => {
    if (!enabled || !conversationId) {
      setPeerOnline(false);
      setPeerTyping(false);
      return undefined;
    }

    void beat();
    const interval = window.setInterval(() => void beat(), HEARTBEAT_MS);

    const onVisibility = () => {
      visibleRef.current = document.visibilityState === 'visible';
      if (visibleRef.current) void beat();
      else {
        typingUntilRef.current = 0;
        void touchConciergePresence(conversationId, 'busy');
        setPeerTyping(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
      typingUntilRef.current = 0;
      void touchConciergePresence(conversationId, 'busy');
      setPeerOnline(false);
      setPeerTyping(false);
    };
  }, [beat, conversationId, enabled]);

  return { peerOnline, peerTyping, notifyTyping };
}
