import type { DemoAccount } from '../constants/demoAccounts';
import {
  demoAccountExternalId,
  findDemoAccount,
  parseCzDateToIso,
} from '../constants/demoAccounts';

const STORAGE_KEYS = {
  guestExternalId: 'otelapps_guest_external_id',
  guestDisplayName: 'otelapps_guest_display_name',
  guestRoomNumber: 'otelapps_guest_room_number',
  guestProfileExtra: 'otelapps_guest_profile_extra',
} as const;

export type GuestSegment = 'standard' | 'vip' | 'corporate' | 'returning';

export type GuestProfileExtra = {
  reservation_number?: string;
  email?: string;
  phone?: string;
  locale?: string;
  segment?: GuestSegment;
  check_in_at?: string;
  check_out_at?: string;
  loyalty_points?: number;
  stay_count?: number;
  nationality?: string;
  company_name?: string;
  marketing_consent?: boolean;
  assigned_staff_name?: string;
};

export type GuestIdentity = {
  guest_external_id: string;
  guest_display_name: string;
  room_number: string;
} & GuestProfileExtra;

const DEFAULT_GUEST: GuestIdentity = {
  guest_external_id: '',
  guest_display_name: 'Host',
  room_number: '',
  locale: 'cs',
  segment: 'standard',
};

function createGuestExternalId(): string {
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseProfileExtra(raw: string | null): GuestProfileExtra {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as GuestProfileExtra;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function extractProfileExtra(identity: Partial<GuestIdentity>): GuestProfileExtra {
  const extra: GuestProfileExtra = {};
  const fields: (keyof GuestProfileExtra)[] = [
    'reservation_number',
    'email',
    'phone',
    'locale',
    'segment',
    'check_in_at',
    'check_out_at',
    'loyalty_points',
    'stay_count',
    'nationality',
    'company_name',
    'marketing_consent',
    'assigned_staff_name',
  ];

  for (const field of fields) {
    if (identity[field] !== undefined) {
      (extra as Record<string, unknown>)[field] = identity[field];
    }
  }

  return extra;
}

export async function getGuestIdentity(): Promise<GuestIdentity> {
  const storedId = localStorage.getItem(STORAGE_KEYS.guestExternalId);
  const storedName = localStorage.getItem(STORAGE_KEYS.guestDisplayName);
  const storedRoom = localStorage.getItem(STORAGE_KEYS.guestRoomNumber);
  const storedExtra = localStorage.getItem(STORAGE_KEYS.guestProfileExtra);

  let guestExternalId = storedId;
  if (!guestExternalId) {
    guestExternalId = createGuestExternalId();
    localStorage.setItem(STORAGE_KEYS.guestExternalId, guestExternalId);
  }

  const extra = parseProfileExtra(storedExtra);
  const demo =
    findDemoAccount(extra.reservation_number ?? '', storedName ?? '') ??
    findDemoAccount(storedRoom ?? '', storedName ?? '');

  if (demo) {
    const identity = demoAccountToIdentity(demo);
    if (
      storedId !== identity.guest_external_id ||
      storedName !== identity.guest_display_name ||
      storedRoom !== identity.room_number
    ) {
      void saveGuestIdentity(identity);
    }
    return identity;
  }

  return {
    guest_external_id: guestExternalId,
    guest_display_name: storedName?.trim() || DEFAULT_GUEST.guest_display_name,
    room_number: storedRoom?.trim() || DEFAULT_GUEST.room_number,
    locale: extra.locale ?? DEFAULT_GUEST.locale,
    segment: extra.segment ?? DEFAULT_GUEST.segment,
    ...extra,
  };
}

export async function saveGuestIdentity(partial: Partial<GuestIdentity>): Promise<void> {
  if (partial.guest_external_id) {
    localStorage.setItem(STORAGE_KEYS.guestExternalId, partial.guest_external_id);
  }
  if (partial.guest_display_name) {
    localStorage.setItem(STORAGE_KEYS.guestDisplayName, partial.guest_display_name);
  }
  if (partial.room_number !== undefined) {
    localStorage.setItem(STORAGE_KEYS.guestRoomNumber, partial.room_number);
  }

  const extra = extractProfileExtra(partial);
  if (Object.keys(extra).length > 0) {
    const current = parseProfileExtra(localStorage.getItem(STORAGE_KEYS.guestProfileExtra));
    localStorage.setItem(STORAGE_KEYS.guestProfileExtra, JSON.stringify({ ...current, ...extra }));
  }
}

export function clearGuestIdentity(): void {
  localStorage.removeItem(STORAGE_KEYS.guestDisplayName);
  localStorage.removeItem(STORAGE_KEYS.guestRoomNumber);
  localStorage.removeItem(STORAGE_KEYS.guestProfileExtra);
  localStorage.setItem(STORAGE_KEYS.guestExternalId, createGuestExternalId());
}

export function demoAccountToIdentity(account: DemoAccount): GuestIdentity {
  return {
    guest_external_id: demoAccountExternalId(account),
    guest_display_name: account.displayName,
    room_number: account.roomNumber,
    reservation_number: account.reservation,
    email: account.email,
    phone: account.phone,
    locale: account.locale,
    segment: account.segment,
    check_in_at: parseCzDateToIso(account.checkIn) ?? undefined,
    check_out_at: parseCzDateToIso(account.checkout) ?? undefined,
    loyalty_points: account.loyaltyPoints,
    stay_count: account.stayCount,
    nationality: account.nationality,
    company_name: account.companyName,
    marketing_consent: account.marketingConsent,
    assigned_staff_name: account.assignedStaffName,
  };
}

export function buildGuestIdentityFromSignIn(input: {
  reservation: string;
  surname: string;
  checkout: string;
}): GuestIdentity {
  const demo = findDemoAccount(input.reservation, input.surname);
  if (demo) {
    return demoAccountToIdentity(demo);
  }

  const checkoutIso = parseCzDateToIso(input.checkout);
  const externalId = `demo-${input.reservation}-${input.surname}`.toLowerCase();

  return {
    guest_external_id: externalId,
    guest_display_name: input.surname.trim(),
    room_number: input.reservation.trim(),
    reservation_number: input.reservation.trim(),
    check_out_at: checkoutIso ?? undefined,
    locale: 'cs',
    segment: 'standard',
  };
}
