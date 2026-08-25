import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, Wrench, Bell, KeyRound } from 'lucide-react';

import { useAuth } from './AuthContext';
import { Button } from '../components/ui/Button';

const SESSION_KEY = 'otelapps_login_prompt_dismissed';

type LoginPromptContextValue = {
  openLoginPrompt: (from?: string) => void;
  tryProtectedPath: (path: string) => boolean;
};

const LoginPromptContext = createContext<LoginPromptContextValue | undefined>(undefined);

const BENEFITS = [
  { key: 'loginPromptBenefitOrders', icon: UtensilsCrossed },
  { key: 'loginPromptBenefitRequests', icon: Wrench },
  { key: 'loginPromptBenefitTracking', icon: Bell },
  { key: 'loginPromptBenefitProfile', icon: KeyRound },
] as const;

export function LoginPromptProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [fromPath, setFromPath] = useState('/signin');

  const openLoginPrompt = useCallback(
    (from = '/') => {
      if (isAuthenticated) {
        navigate(from);
        return;
      }
      setFromPath(from);
      setVisible(true);
    },
    [isAuthenticated, navigate]
  );

  const tryProtectedPath = useCallback(
    (path: string) => {
      if (isAuthenticated) {
        navigate(path);
        return true;
      }
      openLoginPrompt(path);
      return false;
    },
    [isAuthenticated, navigate, openLoginPrompt]
  );

  const value = useMemo(
    () => ({ openLoginPrompt, tryProtectedPath }),
    [openLoginPrompt, tryProtectedPath]
  );

  return (
    <LoginPromptContext.Provider value={value}>
      {children}
      {visible ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="font-serif text-2xl text-header">{t('loginPromptTitle')}</h2>
            <p className="mt-2 text-sm text-muted">{t('loginPromptSubtitle')}</p>
            <ul className="mt-4 space-y-2">
              {BENEFITS.map((item) => (
                <li key={item.key} className="flex items-center gap-3 text-sm">
                  <span className="flex size-8 items-center justify-center rounded-full bg-orange-50 text-accent">
                    <item.icon className="size-4" />
                  </span>
                  {t(item.key)}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <Button
                onClick={() => {
                  setVisible(false);
                  sessionStorage.setItem(SESSION_KEY, '1');
                  navigate('/signin', { state: { from: fromPath } });
                }}
              >
                {t('loginPromptCta')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setVisible(false);
                  sessionStorage.setItem(SESSION_KEY, '1');
                }}
              >
                {t('loginPromptBrowse')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </LoginPromptContext.Provider>
  );
}

export function useLoginPrompt() {
  const ctx = useContext(LoginPromptContext);
  if (!ctx) throw new Error('useLoginPrompt must be used within LoginPromptProvider');
  return ctx;
}

export function wasLoginPromptDismissed(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function markLoginPromptShown() {
  sessionStorage.setItem(SESSION_KEY, '1');
}
