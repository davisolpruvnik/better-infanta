// src/components/ui/BreadcrumbsLess.tsx
import React, { Suspense, lazy, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const LazyIconify = lazy(() =>
  import('@iconify/react').then(m => ({ default: m.Icon }))
);

const HomeIcon = () => (
  <Suspense
    fallback={<div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded bg-fantas-200/50 animate-pulse shrink-0" />}
  >
    <LazyIconify icon="lucide:home" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-fantas-600 shrink-0" />
  </Suspense>
);

const ChevronSeparator = () => (
  <li aria-hidden="true" className="shrink-0">
    <Suspense
      fallback={<div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded bg-fantas-200/50 animate-pulse shrink-0" />}
    >
      <LazyIconify icon="lucide:chevron-right" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-fantas-400" />
    </Suspense>
  </li>
);

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  maxItems?: number;
}

const Breadcrumbsless: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
  maxItems = 3,
}) => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      const label = segment
        .split('-')
        .map(word => {
          const lower = word.toLowerCase();
          if (lower === 'sf') return 'SF';
          if (lower === 'id') return 'ID';
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();
  const totalItems = breadcrumbItems.length;
  const shouldCollapse = totalItems > maxItems && !isExpanded;

  const firstItem = breadcrumbItems[0];
  const lastItem = breadcrumbItems[totalItems - 1];
  const middleItems = breadcrumbItems.slice(1, totalItems - 1);

  return (
    <nav
      className={`flex justify-center items-center text-xs sm:text-sm text-fantas-800/70 max-w-full ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex justify-center items-center flex-wrap sm:flex-nowrap gap-1 max-w-full">
        {shouldCollapse ? (
          <>
            <li className="inline-flex items-center gap-1.5 shrink-0">
              <HomeIcon />
              {firstItem.href ? (
                <Link
                  to={firstItem.href}
                  className="hover:text-fantas-900 transition-colors font-axis-navbar-focus uppercase tracking-wider duration-200 text-fantas-800/70 truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[160px]"
                >
                  {firstItem.label}
                </Link>
              ) : (
                <span className="text-fantas-950 font-axis-navbar-focus tracking-wider uppercase truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[160px]">
                  {firstItem.label}
                </span>
              )}
            </li>

            <ChevronSeparator />

            <li className="inline-flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="inline-flex items-center justify-center p-0.5 sm:p-1 rounded hover:bg-fantas-100 text-fantas-800/70 hover:text-fantas-950 transition-colors focus:outline-none focus:ring-1 focus:ring-fantas-500 cursor-pointer"
                title="Show all breadcrumbs"
                aria-label={`Show ${middleItems.length} hidden breadcrumb items`}
              >
                <Suspense fallback={<span className="text-xs">...</span>}>
                  <LazyIconify
                    icon="lucide:more-horizontal"
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  />
                </Suspense>
              </button>
            </li>

            <ChevronSeparator />

            <li className="inline-flex items-center min-w-0 shrink">
              {lastItem.href ? (
                <Link
                  to={lastItem.href}
                  className="hover:text-fantas-950 font-axis-navbar-focus uppercase tracking-wider transition-colors duration-200 text-fantas-800/70 truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[260px] md:max-w-[380px]"
                >
                  {lastItem.label}
                </Link>
              ) : (
                <span
                  className="text-fantas-950 font-axis-navbar-focus font-bold tracking-wider uppercase truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[260px] md:max-w-[380px]"
                  aria-current="page"
                >
                  {lastItem.label}
                </span>
              )}
            </li>
          </>
        ) : (
          breadcrumbItems.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === totalItems - 1;

            return (
              <React.Fragment key={index}>
                <li className="inline-flex items-center gap-1.5 min-w-0 shrink-0 sm:shrink">
                  {isFirst && <HomeIcon />}

                  {item.href ? (
                    <Link
                      to={item.href}
                      className="hover:text-fantas-950 font-axis-navbar-focus uppercase tracking-wider transition-colors duration-200 text-fantas-800/70 truncate max-w-[90px] xs:max-w-[130px] sm:max-w-[200px] md:max-w-[300px]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className="text-fantas-950 font-axis-navbar-focus font-bold tracking-wider uppercase truncate max-w-[110px] xs:max-w-[160px] sm:max-w-[240px] md:max-w-[380px]"
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {item.label}
                    </span>
                  )}
                </li>

                {!isLast && <ChevronSeparator />}
              </React.Fragment>
            );
          })
        )}
      </ol>
    </nav>
  );
};

export default Breadcrumbsless;
