import { useTranslation } from 'react-i18next';

import { Button } from './Button';

type Props = {
  open: boolean;
  summary: string;
  note: string;
  submitting?: boolean;
  onNoteChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmRequestDialog({
  open,
  summary,
  note,
  submitting,
  onNoteChange,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="font-serif text-2xl text-header">{t('confirmRequest')}</h2>
        <p className="mt-2 text-sm text-muted">{t('confirmRequestHint')}</p>
        <p className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm font-medium text-header">{summary}</p>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            {t('note')}
          </span>
          <textarea
            className="w-full rounded-2xl border border-line px-3 py-2 text-sm"
            rows={3}
            placeholder={t('notePlaceholder')}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
          />
        </label>
        <div className="mt-5 flex gap-2">
          <Button variant="ghost" className="flex-1" disabled={submitting} onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button className="flex-1" disabled={submitting} onClick={onConfirm}>
            {t('send')}
          </Button>
        </div>
      </div>
    </div>
  );
}
