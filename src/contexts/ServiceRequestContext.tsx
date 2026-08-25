import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from './AuthContext';
import { getGuestIdentity } from '../lib/guestIdentity';
import {
  diffServiceRequestStatuses,
  seedServiceRequestStatus,
  takeSolvedNotifications,
} from '../lib/serviceRequestStatusChanges';
import {
  fetchGuestServiceRequests,
  type GuestServiceRequest,
} from '../services/supabase/serviceRequests';
import { isActiveServiceRequestStatus } from '../services/supabase/serviceRequestUi';

export type ServiceRequestStatusAlert = {
  requestId: string;
  status: string;
  body: string;
};

type ServiceRequestContextValue = {
  requests: GuestServiceRequest[];
  activeRequests: GuestServiceRequest[];
  loading: boolean;
  lastSubmittedId: string | null;
  refresh: () => Promise<void>;
  trackRequest: (snapshot: GuestServiceRequest) => void;
  clearLastSubmitted: () => void;
  solvedModalRequest: GuestServiceRequest | null;
  dismissSolvedModal: () => void;
  statusAlert: ServiceRequestStatusAlert | null;
  dismissStatusAlert: () => void;
};

const ServiceRequestContext = createContext<ServiceRequestContextValue | null>(null);

export function ServiceRequestProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<GuestServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);
  const [solvedModalQueue, setSolvedModalQueue] = useState<GuestServiceRequest[]>([]);
  const [statusAlert, setStatusAlert] = useState<ServiceRequestStatusAlert | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!isAuthenticated) {
      setRequests([]);
      setSolvedModalQueue([]);
      setStatusAlert(null);
      return;
    }
    if (!opts?.silent) setLoading(true);
    try {
      const [data, guest] = await Promise.all([
        fetchGuestServiceRequests(),
        getGuestIdentity(),
      ]);
      const changes = diffServiceRequestStatuses(guest.guest_external_id, data);
      const solved = takeSolvedNotifications(guest.guest_external_id, changes);
      if (solved.length > 0) {
        setSolvedModalQueue((prev) => [...prev, ...solved]);
      }
      const toastChange = [...changes].reverse().find((c) => c.to !== 'solved');
      if (toastChange) {
        setStatusAlert({
          requestId: toastChange.request.id,
          status: toastChange.to,
          body: toastChange.request.request_text || toastChange.request.service_label,
        });
      }
      setRequests(data);
    } catch (e) {
      console.warn('[service-requests]', e);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
    if (!isAuthenticated) return undefined;
    const poll = window.setInterval(() => void refresh({ silent: true }), 8_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [isAuthenticated, refresh]);

  const trackRequest = useCallback((snapshot: GuestServiceRequest) => {
    setRequests((prev) => [snapshot, ...prev.filter((r) => r.id !== snapshot.id)]);
    if (snapshot.id) setLastSubmittedId(snapshot.id);
    void getGuestIdentity().then((guest) => {
      seedServiceRequestStatus(guest.guest_external_id, snapshot.id, snapshot.status);
    });
  }, []);

  const dismissSolvedModal = useCallback(() => {
    setSolvedModalQueue((prev) => prev.slice(1));
  }, []);

  const dismissStatusAlert = useCallback(() => {
    setStatusAlert(null);
  }, []);

  const activeRequests = useMemo(
    () => requests.filter((r) => isActiveServiceRequestStatus(r.status)),
    [requests]
  );

  const solvedModalRequest = solvedModalQueue[0] ?? null;

  const value = useMemo(
    () => ({
      requests,
      activeRequests,
      loading,
      lastSubmittedId,
      refresh,
      trackRequest,
      clearLastSubmitted: () => setLastSubmittedId(null),
      solvedModalRequest,
      dismissSolvedModal,
      statusAlert,
      dismissStatusAlert,
    }),
    [
      activeRequests,
      dismissSolvedModal,
      dismissStatusAlert,
      lastSubmittedId,
      loading,
      refresh,
      requests,
      solvedModalRequest,
      statusAlert,
      trackRequest,
    ]
  );

  return (
    <ServiceRequestContext.Provider value={value}>{children}</ServiceRequestContext.Provider>
  );
}

export function useServiceRequests() {
  const ctx = useContext(ServiceRequestContext);
  if (!ctx) throw new Error('useServiceRequests must be used within ServiceRequestProvider');
  return ctx;
}
