import { useTranslation } from 'react-i18next';

import { cn } from '../../lib/cn';

type Props = {
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  onClick?: () => void;
};

export function Button({
  children,
  className,
  type = 'button',
  variant = 'primary',
  disabled,
  onClick,
}: Props) {
  const styles = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-header text-white hover:bg-black',
    ghost: 'border border-line bg-white text-header hover:bg-gray-50',
  }[variant];

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50',
        styles,
        className
      )}
    >
      {children}
    </button>
  );
}

export function LoadingBlock() {
  const { t } = useTranslation();
  return <p className="py-16 text-center text-muted">{t('loading')}</p>;
}

export function EmptyBlock({ message }: { message?: string }) {
  const { t } = useTranslation();
  return <p className="py-16 text-center text-muted">{message ?? t('empty')}</p>;
}

export function ErrorBlock({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="py-16 text-center">
      <p className="text-muted">{message ?? t('error')}</p>
      {onRetry ? (
        <Button className="mt-4" variant="ghost" onClick={onRetry}>
          {t('retry')}
        </Button>
      ) : null}
    </div>
  );
}
