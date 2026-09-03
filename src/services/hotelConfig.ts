import { getHotelSlug, rememberHotelPublicMeta } from '../lib/hotel';

export type HotelPublicConfig = {
  slug: string;
  name: string;
  app_name?: string;
  modules: Record<string, boolean>;
  geo?: { lat?: number | null; lng?: number | null };
  stores?: { app_store?: string; play_store?: string };
};

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, '');
}

function configBases(): string[] {
  const explicit = normalizeBaseUrl(import.meta.env.VITE_CONCIERGE_API_BASE ?? '');
  if (explicit) {
    return [explicit];
  }
  if (import.meta.env.DEV) {
    return [''];
  }
  const fromEnv = normalizeBaseUrl(import.meta.env.VITE_WEBADMIN_URL ?? '');
  return fromEnv ? [fromEnv] : [''];
}

export async function fetchHotelPublicConfig(): Promise<HotelPublicConfig> {
  const slug = getHotelSlug();
  const path = `/api/public/hotel/${encodeURIComponent(slug)}/config`;

  for (const base of configBases()) {
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`${base}${path}`, { signal: controller.signal });
      window.clearTimeout(timer);
      if (!response.ok) {
        continue;
      }
      const json = (await response.json()) as HotelPublicConfig;
      if (json && typeof json.slug === 'string' && json.modules && typeof json.modules === 'object') {
        rememberHotelPublicMeta({ geo: json.geo, stores: json.stores });
        return json;
      }
    } catch {
      // další kandidát
    }
  }

  throw new Error('Hotel config unavailable');
}
