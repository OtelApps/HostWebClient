import { getSupabase, supabaseConfigured } from './supabase';

type HotelPublicMeta = {
  geo?: { lat?: number | null; lng?: number | null };
  stores?: { app_store?: string; play_store?: string };
};

let cachedPublicMeta: HotelPublicMeta | null = null;
const cachedHotelIds: Record<string, string | null> = {};

export function pathHotelSlug(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const match = window.location.pathname.match(/^\/h\/([a-z0-9]+(?:-[a-z0-9]+)*)/i);
  return match ? match[1].toLowerCase() : null;
}

export function getHotelSlug(): string {
  return pathHotelSlug() || import.meta.env.VITE_HOTEL_SLUG?.trim() || 'default';
}

export function hotelBasename(): string {
  return `/h/${getHotelSlug()}`;
}

export function ensureHotelPath(): boolean {
  if (pathHotelSlug()) {
    return true;
  }
  const slug = import.meta.env.VITE_HOTEL_SLUG?.trim() || 'default';
  const path = window.location.pathname;
  const suffix = path === '/' ? '/' : path;
  window.location.replace(`/h/${slug}${suffix}${window.location.search}${window.location.hash}`);
  return false;
}

export function rememberHotelPublicMeta(meta: HotelPublicMeta): void {
  cachedPublicMeta = meta;
}

export async function getHotelId(): Promise<string | null> {
  const slug = getHotelSlug();
  if (Object.prototype.hasOwnProperty.call(cachedHotelIds, slug)) {
    return cachedHotelIds[slug];
  }
  if (!supabaseConfigured) {
    cachedHotelIds[slug] = null;
    return null;
  }

  const { data, error } = await getSupabase()
    .from('hotels')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  cachedHotelIds[slug] = data?.id ?? null;
  return cachedHotelIds[slug];
}

export function getHotelCoords(): { lat: number; lng: number } {
  const fromConfigLat = cachedPublicMeta?.geo?.lat;
  const fromConfigLng = cachedPublicMeta?.geo?.lng;
  const lat = Number(fromConfigLat ?? import.meta.env.VITE_HOTEL_LAT);
  const lng = Number(fromConfigLng ?? import.meta.env.VITE_HOTEL_LNG);
  return {
    lat: Number.isFinite(lat) ? lat : 50.0875,
    lng: Number.isFinite(lng) ? lng : 14.4213,
  };
}

export function getAppStoreUrl(): string {
  const fromConfig = cachedPublicMeta?.stores?.app_store?.trim();
  if (fromConfig) {
    return fromConfig;
  }
  return import.meta.env.VITE_APP_STORE_URL?.trim() ?? '';
}

export function getPlayStoreUrl(): string {
  const fromConfig = cachedPublicMeta?.stores?.play_store?.trim();
  if (fromConfig) {
    return fromConfig;
  }
  return import.meta.env.VITE_PLAY_STORE_URL?.trim() ?? '';
}

export function isHttpUrl(value: string | null | undefined): boolean {
  return Boolean(value && /^https?:\/\//i.test(value));
}
