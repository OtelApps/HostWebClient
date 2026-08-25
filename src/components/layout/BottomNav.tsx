import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, MessageCircle, ClipboardList, UserRound } from 'lucide-react';

import { cn } from '../../lib/cn';

const items = [
  { to: '/', key: 'home', icon: Home, end: true },
  { to: '/chat', key: 'chat', icon: MessageCircle, end: false },
  { to: '/requests', key: 'requests', icon: ClipboardList, end: false },
  { to: '/profile', key: 'profile', icon: UserRound, end: false },
] as const;

export function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-[1100px] grid-cols-4">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
                  isActive ? 'text-primary' : 'text-muted'
                )
              }
            >
              <item.icon className="size-5" />
              {t(item.key)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
