import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react';

import { Button, LoadingBlock } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { useConciergeChat } from '../hooks/useConciergeChat';
import { useConciergeLiveChannel } from '../hooks/useConciergeLiveChannel';
import {
  conciergeScreenToPath,
  getConciergeMessageActions,
  getConciergeMessageBody,
  getSatisfactionAnswer,
  getSatisfactionButtonLabels,
  isSatisfactionCheckMessage,
  type ConciergeGuestLocale,
} from '../services/supabase/concierge';

const LOCALES: ConciergeGuestLocale[] = ['cs', 'en', 'de'];

export function ChatPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = (LOCALES.includes(i18n.language.slice(0, 2) as ConciergeGuestLocale)
    ? i18n.language.slice(0, 2)
    : 'cs') as ConciergeGuestLocale;
  const chat = useConciergeChat(locale);
  const live = useConciergeLiveChannel(
    chat.activeConversationId,
    chat.view === 'chat' && chat.bannedReason === null,
  );
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages.length, chat.botTyping]);

  const title =
    chat.handlerMode === 'waiting'
      ? t('onlineChatWaitingTitle')
      : chat.handlerMode === 'staff'
        ? t('onlineChatTitle')
        : t('onlineChatBotTitle');

  if (chat.bannedReason !== null) {
    return (
      <div className="flex min-h-[70vh] flex-col">
        <PageHeader title={t('conciergeAccessDeniedTitle')} backTo="/" />
        <div className="mx-auto max-w-lg flex-1 px-4 py-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900">{t('conciergeAccessDeniedTitle')}</h2>
          <p className="mt-3 text-sm text-muted">{t('conciergeAccessDeniedLead')}</p>
          <p className="mt-4 whitespace-pre-wrap text-base font-semibold text-red-700">
            {chat.bannedReason}
          </p>
        </div>
      </div>
    );
  }

  if ((chat.loading || chat.startingNew) && chat.messages.length === 0) {
    return <LoadingBlock />;
  }

  const labels = getSatisfactionButtonLabels(locale);

  return (
    <div className="flex min-h-[70vh] flex-col">
      <PageHeader title={title} backTo="/" />
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span>
          {live.peerOnline ? t('online') : ''}
          {live.peerTyping || chat.botTyping ? ` · ${t('typing')}` : ''}
        </span>
        {chat.handlerMode === 'bot' ? (
          <Button
            variant="ghost"
            className="px-3 py-1 text-xs"
            disabled={chat.escalating}
            onClick={() => {
              if (window.confirm(t('conciergeEscalateConfirm'))) void chat.escalate();
            }}
          >
            {t('conciergeEscalateCta')}
          </Button>
        ) : null}
      </div>
      {chat.error ? <p className="mb-2 text-sm text-red-600">{chat.error}</p> : null}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl border border-line bg-white p-4">
        {chat.messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            {chat.handlerMode === 'waiting'
              ? t('conciergeWaitingEmpty')
              : chat.handlerMode === 'staff'
                ? t('conciergeStaffEmpty')
                : t('conciergeBotEmpty')}
          </p>
        ) : null}
        {chat.messages.map((message) => {
          const mine = message.sender_type === 'guest';
          const satisfaction = isSatisfactionCheckMessage(message);
          const answered = getSatisfactionAnswer(message);
          const actions = getConciergeMessageActions(message);
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine ? 'bg-primary text-white' : 'bg-gray-100 text-ink'
                }`}
              >
                <p className="whitespace-pre-wrap">{getConciergeMessageBody(message)}</p>
                {satisfaction ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={Boolean(answered) || chat.answeringSatisfactionId === message.id}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-header"
                      onClick={() => void chat.answerSatisfaction(message.id, 'yes')}
                    >
                      {labels.yes}
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(answered) || chat.answeringSatisfactionId === message.id}
                      className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-header"
                      onClick={() => void chat.answerSatisfaction(message.id, 'no')}
                    >
                      {labels.no}
                    </button>
                  </div>
                ) : null}
                {actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className="mt-2 block rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-header"
                    onClick={() => {
                      if (action.type === 'escalate') {
                        void chat.escalate();
                        return;
                      }
                      if (action.screen) navigate(conciergeScreenToPath(action.screen, action.params));
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {chat.botTyping ? <p className="text-xs text-muted">{t('typing')}</p> : null}
        <div ref={bottomRef} />
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body = draft.trim();
          if (!body || !chat.canSend) return;
          setDraft('');
          void chat.send(body);
        }}
      >
        <input
          className="flex-1 rounded-2xl border border-line px-4 py-3"
          value={draft}
          maxLength={500}
          placeholder={
            chat.handlerMode === 'waiting'
              ? t('messagePlaceholderWaiting')
              : chat.handlerMode === 'staff'
                ? t('messagePlaceholder')
                : t('messagePlaceholderBot')
          }
          onChange={(e) => {
            setDraft(e.target.value);
            live.notifyTyping();
          }}
          disabled={!chat.canSend}
        />
        <Button type="submit" disabled={!chat.canSend || !draft.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
