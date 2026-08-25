# HostWebClient

Webová verze mobilní host appky [OtelApps](../OtelApps). Host si v prohlížeči prohlédne hotel, objedná služby a chatuje s concierge. Cílem není nahradit telefon — některé funkce dávají smysl jen v nativní appce, web na ně odkazuje a vybízí ke stažení.

Administrace pro recepci je samostatný projekt: [OtelApps-WebAdmin](../OtelApps-WebAdmin).

## Co umí

Prohlížení **bez přihlášení**:

- informace o hotelu, nabídka pokojů, parkování
- restaurace a bary včetně menu
- wellness / fitness, hotelový program
- mapa Prahy, doprava

Po **přihlášení** (číslo rezervace + příjmení + datum odjezdu):

- pokojová služba, úklid, doplňky, údržba
- sledování stavu požadavků
- profil a informace o pobytu

**Concierge chat** (AI bot → čekání na recepci → živá obsluha) funguje i bez loginu; identita hosta se drží v `localStorage`.

Jazyky: čeština, angličtina, němčina.

## Co zůstává v mobilní appce

Tyto dlaždice na webu vedou na `/app`:

- digitální klíč od pokoje
- push notifikace
- online check-in
- trip planner („Kam zajít?“)

Odkazy do App Store / Google Play se berou z env (`VITE_APP_STORE_URL`, `VITE_PLAY_STORE_URL`). Když jsou prázdné, zůstane landing s vysvětlením.

## Stack

| Vrstva | Technologie |
|--------|-------------|
| UI | React 19, React Router 7, Tailwind CSS 4, Vite 7 |
| Data | TanStack Query 5, `@supabase/supabase-js` |
| i18n | i18next (`cs` / `en` / `de`) |
| Mapa | Leaflet + react-leaflet |
| Identita hosta | `localStorage` (stejné klíče jako mobilní AsyncStorage) |

**Žádné staff API.** Obsah, požadavky a chat data jdou přímo do Supabase (anon klíč + RPC), stejně jako v mobilu. Concierge AI orchestrátor je Laravel WebAdmin:

`POST /api/concierge/guest/{on-message,ensure-reply,escalate,satisfaction,presence}`

```
Prohlížeč
  ├─ Supabase (anon)     → katalogy, service requests, concierge CRUD
  └─ WebAdmin Laravel    → bot, překlad, eskalace, presence
```

## Rychlý start

```bash
cp .env.example .env    # doplň VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY
npm install
npm run dev             # http://127.0.0.1:5173
```

Stejné Supabase údaje jako v mobilní appce (`EXPO_PUBLIC_*` → `VITE_*`).

### Concierge (volitelné, ale potřeba pro bota)

1. Spusť WebAdmin: `php artisan serve` (a queue worker, viz README WebAdminu).
2. V `.env` nech `VITE_WEBADMIN_URL=http://127.0.0.1:8000`.
3. Vite v devu proxyuje `/api/concierge/guest` na tenhle origin (bez CORS).

V produkci buď reverse proxy na stejné doméně, nebo nastav `VITE_CONCIERGE_API_BASE` / CORS ve WebAdminu (`CORS_ALLOWED_ORIGINS`, `config/cors.php`).

```bash
npm run build
npm run preview
```

## Přihlášení

Formulář: číslo rezervace + příjmení + datum odjezdu (`dd.mm.rrrr`).

Demo účty (shoda s mobilní appkou):

| Rezervace | Příjmení | Pokoj |
|-----------|----------|-------|
| `A1001` | Vetiska | 101 |
| `B2002` | Kratky | 202 |
| `C3003` | Milt | 315 |
| `D4004` | Riha | 408 |

Jiná kombinace vytvoří ad-hoc identitu `demo-{rezervace}-{příjmení}`. Session flag je v `localStorage` (`otelapps_web_authenticated`).

Chráněné routy: `/requests/*`, `/orders`. Zbytek je veřejný.

## Env

| Proměnná | Účel |
|----------|------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | anon / publishable klíč (ne service role) |
| `VITE_WEBADMIN_URL` | Laravel origin pro Vite proxy v `npm run dev` |
| `VITE_CONCIERGE_API_BASE` | produkce: jiný origin concierge API; prázdné = relativní `/api/...` |
| `VITE_HOTEL_SLUG` | hotel v RPC, default `default` |
| `VITE_HOTEL_LAT` / `VITE_HOTEL_LNG` | střed mapy |
| `VITE_APP_STORE_URL` / `VITE_PLAY_STORE_URL` | odkazy na nativní appku |

## Routy

| Cesta | Popis |
|-------|--------|
| `/` | Home |
| `/info`, `/info/:slug` | Informace o hotelu |
| `/rooms`, `/rooms/:slug` | Nabídka pokojů |
| `/parking`, `/parking/:slug` | Parkování |
| `/restaurants`, `/restaurants/:slug`, `.../menu/...` | Restaurace, bary, menu |
| `/wellness`, `/fitness` | Relax & sport |
| `/program` | Hotelový program |
| `/map`, `/transport` | Praha |
| `/chat` | Concierge |
| `/signin`, `/profile`, `/stay` | Účet |
| `/requests/*`, `/orders` | Požadavky (login) |
| `/app` | Stáhnout mobilní appku |

## Struktura

```
src/
  lib/                supabase, identita hosta, hotel env
  services/supabase/  port datové vrstvy z OtelApps
  hooks/              concierge chat + odeslání požadavku
  contexts/           auth, service requests
  components/layout/  shell, banner, navigace
  pages/              obrazovky
  locales/            cs / en / de
```

Datové služby jsou zkopírované z mobilu (`OtelApps/src/services/supabase`), ne sdílený npm balíček. Obrazovky jsou nativní web UI, ne React Native.

## Související repo

- [OtelApps](../OtelApps) — Expo / React Native appka pro hosty
- [OtelApps-WebAdmin](../OtelApps-WebAdmin) — Laravel + React administrace, concierge AI
