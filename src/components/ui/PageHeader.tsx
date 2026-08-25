import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  title: string;
  backTo?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, backTo, action }: Props) {
  const { t } = useTranslation();
  return (
    <div className="mb-6 flex items-center gap-3">
      {backTo ? (
        <Link
          to={backTo}
          className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-white text-header hover:bg-gray-50"
          aria-label={t('back')}
        >
          <ArrowLeft className="size-4" />
        </Link>
      ) : null}
      <h1 className="font-serif text-2xl font-semibold text-header">{title}</h1>
      {action ? <div className="ml-auto">{action}</div> : null}
    </div>
  );
}
