import { getGuestIdentity } from '../../lib/guestIdentity';
import { getHotelSlug } from '../../lib/hotel';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';

export type ConciergeGuestLocale = 'cs' | 'en' | 'de' | 'fr' | 'pl';
export type ConciergeConversationStatus = 'open' | 'closed' | 'archived';
export type ConciergeSenderType = 'guest' | 'staff' | 'bot' | 'system';
export type ConciergeHandlerMode = 'bot' | 'waiting' | 'staff';

export function parseConciergeHandlerMode(value: unknown): ConciergeHandlerMode {
  if (value === 'staff' || value === 'waiting') return value;
  return 'bot';
}

const CONCIERGE_BAN_PREFIX = 'CONCIERGE_BANNED:';

export type ConciergeAccess = {
  allowed: boolean;
  reason: string | null;
  expires_at: string | null;
};

export class ConciergeBannedError extends Error {
  readonly code = 'concierge_banned';
  readonly reason: string;

  constructor(reason: string) {
    super(reason);
    this.name = 'ConciergeBannedError';
    this.reason = reason;
  }
}

function collectErrorText(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) {
    const extra = error as Error & { details?: unknown; hint?: unknown };
    return [extra.message, extra.details, extra.hint].filter((v) => typeof v === 'string').join(' ');
  }
  if (typeof error === 'object') {
    const o = error as Record<string, unknown>;
    return [o.message, o.details, o.hint].filter((v) => typeof v === 'string').join(' ');
  }
  return '';
}

export function parseConciergeBanReason(error: unknown): string | null {
  if (error instanceof ConciergeBannedError) return error.reason;
  if (typeof error === 'object' && error && (error as { code?: unknown }).code === 'concierge_banned') {
    return String((error as { reason?: unknown }).reason ?? '');
  }
  const text = collectErrorText(error);
  const idx = text.indexOf(CONCIERGE_BAN_PREFIX);
  if (idx >= 0) return text.slice(idx + CONCIERGE_BAN_PREFIX.length).trim();
  return null;
}

function throwIfBanned(error: unknown): void {
  const reason = parseConciergeBanReason(error);
  if (reason !== null) {
    throw new ConciergeBannedError(reason);
  }
}

export async function checkConciergeAccess(): Promise<ConciergeAccess> {
  if (!supabaseConfigured) {
    return { allowed: true, reason: null, expires_at: null };
  }

  const guest = await getGuestIdentity();
  const { data, error } = await getSupabase().rpc('check_guest_concierge_access', {
    p_hotel_slug: getHotelSlug(),
    p_guest_external_id: guest.guest_external_id,
  });

  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as
    | { allowed?: boolean; reason?: string | null; expires_at?: string | null }
    | undefined;

  if (!row || row.allowed !== false) {
    return { allowed: true, reason: null, expires_at: null };
  }

  return {
    allowed: false,
    reason: typeof row.reason === 'string' ? row.reason : '',
    expires_at: row.expires_at ?? null,
  };
}

export type ConciergeConversation = {
  id: string;
  guest_display_name: string;
  room_number: string | null;
  guest_locale: ConciergeGuestLocale;
  status: ConciergeConversationStatus;
  handler_mode?: ConciergeHandlerMode;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_guest_count: number;
  created_at: string;
  updated_at: string;
};

export type ConciergeCaseSummary = {
  id: string;
  summary: string;
  summary_cs: string | null;
  guest_locale: ConciergeGuestLocale;
  room_number: string | null;
  resolved_at: string;
};

export type ConciergeMessageAction = {
  id: string;
  label: string;
  type: 'navigate' | 'escalate';
  screen?: string;
  params?: Record<string, string | undefined>;
};

export type ConciergeMessagePayload = {
  card?: {
    title: string;
    subtitle?: string;
  };
  actions?: ConciergeMessageAction[];
};

export type ConciergeMessage = {
  id: string;
  sender_type: ConciergeSenderType;
  body: string;
  body_translated: string | null;
  locale: ConciergeGuestLocale | null;
  staff_display_name: string | null;
  created_at: string;
  payload?: ConciergeMessagePayload | null;
};

export const CONCIERGE_NAVIGABLE_SCREENS = [
  'RestaurantsAndBars',
  'LobbyBarMenu',
  'RestaurantMenu',
  'RoomServiceList',
  'RequestPageScreen',
  'TripPlanner',
  'WellnessSpaList',
  'PosilovnaSportList',
  'HotelInfoListScreen',
] as const;

export type ConciergeNavigableScreen = (typeof CONCIERGE_NAVIGABLE_SCREENS)[number];

