import { useTranslation } from 'react-i18next';

import { getServiceRequestStatusStyle } from '../../services/supabase/serviceRequestUi';

const STATUS_KEYS: Record<string, string> = {
  new: 'statusNew',
  pending: 'statusPending',
  in_progress: 'statusInProgress',
  solved: 'statusSolved',
  rejected: 'statusRejected',
  archived: 'statusArchived',
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const style = getServiceRequestStatusStyle(status);
  const label = t(STATUS_KEYS[status] ?? 'statusNew');
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: style.backgroundColor, color: style.ringColor }}
    >
      {label}
    </span>
  );
}
