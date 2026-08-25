export function getHotelSlug(): string {
  return import.meta.env.VITE_HOTEL_SLUG?.trim() || 'default';
}

export function getHotelCoords(): { lat: number; lng: number } {
  const lat = Number(import.meta.env.VITE_HOTEL_LAT);
  const lng = Number(import.meta.env.VITE_HOTEL_LNG);
  return {
    lat: Number.isFinite(lat) ? lat : 50.0875,
    lng: Number.isFinite(lng) ? lng : 14.4213,
  };
}

export function getAppStoreUrl(): string {
  return import.meta.env.VITE_APP_STORE_URL?.trim() ?? '';
}

export function getPlayStoreUrl(): string {
  return import.meta.env.VITE_PLAY_STORE_URL?.trim() ?? '';
}

export function isHttpUrl(value: string | null | undefined): boolean {
  return Boolean(value && /^https?:\/\//i.test(value));
}
