// src/components/ui/LazyIcon.tsx
import { lazy, Suspense } from 'react';
import { resolveIconName } from '@/lib/icon-resolver';

// 💡 Code-split the Iconify package to dynamically load paths on-demand
const LazyIconify = lazy(() =>
  import('@iconify/react').then(module => ({ default: module.Icon }))
);

interface LazyIconProps {
  name?: string;
  className?: string;
}

export default function LazyIcon({ name, className = 'h-4 w-4 shrink-0' }: LazyIconProps) {
  return (
    <Suspense
      fallback={
        <div className={`${className} rounded bg-primary-200/40 animate-pulse shrink-0`} />
      }
    >
      <LazyIconify icon={resolveIconName(name)} className={className} />
    </Suspense>
  );
}