export function isConciergeNavigableScreen(screen: string): screen is ConciergeNavigableScreen {
  return (CONCIERGE_NAVIGABLE_SCREENS as readonly string[]).includes(screen);
}

export function conciergeScreenToPath(
  screen: string,
  params?: Record<string, string | undefined>
): string {
  switch (screen) {
    case 'RestaurantsAndBars':
      return '/restaurants';
    case 'LobbyBarMenu':
      return `/restaurants/${params?.restaurantId ?? 'lobby-bar'}/menu/${params?.menuSlug ?? 'main'}`;
    case 'RestaurantMenu':
      return `/restaurants/${params?.restaurantId ?? 'food-mood'}/menu/${params?.menuSlug ?? 'menu'}`;
    case 'RoomServiceList':
    case 'RequestPageScreen':
      return '/requests';
    case 'TripPlanner':
      return '/app';
    case 'WellnessSpaList':
      return '/wellness';
    case 'PosilovnaSportList':
      return '/fitness';
    case 'HotelInfoListScreen':
      return '/info';
    default:
      return '/';
  }
}

export function getConciergeMessagePayload(message: ConciergeMessage): ConciergeMessagePayload {
  const raw = message.payload;
  if (!raw || typeof raw !== 'object') return {};
  return raw;
}

export function getConciergeMessageActions(message: ConciergeMessage): ConciergeMessageAction[] {
  const actions = getConciergeMessagePayload(message).actions;
  if (!Array.isArray(actions)) return [];
  return actions.filter(
    (a): a is ConciergeMessageAction =>
      Boolean(a) &&
      typeof a === 'object' &&
      typeof a.id === 'string' &&
      typeof a.label === 'string' &&
      (a.type === 'navigate' || a.type === 'escalate')
  );
}

const SATISFACTION_CHECK_MARKER = '__satisfaction_check__';
const STAFF_ONLY_NOTICE_MARKER = '__staff_only__';

const SATISFACTION_BUTTONS: Record<ConciergeGuestLocale, { yes: string; no: string }> = {
  cs: { yes: 'Ano', no: 'Ne' },
  en: { yes: 'Yes', no: 'No' },
  de: { yes: 'Ja', no: 'Nein' },
  fr: { yes: 'Oui', no: 'Non' },
  pl: { yes: 'Tak', no: 'Nie' },
};

export function isStaffOnlyConciergeMessage(message: ConciergeMessage): boolean {
  return (
    message.sender_type === 'system' && message.staff_display_name === STAFF_ONLY_NOTICE_MARKER
  );
}

export function isSatisfactionCheckMessage(message: ConciergeMessage): boolean {
  if (message.sender_type !== 'system') return false;
  const marker = message.staff_display_name ?? '';
  return marker === SATISFACTION_CHECK_MARKER || marker.startsWith(`${SATISFACTION_CHECK_MARKER}:`);
}

export function getSatisfactionAnswer(message: ConciergeMessage): 'yes' | 'no' | null {
  if (!isSatisfactionCheckMessage(message)) return null;
  const marker = message.staff_display_name ?? '';
  if (marker === SATISFACTION_CHECK_MARKER) return null;
  const answer = marker.slice(SATISFACTION_CHECK_MARKER.length + 1);
  return answer === 'yes' || answer === 'no' ? answer : null;
}

export function getSatisfactionButtonLabels(locale: ConciergeGuestLocale | null | undefined): {
  yes: string;
  no: string;
} {
  return SATISFACTION_BUTTONS[locale ?? 'en'] ?? SATISFACTION_BUTTONS.en;
}

const STATUS_LABELS: Record<ConciergeConversationStatus, string> = {
  open: 'Otevřeno',
  closed: 'Uzavřeno',
  archived: 'Archivováno',
};

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, '');
}

