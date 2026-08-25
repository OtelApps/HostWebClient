import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_ACCOUNTS, type DemoAccount } from '../constants/demoAccounts';
import {
  buildGuestIdentityFromSignIn,
  saveGuestIdentity,
} from '../lib/guestIdentity';
import { upsertGuestCrmProfile } from '../services/supabase/guestCrmProfile';

export function SignInPage() {
  const { t, i18n } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [reservation, setReservation] = useState('');
  const [surname, setSurname] = useState('');
  const [checkout, setCheckout] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function completeSignIn(input: { reservation: string; surname: string; checkout: string }) {
    if (!input.reservation.trim() || !input.surname.trim() || !input.checkout.trim()) {
      setError(t('signInError'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const identity = buildGuestIdentityFromSignIn(input);
      identity.locale = i18n.language.slice(0, 2);
      await saveGuestIdentity(identity);
      await upsertGuestCrmProfile(identity);
      signIn();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('signInError'));
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await completeSignIn({ reservation, surname, checkout });
  }

  async function onPickDemo(account: DemoAccount) {
    setReservation(account.reservation);
    setSurname(account.surname);
    setCheckout(account.checkout);
    await completeSignIn({
      reservation: account.reservation,
      surname: account.surname,
      checkout: account.checkout,
    });
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title={t('login')} backTo="/" />
      <p className="mb-6 text-muted">{t('signInLead')}</p>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-3xl border border-line bg-white p-6">
        <label className="block text-sm font-medium">
          {t('reservation')}
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            value={reservation}
            onChange={(e) => setReservation(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="block text-sm font-medium">
          {t('surname')}
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            autoComplete="family-name"
          />
        </label>
        <label className="block text-sm font-medium">
          {t('checkoutDate')}
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            placeholder="dd.mm.rrrr"
            value={checkout}
            onChange={(e) => setCheckout(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {t('signIn')}
        </Button>
      </form>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted">{t('demoAccountsTitle')}</h2>
        <ul className="space-y-2">
          {DEMO_ACCOUNTS.map((account, index) => (
            <li key={account.reservation}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onPickDemo(account)}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
              >
                <p className="font-medium text-header">
                  {index + 1}. {account.displayName}
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {t('room')} {account.roomNumber} · {t('reservation')} {account.reservation} ·{' '}
                  {t('checkoutDate')} {account.checkout}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-center text-sm">
        <Link to="/" className="text-primary">
          {t('loginPromptBrowse')}
        </Link>
      </p>
    </div>
  );
}
