import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { resolveImageUrl } from '../../lib/images';
import { cn } from '../../lib/cn';

type Props = {
  to?: string;
  href?: string;
  title: string;
  description?: string | null;
  image?: string | null;
  fallbackKey?: string;
  label?: string | null;
  onClick?: () => void;
  className?: string;
};

function Media({
  image,
  fallbackKey,
  title,
  label,
}: {
  image?: string | null;
  fallbackKey?: string;
  title: string;
  label?: string | null;
}) {
  const src = resolveImageUrl(image, fallbackKey);
  return (
    <div className="relative h-40 overflow-hidden bg-linear-to-br from-header to-primary">
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-end p-4">
          <span className="font-serif text-2xl text-white/90">{title.slice(0, 1)}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/35 to-transparent" />
      {label ? (
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-header">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function CatalogCard({
  to,
  href,
  title,
  description,
  image,
  fallbackKey,
  label,
  onClick,
  className,
}: Props) {
  const body = (
    <div className="flex items-start justify-between gap-3 p-4">
      <div className="min-w-0">
        <h3 className="font-semibold text-header">{title}</h3>
        {description ? <p className="mt-1 line-clamp-2 text-sm text-muted">{description}</p> : null}
      </div>
      <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted" />
    </div>
  );

  const cls = cn(
    'block overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
    className
  );

  const media = <Media image={image} fallbackKey={fallbackKey} title={title} label={label} />;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {media}
        {body}
      </a>
    );
  }
  if (to) {
    return (
      <Link to={to} className={cls}>
        {media}
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(cls, 'w-full text-left')}>
      {media}
      {body}
    </button>
  );
}

export function Cover({
  image,
  title,
  fallbackKey,
}: {
  image?: string | null;
  title: string;
  fallbackKey?: string;
}) {
  const src = resolveImageUrl(image, fallbackKey);
  return (
    <div className="mb-6 overflow-hidden rounded-3xl bg-linear-to-br from-header to-primary">
      {src ? (
        <div className="relative">
          <img src={src} alt={title} className="h-56 w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/45 to-transparent" />
          <h2 className="absolute bottom-4 left-5 font-serif text-3xl text-white">{title}</h2>
        </div>
      ) : (
        <div className="flex h-44 items-end p-6">
          <h2 className="font-serif text-3xl text-white">{title}</h2>
        </div>
      )}
    </div>
  );
}

export function HoursList({
  hours,
}: {
  hours: { day_name: string; hours_text: string }[];
}) {
  if (hours.length === 0) return null;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
      {hours.map((row) => (
        <li key={row.day_name} className="flex justify-between px-4 py-2.5 text-sm">
          <span className="text-muted">{row.day_name}</span>
          <span className="font-medium">{row.hours_text}</span>
        </li>
      ))}
    </ul>
  );
}
