/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_WEBADMIN_URL: string;
  readonly VITE_CONCIERGE_API_BASE?: string;
  readonly VITE_HOTEL_SLUG: string;
  readonly VITE_HOTEL_LAT: string;
  readonly VITE_HOTEL_LNG: string;
  readonly VITE_APP_STORE_URL: string;
  readonly VITE_PLAY_STORE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
