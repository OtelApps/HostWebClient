import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';

import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { getHotelCoords } from '../lib/hotel';
import { fetchHotelPlaces } from '../services/supabase/places';

const hotelIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export function MapPage() {
  const { t } = useTranslation();
  const hotel = getHotelCoords();
  const [selected, setSelected] = useState<string | null>(null);
  const query = useQuery({ queryKey: ['places'], queryFn: fetchHotelPlaces });

  const center = useMemo(() => {
    const place = query.data?.find((p) => p.slug === selected);
    if (place) return [place.latitude, place.longitude] as [number, number];
    return [hotel.lat, hotel.lng] as [number, number];
  }, [hotel.lat, hotel.lng, query.data, selected]);

  return (
    <div>
      <PageHeader title={t('pragueMapTitle')} backTo="/" />
      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? <ErrorBlock onRetry={() => void query.refetch()} /> : null}
      <div className="overflow-hidden rounded-3xl border border-line">
        <div className="h-[420px]">
          <MapContainer center={center} zoom={14} scrollWheelZoom className="h-full w-full">
            <Recenter lat={center[0]} lng={center[1]} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[hotel.lat, hotel.lng]} icon={hotelIcon}>
              <Popup>{t('hotel')}</Popup>
            </Marker>
            {query.data?.map((place) => (
              <Marker
                key={place.id}
                position={[place.latitude, place.longitude]}
                icon={hotelIcon}
                eventHandlers={{ click: () => setSelected(place.slug) }}
              >
                <Popup>
                  <strong>{place.name}</strong>
                  <br />
                  {place.description}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {query.data?.length === 0 ? <EmptyBlock /> : null}
        {query.data?.map((place) => (
          <li key={place.id}>
            <button
              type="button"
              onClick={() => setSelected(place.slug)}
              className="w-full rounded-2xl border border-line bg-white p-4 text-left hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-header">{place.name}</h3>
                {place.is_recommended ? (
                  <span className="text-xs font-semibold text-accent">{t('recommended')}</span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{place.description}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
