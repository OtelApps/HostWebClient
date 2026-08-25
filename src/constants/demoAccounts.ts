export type GuestSegment = 'standard' | 'vip' | 'corporate' | 'returning';

export type DemoAccount = {
  reservation: string;
  surname: string;
  displayName: string;
  roomNumber: string;
  checkout: string;
  checkIn: string;
  segment: GuestSegment;
  email: string;
  phone: string;
  locale: 'cs' | 'en' | 'de' | 'fr';
  loyaltyPoints: number;
  stayCount: number;
  nationality: string;
  companyName?: string;
  marketingConsent: boolean;
  assignedStaffName: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    reservation: 'A1001',
    surname: 'Vetiska',
    displayName: 'Michal Vetiška',
    roomNumber: '101',
    checkIn: '09.07.2026',
    checkout: '12.07.2026',
    segment: 'standard',
    email: 'michal.vetiska@demo.otelapps.test',
    phone: '+420 601 100 101',
    locale: 'cs',
    loyaltyPoints: 0,
    stayCount: 1,
    nationality: 'CZ',
    marketingConsent: false,
    assignedStaffName: 'Recepce',
  },
  {
    reservation: 'B2002',
    surname: 'Kratky',
    displayName: 'Michal Krátký',
    roomNumber: '202',
    checkIn: '15.07.2026',
    checkout: '18.07.2026',
    segment: 'returning',
    email: 'michal.kratky@demo.otelapps.test',
    phone: '+420 602 200 202',
    locale: 'cs',
    loyaltyPoints: 40,
    stayCount: 3,
    nationality: 'CZ',
    marketingConsent: true,
    assignedStaffName: 'Concierge',
  },
  {
    reservation: 'C3003',
    surname: 'Milt',
    displayName: 'Lukáš Milt',
    roomNumber: '315',
    checkIn: '21.07.2026',
    checkout: '24.07.2026',
    segment: 'vip',
    email: 'lukas.milt@demo.otelapps.test',
    phone: '+420 603 300 315',
    locale: 'en',
    loyaltyPoints: 120,
    stayCount: 7,
    nationality: 'CZ',
    marketingConsent: true,
    assignedStaffName: 'Concierge',
  },
  {
    reservation: 'D4004',
    surname: 'Riha',
    displayName: 'Vojta Říha',
    roomNumber: '408',
    checkIn: '27.07.2026',
    checkout: '30.07.2026',
    segment: 'corporate',
    email: 'vojta.riha@demo.otelapps.test',
    phone: '+420 604 400 408',
    locale: 'de',
    loyaltyPoints: 25,
    stayCount: 2,
    nationality: 'CZ',
    companyName: 'ACME Corp s.r.o.',
    marketingConsent: false,
    assignedStaffName: 'Recepce',
  },
];

export function foldPersonName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function findDemoAccount(reservation: string, surname: string): DemoAccount | undefined {
  const res = reservation.trim().toUpperCase();
  const room = reservation.trim();
  const folded = foldPersonName(surname);
  if (!folded) return undefined;

  return DEMO_ACCOUNTS.find((account) => {
    const reservationMatches =
      account.reservation.toUpperCase() === res || account.roomNumber === room;
    if (!reservationMatches) return false;

    const aliases = [
      account.surname,
      account.displayName,
      account.displayName.split(/\s+/).pop() ?? '',
    ].map(foldPersonName);

    return aliases.includes(folded);
  });
}

export function demoAccountExternalId(account: DemoAccount): string {
  return `demo-${account.reservation}-${account.surname}`.toLowerCase();
}

export function parseCzDateToIso(dateStr: string): string | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dateStr.trim());
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 12, 0, 0));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
