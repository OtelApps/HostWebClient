import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  ConciergeGuestLocale,
  ConciergeHandlerMode,
} from '../services/supabase/concierge';
import {
  answerConciergeSatisfaction,
  checkConciergeAccess,
  ensureConciergeBotReply,
  ensureConciergeConversation,
  escalateConciergeToStaff,
  fetchConciergeMessages,
  fetchGuestConciergeConversation,
  fetchGuestConciergeConversations,
  markConciergeReadByGuest,
  parseConciergeBanReason,
  parseConciergeHandlerMode,
  sendConciergeMessage,
  type ConciergeMessage,
} from '../services/supabase/concierge';

const POLL_MS = 2_000;
const TYPING_MAX_MS = 120_000;

export type ConciergeChatView = 'hub' | 'chat';

function lastIsBotReply(messages: ConciergeMessage[]): boolean {
  const last = messages[messages.length - 1];
  return last?.sender_type === 'bot' || last?.sender_type === 'system';
}

export function useConciergeChat(guestLocale: ConciergeGuestLocale | null) {
  const [view, setView] = useState<ConciergeChatView>('chat');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [handlerMode, setHandlerMode] = useState<ConciergeHandlerMode>('bot');
  const [conversationOpen, setConversationOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [startingNew, setStartingNew] = useState(false);
  const [sending, setSending] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [answeringSatisfactionId, setAnsweringSatisfactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bannedReason, setBannedReason] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const ensureBusyRef = useRef(false);
  const typingSinceRef = useRef<number | null>(null);
  const awaitingBotRef = useRef(false);
  const handlerModeRef = useRef<ConciergeHandlerMode>('bot');
  handlerModeRef.current = handlerMode;
  const viewRef = useRef(view);
  viewRef.current = view;
  const activeIdRef = useRef(activeConversationId);
  activeIdRef.current = activeConversationId;
  const bannedRef = useRef(bannedReason);
  bannedRef.current = bannedReason;

  const stopTyping = useCallback(() => {
    awaitingBotRef.current = false;
    typingSinceRef.current = null;
    setBotTyping(false);
  }, []);

  const startTyping = useCallback(() => {
    awaitingBotRef.current = true;
    typingSinceRef.current = Date.now();
    setBotTyping(true);
  }, []);

  const loadMessages = useCallback(
    async (targetConversationId: string) => {
      const data = await fetchConciergeMessages(targetConversationId);
      setMessages(data);
      await markConciergeReadByGuest(targetConversationId);

      let mode = handlerModeRef.current;
      try {
        const meta = await fetchGuestConciergeConversation(targetConversationId);
        if (!meta) throw new Error('missing');
        if (meta.handler_mode) {
          mode = parseConciergeHandlerMode(meta.handler_mode);
          setHandlerMode(mode);
        }
        if (meta.status !== 'open') {
          setConversationOpen(false);
          return false;
        }
        setConversationOpen(true);
      } catch {
        setConversationOpen(false);
        return false;
      }

      const last = data[data.length - 1];

      if (mode !== 'bot') {
        stopTyping();
      } else if (awaitingBotRef.current) {
        if (lastIsBotReply(data)) {
          stopTyping();
        } else if (typingSinceRef.current && Date.now() - typingSinceRef.current > TYPING_MAX_MS) {
          stopTyping();
        }
      } else if (last?.sender_type === 'guest') {
        startTyping();
      }

      if (
        last?.sender_type === 'guest' &&
        !ensureBusyRef.current &&
        Date.now() - new Date(last.created_at).getTime() > 1500
      ) {
        ensureBusyRef.current = true;
        try {
          await ensureConciergeBotReply(targetConversationId);
        } finally {
          ensureBusyRef.current = false;
        }
      }

      return true;
    },
    [startTyping, stopTyping]
  );

  const startNewChat = useCallback(async () => {
    if (!guestLocale) return false;
    setStartingNew(true);
    setError(null);
    try {
      const access = await checkConciergeAccess();
      if (!access.allowed) {
        setBannedReason(access.reason ?? '');
        return false;
      }
      setBannedReason(null);
      const id = await ensureConciergeConversation({ guestLocale });
      if (!id) {
        setError('Nepodařilo se založit nový chat.');
        return false;
      }
      setActiveConversationId(id);
      setMessages([]);
      setHandlerMode('bot');
      setConversationOpen(true);
      setView('chat');
      await loadMessages(id);
      return true;
    } catch (e) {
      const banReason = parseConciergeBanReason(e);
      if (banReason !== null) {
        setBannedReason(banReason);
        return false;
      }
      setError(e instanceof Error ? e.message : 'Nepodařilo se založit chat.');
      return false;
    } finally {
      setStartingNew(false);
    }
  }, [guestLocale, loadMessages]);

  const refresh = useCallback(async () => {
    if (!guestLocale) return;
    setLoading(true);
    setError(null);
    try {
      const access = await checkConciergeAccess();
      if (!access.allowed) {
        setBannedReason(access.reason ?? '');
        return;
      }
      setBannedReason(null);
      const openList = await fetchGuestConciergeConversations();
      const open = openList.find((c) => c.status === 'open');
      if (open) {
        setActiveConversationId(open.id);
        const ok = await loadMessages(open.id);
        if (ok) {
          setView('chat');
          return;
        }
      }
      await startNewChat();
    } catch (e) {
      const banReason = parseConciergeBanReason(e);
      if (banReason !== null) {
        setBannedReason(banReason);
        return;
      }
      setError(e instanceof Error ? e.message : 'Nepodařilo se načíst chat.');
      setView('chat');
    } finally {
      setLoading(false);
    }
  }, [guestLocale, loadMessages, startNewChat]);

  const send = useCallback(
    async (body: string) => {
      if (!guestLocale || !activeConversationId) return false;
      setSending(true);
      setError(null);
      try {
        if (handlerModeRef.current === 'bot') startTyping();
        const result = await sendConciergeMessage({
          conversationId: activeConversationId,
          body,
          locale: guestLocale,
        });
        if (result.handlerMode) setHandlerMode(parseConciergeHandlerMode(result.handlerMode));
        try {
          await loadMessages(activeConversationId);
        } catch {
          // already sent
        }
        return true;
      } catch (e) {
        stopTyping();
        const banReason = parseConciergeBanReason(e);
        if (banReason !== null) {
          setBannedReason(banReason);
          return false;
        }
        setError(e instanceof Error ? e.message : 'Nepodařilo se odeslat zprávu.');
        return false;
      } finally {
        setSending(false);
      }
    },
    [activeConversationId, guestLocale, loadMessages, startTyping, stopTyping]
  );

  const escalate = useCallback(async () => {
    if (!activeConversationId) return false;
    setEscalating(true);
    stopTyping();
    try {
      await escalateConciergeToStaff(activeConversationId);
      setHandlerMode('waiting');
      await loadMessages(activeConversationId);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodařilo se spojit s recepcí.');
      return false;
    } finally {
      setEscalating(false);
    }
  }, [activeConversationId, loadMessages, stopTyping]);

  const answerSatisfaction = useCallback(
    async (messageId: string, answer: 'yes' | 'no') => {
      if (!activeConversationId) return false;
      setAnsweringSatisfactionId(messageId);
      try {
        const result = await answerConciergeSatisfaction({
          conversationId: activeConversationId,
          messageId,
          answer,
        });
        if (result.status === 'deleted' || answer === 'yes') {
          await startNewChat();
          return true;
        }
        setHandlerMode(result.mode);
        await loadMessages(activeConversationId);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Nepodařilo se odeslat odpověď.');
        return false;
      } finally {
        setAnsweringSatisfactionId(null);
      }
    },
    [activeConversationId, guestLocale, loadMessages, startNewChat]
  );

  useEffect(() => {
    if (!guestLocale) return undefined;
    void refresh();
    pollRef.current = window.setInterval(() => {
      if (bannedRef.current !== null) return;
      if (viewRef.current !== 'chat' || !activeIdRef.current) return;
      void loadMessages(activeIdRef.current);
    }, POLL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [guestLocale, loadMessages, refresh]);

  return {
    view,
    messages,
    loading,
    startingNew,
    sending,
    escalating,
    botTyping,
    handlerMode,
    conversationOpen,
    answeringSatisfactionId,
    activeConversationId,
    error,
    bannedReason,
    canSend: Boolean(
      guestLocale && activeConversationId && conversationOpen && view === 'chat' && !sending && bannedReason === null
    ),
    refresh,
    startNewChat,
    send,
    escalate,
    answerSatisfaction,
  };
}
