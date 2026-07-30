import React, { Suspense, lazy } from 'react';
import { Link, useLocation } from 'react-router-dom';

const LazyIconify = lazy(() =>
  import('@iconify/react').then(m => ({ default: m.Icon }))
);

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const location = useLocation();

  // Generate breadcrumbs from current path if no items provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  return (
    <nav
      className={`flex items-center space-x-1 text-sm text-gray-600 ${className}`}
      aria-label="Breadcrumb"
    >
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {/* 💡 Lucide Home -> LazyIconify lucide:home */}
          {index === 0 && (
            <Suspense
              fallback={
                <div className="h-4 w-4 rounded bg-gray-100 animate-pulse shrink-0" />
              }
            >
              <LazyIconify icon="lucide:home" className="h-4 w-4" />
            </Suspense>
          )}

          {/* 💡 Lucide ChevronRight -> LazyIconify lucide:chevron-right */}
          {index > 0 && (
            <Suspense
              fallback={
                <div className="h-4 w-4 mx-1 rounded bg-gray-100 animate-pulse shrink-0" />
              }
            >
              <LazyIconify
                icon="lucide:chevron-right"
                className="h-4 w-4 mx-1 text-gray-400"
              />
            </Suspense>
          )}

          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-primary-600 transition-colors duration-200"
            >
              {item.label.charAt(0).toUpperCase() + item.label.slice(1)}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium" aria-current="page">
              {item.label.charAt(0).toUpperCase() + item.label.slice(1)}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
