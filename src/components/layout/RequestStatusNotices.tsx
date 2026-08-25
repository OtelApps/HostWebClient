import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';

import { useServiceRequests } from '../../contexts/ServiceRequestContext';
import { notifyGuestBrowser } from '../../lib/serviceRequestStatusChanges';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';

const TOAST_KEYS: Record<string, string> = {
  pending: 'requestStatusPending',
  in_progress: 'requestStatusInProgress',
  rejected: 'requestStatusRejected',
  archived: 'requestStatusArchived',
};

export function RequestStatusNotices() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    solvedModalRequest,
    dismissSolvedModal,
    statusAlert,
    dismissStatusAlert,
  } = useServiceRequests();
  const notifiedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!solvedModalRequest) return;
    const previous = document.title;
    const title = t('requestSolvedTitle');
    document.title = `✓ ${title} — OtelApps`;
    if (notifiedIdRef.current !== solvedModalRequest.id) {
      notifiedIdRef.current = solvedModalRequest.id;
      notifyGuestBrowser(title, solvedModalRequest.request_text || t('requestSolvedLead'));
    }
    return () => {
      document.title = previous;
    };
  }, [solvedModalRequest, t]);

  useEffect(() => {
    if (!statusAlert || solvedModalRequest) return;
    const id = window.setTimeout(() => dismissStatusAlert(), 7000);
    return () => window.clearTimeout(id);
  }, [dismissStatusAlert, solvedModalRequest, statusAlert]);

  const toastBody =
    statusAlert && TOAST_KEYS[statusAlert.status]
      ? t(TOAST_KEYS[statusAlert.status], { text: statusAlert.body })
      : statusAlert?.body;

  return (
    <>
      {solvedModalRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div
            role="dialog"
            aria-labelledby="request-solved-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl"
          >
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="size-8" strokeWidth={2.5} />
            </span>
            <h2 id="request-solved-title" className="mt-4 font-serif text-2xl text-header">
              {t('requestSolvedTitle')}
            </h2>
            <p className="mt-2 text-sm text-muted">{t('requestSolvedLead')}</p>
            <p className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm font-medium text-header">
              {solvedModalRequest.request_text}
            </p>
            {solvedModalRequest.request_number ? (
              <p className="mt-2 text-xs text-muted">{solvedModalRequest.request_number}</p>
            ) : null}
            <div className="mt-6 flex flex-col gap-2">
              <Button
                onClick={() => {
                  const id = solvedModalRequest.id;
                  dismissSolvedModal();
                  navigate(`/requests/${id}`);
                }}
              >
                {t('requestSolvedCta')}
              </Button>
              <Button variant="ghost" onClick={dismissSolvedModal}>
                {t('close')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {statusAlert && !solvedModalRequest ? (
        <div className="fixed right-4 top-20 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => {
                const id = statusAlert.requestId;
                dismissStatusAlert();
                navigate(`/requests/${id}`);
              }}
            >
              <div className="mb-1 flex items-center gap-2">
                <p className="text-sm font-semibold text-header">{t('requestStatusToastTitle')}</p>
                <StatusBadge status={statusAlert.status} />
              </div>
              <p className="text-sm text-muted">{toastBody}</p>
            </button>
            <button
              type="button"
              aria-label={t('close')}
              className="rounded-full p-1 text-muted hover:bg-gray-50 hover:text-ink"
              onClick={dismissStatusAlert}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