function webAdminBaseCandidates(): string[] {
  const explicit = normalizeBaseUrl(import.meta.env.VITE_CONCIERGE_API_BASE ?? '');
  if (explicit) return [explicit];
  if (import.meta.env.DEV) return [''];
  const fromEnv = normalizeBaseUrl(import.meta.env.VITE_WEBADMIN_URL ?? '');
  return fromEnv ? [fromEnv] : [''];
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function guestFacingApiError(text: string, fallback: string): string {
  let extracted = text.trim();
  try {
    const json = JSON.parse(text) as { message?: unknown };
    if (typeof json.message === 'string' && json.message.trim()) {
      extracted = json.message.trim();
    }
  } catch {
    // raw body
  }
  if (/SQLSTATE|pgsql:|supabase\.com|SQL:/i.test(extracted)) {
    return fallback;
  }
  return extracted || fallback;
}

async function fetchWebAdmin(
  path: string,
  init: RequestInit,
  options?: { timeoutMs?: number; retries?: number }
): Promise<Response> {
  const candidates = webAdminBaseCandidates();
  const timeoutMs = options?.timeoutMs ?? 12_000;
  const retries = Math.max(1, options?.retries ?? 1);
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    for (const base of candidates) {
      try {
        return await fetchWithTimeout(`${base}${path}`, init, timeoutMs);
      } catch (e) {
        lastError = e;
        console.warn(`[concierge] WebAdmin unreachable: ${base || '(relative)'}`, e);
      }
    }
    if (attempt + 1 < retries) {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }

  const detail =
    lastError instanceof Error
      ? lastError.name === 'AbortError'
        ? 'timeout'
        : lastError.message
      : 'unreachable';
  throw new Error(`WebAdmin unreachable (${detail})`);
}

export function getConciergeStatusLabel(status: ConciergeConversationStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function getConciergeMessageBody(message: ConciergeMessage): string {
  if (message.sender_type === 'guest') {
    return message.body;
  }
  return message.body_translated?.trim() || message.body;
}

export function formatConciergeTimestamp(iso: string | null): { date: string; time: string } {
  if (!iso) {
    return { date: '', time: '' };
  }

  const value = new Date(iso);
  return {
    date: value.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }),
    time: value.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

export async function fetchGuestConciergeConversations(): Promise<ConciergeConversation[]> {
  if (!supabaseConfigured) return [];

  const guest = await getGuestIdentity();
  const { data, error } = await getSupabase().rpc('get_guest_concierge_conversations', {
    p_guest_external_id: guest.guest_external_id,
  });

  if (error) throw error;
  return (data ?? []) as ConciergeConversation[];
}

export async function fetchGuestConciergeCaseSummaries(): Promise<ConciergeCaseSummary[]> {
  if (!supabaseConfigured) return [];

  const guest = await getGuestIdentity();
  const { data, error } = await getSupabase().rpc('get_guest_concierge_case_summaries', {
    p_guest_external_id: guest.guest_external_id,
  });

  if (error) {
    console.warn('[concierge] case summaries RPC', error.message);
    return [];
  }

  return (data ?? []) as ConciergeCaseSummary[];
}

export async function fetchGuestConciergeConversation(
  conversationId: string
): Promise<{
  id: string;
  guest_locale: ConciergeGuestLocale;
  status: string;
  handler_mode: ConciergeHandlerMode;
} | null> {
  if (!supabaseConfigured) return null;

  const guest = await getGuestIdentity();
  const { data, error } = await getSupabase().rpc('get_guest_concierge_conversation', {
    p_conversation_id: conversationId,
    p_guest_external_id: guest.guest_external_id,
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    id: row.id,
    guest_locale: row.guest_locale,
    status: row.status,
    handler_mode: parseConciergeHandlerMode(row.handler_mode),
  };
}

export async function fetchConciergeMessages(conversationId: string): Promise<ConciergeMessage[]> {
  if (!supabaseConfigured) return [];

  const guest = await getGuestIdentity();
  const { data, error } = await getSupabase().rpc('get_guest_concierge_messages', {
    p_conversation_id: conversationId,
    p_guest_external_id: guest.guest_external_id,
  });

  if (error) throw error;
  return ((data ?? []) as ConciergeMessage[]).filter((m) => !isStaffOnlyConciergeMessage(m));
}

export async function ensureConciergeConversation(input: {
  guestLocale: ConciergeGuestLocale;
  conversationId?: string;
}): Promise<string | null> {
  if (!supabaseConfigured) return null;

  const guest = await getGuestIdentity();
  const { data, error } = await getSupabase().rpc('ensure_guest_concierge_conversation', {
    p_hotel_slug: getHotelSlug(),
    p_guest_external_id: guest.guest_external_id,
    p_guest_display_name: guest.guest_display_name,
    p_room_number: guest.room_number,
    p_guest_locale: input.guestLocale,
    p_conversation_id: input.conversationId ?? null,
  });

  if (error) {
    throwIfBanned(error);
    throw error;
  }
  return typeof data === 'string' ? data : null;
}

export async function notifyConciergeBot(input: {
  conversationId: string;
  messageId: string;
}): Promise<ConciergeHandlerMode | null> {
  const guest = await getGuestIdentity();
  const response = await fetchWebAdmin('/api/concierge/guest/on-message', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_id: input.conversationId,
      guest_external_id: guest.guest_external_id,
      message_id: input.messageId,
    }),
  });

  if (!response.ok && response.status !== 202) {
    const text = await response.text();
    throw new Error(text || `Bot API HTTP ${response.status}`);
  }

  const json = (await response.json()) as { mode?: string };
  return parseConciergeHandlerMode(json.mode);
}

