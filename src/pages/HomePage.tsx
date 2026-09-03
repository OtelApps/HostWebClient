import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../contexts/AuthContext';
import { useHotelModules } from '../contexts/ModulesContext';
import {
  markLoginPromptShown,
  useLoginPrompt,
  wasLoginPromptDismissed,
} from '../contexts/LoginPromptContext';
import { fetchRelaxSportHomeAreas } from '../services/supabase/relaxSport';
import { HOME_SLIDER_KEYS, resolveImageUrl } from '../lib/images';
import { cn } from '../lib/cn';

type TileProps = {
  to: string;
  title: string;
  imageKey: string;
  accent?: boolean;
  protectedPath?: boolean;
  moduleKey?: string;
};

function Tile({ to, title, imageKey, accent, protectedPath, moduleKey }: TileProps) {
  const { isEnabled } = useHotelModules();
  const { tryProtectedPath } = useLoginPrompt();
  if (moduleKey && !isEnabled(moduleKey)) {
    return null;
  }
  const src = resolveImageUrl(imageKey);

  const inner = (
    <>
      {src ? (
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-header to-primary" />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
      <span className="relative z-10 font-serif text-xl text-white">{title}</span>
    </>
  );

  const cls = cn(
    'relative flex min-h-28 items-end overflow-hidden rounded-2xl p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
    accent && 'ring-2 ring-accent'
  );

  if (protectedPath) {
    return (
      <button type="button" className={cn(cls, 'w-full text-left')} onClick={() => tryProtectedPath(to)}>
        {inner}
      </button>
    );
  }

  return (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const { isEnabled } = useHotelModules();
  const { isAuthenticated } = useAuth();
  const { openLoginPrompt } = useLoginPrompt();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const relax = useQuery({
    queryKey: ['relax-home'],
    queryFn: fetchRelaxSportHomeAreas,
  });

  useEffect(() => {
    if (!isAuthenticated && !wasLoginPromptDismissed()) {
      markLoginPromptShown();
      openLoginPrompt('/');
    }
  }, [isAuthenticated, openLoginPrompt]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((i) => (i + 1) % HOME_SLIDER_KEYS.length);
    }, 8000);
    return () => window.clearInterval(id);
  }, []);

  const slideSrc = resolveImageUrl(HOME_SLIDER_KEYS[slide]);

  return (
    <div className="space-y-8">
      <section className="relative min-h-64 overflow-hidden rounded-3xl text-white shadow-lg">
        {slideSrc ? (
          <img
            src={slideSrc}
            alt=""
            className="absolute inset-0 size-full object-cover transition-opacity duration-700"
          />
        ) : null}
        <div className="absolute inset-0 bg-linear-to-r from-header/90 to-header/40" />
        <div className="relative p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-white/70">OtelApps</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">{t('welcome')}</h1>
          <p className="mt-2 max-w-xl text-white/80">
            {isAuthenticated ? t('downloadAppSubtitle') : t('loginPromptSubtitle')}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-header"
              onClick={() =>
                isAuthenticated ? navigate('/requests') : openLoginPrompt('/requests')
              }
            >
              {isAuthenticated ? t('requests') : t('signIn')}
            </button>
            {isEnabled('concierge_chat') && (
              <Link to="/chat" className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                {t('chat')}
              </Link>
            )}
            <Link to="/search" className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
              {t('search')}
            </Link>
          </div>
          <div className="mt-6 flex gap-1.5">
            {HOME_SLIDER_KEYS.map((key, index) => (
              <button
                key={key}
                type="button"
                aria-label={key}
                className={cn(
                  'h-1.5 rounded-full transition',
                  index === slide ? 'w-8 bg-accent' : 'w-3 bg-white/40'
                )}
                onClick={() => setSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-xl text-header">{t('navHotel')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Tile to="/info" title={t('hotelInfo')} imageKey="informace" moduleKey="hotel_info" />
          <Tile to="/rooms" title={t('roomsOffer')} imageKey="pokoje" moduleKey="hotel_rooms" />
          <Tile to="/parking" title={t('parking')} imageKey="reception" moduleKey="parking" />
          <Tile to="/program" title={t('hotelProgram')} imageKey="hotelProgram" moduleKey="leisure" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-xl text-header">{t('navGastro')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Tile to="/restaurants" title={t('restaurantsBars')} imageKey="restauraceBar" moduleKey="restaurants_bars" />
          <Tile
            to="/requests"
            title={t('roomService')}
            imageKey="roomServiceIcon"
            protectedPath
            moduleKey="room_service"
          />
        </div>
      </section>

      {(isEnabled('wellness_spa') || isEnabled('sports') || isEnabled('relax_sport')) &&
        ((relax.data?.length ?? 0) > 0 ? (
        <section>
          <h2 className="mb-3 font-serif text-xl text-header">
            {relax.data?.[0]?.section_title ?? t('relaxSport')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {relax.data!.map((area) => (
              <Tile
                key={area.area_slug}
                to={area.list_screen === 'WellnessSpaList' ? '/wellness' : '/fitness'}
                title={area.home_title}
                imageKey={area.home_image_key ?? (area.area_slug === 'wellness-spa' ? 'sauna' : 'gym')}
                moduleKey={area.area_slug === 'wellness-spa' ? 'wellness_spa' : 'sports'}
              />
            ))}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="mb-3 font-serif text-xl text-header">{t('relaxSport')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Tile to="/wellness" title={t('wellnessSpa')} imageKey="sauna" moduleKey="wellness_spa" />
            <Tile to="/fitness" title={t('gymSport')} imageKey="gym" moduleKey="sports" />
          </div>
        </section>
      ))}

      <section>
        <h2 className="mb-3 font-serif text-xl text-header">{t('navPrague')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Tile to="/map" title={t('pragueMapTitle')} imageKey="prague" moduleKey="places_of_interest" />
          <Tile to="/transport" title={t('transport')} imageKey="metro" moduleKey="transportation" />
          <Tile to="/app" title={t('tripPlanner')} imageKey="homeMap" accent moduleKey="where_to_go" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-xl text-header">{t('moreInApp')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Tile to="/app" title={t('digitalKey')} imageKey="digitalDoor" accent />
          <Tile to="/app" title={t('onlineCheckIn')} imageKey="welcome" accent />
          <Tile to="/app" title={t('downloadAppCta')} imageKey="handPhone" accent />
        </div>
      </section>
    </div>
  );
}
