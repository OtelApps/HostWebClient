import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, MessageCircle, ClipboardList, UserRound } from 'lucide-react';

import { useHotelModules } from '../../contexts/ModulesContext';
import { REQUEST_HUB_MODULES } from '../../lib/modules';
import { cn } from '../../lib/cn';

const items = [
  { to: '/', key: 'home', icon: Home, end: true, moduleKey: null as string | null, anyOf: null as readonly string[] | null },
  { to: '/chat', key: 'chat', icon: MessageCircle, end: false, moduleKey: 'concierge_chat', anyOf: null },
  { to: '/requests', key: 'requests', icon: ClipboardList, end: false, moduleKey: null, anyOf: REQUEST_HUB_MODULES },
  { to: '/profile', key: 'profile', icon: UserRound, end: false, moduleKey: null, anyOf: null },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  const { isEnabled, isAnyEnabled } = useHotelModules();
  const visible = items.filter((item) => {
    if (item.anyOf) {
      return isAnyEnabled(item.anyOf);
    }
    return !item.moduleKey || isEnabled(item.moduleKey);
  });
  const cols =
    visible.length === 4 ? 'grid-cols-4' : visible.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className={cn('mx-auto grid max-w-[1100px]', cols)}>
        {visible.map((item) => (
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
