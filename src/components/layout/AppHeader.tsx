import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Search, UserRound } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/cn';

const langs = [
  { code: 'cs', labelKey: 'czech' },
  { code: 'en', labelKey: 'english' },
  { code: 'de', labelKey: 'german' },
] as const;

export function AppHeader() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1100px] items-center gap-4 px-4 py-3">
        <Link to="/" className="font-serif text-xl font-semibold tracking-tight text-header">
          OtelApps
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {[
            ['/', t('home'), true],
            ['/info', t('hotelInfo')],
            ['/restaurants', t('restaurantsBars')],
            ['/chat', t('chat')],
            ['/requests', t('requests')],
          ].map(([to, label, end]) => (
            <NavLink
              key={to as string}
              to={to as string}
              end={Boolean(end)}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:text-ink'
                )
              }
            >
              {label as string}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/search"
            aria-label={t('search')}
            className="inline-flex size-9 items-center justify-center rounded-full border border-line text-muted hover:text-ink"
          >
            <Search className="size-4" />
          </Link>
          <div className="hidden items-center gap-1 rounded-full border border-line px-1.5 py-1 sm:flex">
            <Globe className="size-3.5 text-muted" />
            {langs.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => void i18n.changeLanguage(lang.code)}
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  i18n.language.startsWith(lang.code)
                    ? 'bg-header text-white'
                    : 'text-muted hover:text-ink'
                )}
              >
                {lang.code.toUpperCase()}
              </button>
            ))}
          </div>
          <Link
            to={isAuthenticated ? '/profile' : '/signin'}
            className="inline-flex items-center gap-1.5 rounded-full bg-header px-3 py-1.5 text-sm font-medium text-white"
          >
            <UserRound className="size-4" />
            <span className="hidden sm:inline">{isAuthenticated ? t('profile') : t('signIn')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