export type ConciergePresenceStatus = 'in_chat' | 'busy' | 'typing';

export type ConciergePeerPresence = {
  online: boolean;
  status: ConciergePresenceStatus | null;
  typing: boolean;
  in_chat?: boolean;
};

export async function touchConciergePresence(
  conversationId: string,
  status: ConciergePresenceStatus
): Promise<ConciergePeerPresence | null> {
  const guest = await getGuestIdentity();
  try {
    const response = await fetchWebAdmin('/api/concierge/guest/presence', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        guest_external_id: guest.guest_external_id,
        status,
      }),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { peer?: ConciergePeerPresence };
    const peer = json.peer;
    if (!peer) return null;
    return {
      online: Boolean(peer.online),
      status: (peer.status as ConciergePresenceStatus | null) ?? null,
      typing: Boolean(peer.typing),
      in_chat: Boolean(peer.in_chat ?? peer.online),
    };
  } catch {
    return null;
  }
}

export async function ensureConciergeBotReply(conversationId: string): Promise<boolean> {
  const guest = await getGuestIdentity();
  try {
    const response = await fetchWebAdmin('/api/concierge/guest/ensure-reply', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        guest_external_id: guest.guest_external_id,
      }),
    });
    if (!response.ok && response.status !== 202) return false;
    const json = (await response.json()) as { accepted?: boolean; processed?: boolean };
    return Boolean(json.accepted || json.processed);
  } catch {
    return false;
  }
}

export async function escalateConciergeToStaff(conversationId: string): Promise<void> {
  const guest = await getGuestIdentity();
  const response = await fetchWebAdmin('/api/concierge/guest/escalate', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      guest_external_id: guest.guest_external_id,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Escalate API HTTP ${response.status}`);
  }
}

export async function answerConciergeSatisfaction(input: {
  conversationId: string;
  messageId: string;
  answer: 'yes' | 'no';
}): Promise<{
  status: string;
  mode: ConciergeHandlerMode;
  summary: { id: string; summary: string } | null;
}> {
  const guest = await getGuestIdentity();
  const response = await fetchWebAdmin(
    '/api/concierge/guest/satisfaction',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: input.conversationId,
        guest_external_id: guest.guest_external_id,
        message_id: input.messageId,
        answer: input.answer,
      }),
    },
    { timeoutMs: 15_000, retries: 2 }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      guestFacingApiError(text, 'Chat se nepodařilo uzavřít. Zkuste to prosím znovu.')
    );
  }

  const json = (await response.json()) as {
    status?: string;
    mode?: string;
    summary?: { id: string; summary: string } | null;
  };
  return {
    status: json.status ?? 'open',
    mode: parseConciergeHandlerMode(json.mode),
    summary: json.summary ?? null,
  };
}

export async function sendConciergeMessage(input: {
  conversationId: string;
  body: string;
  locale: ConciergeGuestLocale;
}): Promise<{ messageId: string | null; handlerMode: ConciergeHandlerMode | null }> {
  if (!supabaseConfigured) return { messageId: null, handlerMode: null };

  const guest = await getGuestIdentity();
  const { data, error } = await getSupabase().rpc('send_guest_concierge_message', {
    p_conversation_id: input.conversationId,
    p_guest_external_id: guest.guest_external_id,
    p_body: input.body,
    p_locale: input.locale,
  });

  if (error) {
    throwIfBanned(error);
    throw error;
  }

  const messageId = typeof data === 'string' ? data : null;
  let handlerMode: ConciergeHandlerMode | null = null;

  if (messageId) {
    try {
      handlerMode = await notifyConciergeBot({
        conversationId: input.conversationId,
        messageId,
      });
    } catch (e) {
      console.warn('Concierge bot notify failed', e);
    }
  }

  return { messageId, handlerMode };
}

export async function markConciergeReadByGuest(conversationId: string): Promise<void> {
  if (!supabaseConfigured) return;

  const guest = await getGuestIdentity();
  const { error } = await getSupabase().rpc('mark_concierge_read_by_guest', {
    p_conversation_id: conversationId,
    p_guest_external_id: guest.guest_external_id,
  });

  if (error) throw error;
}
