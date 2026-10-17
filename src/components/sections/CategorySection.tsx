// src/components/home/CategorySectionTemplate.tsx
import { lazy, Suspense } from 'react';
import Section from '../ui/Section';
import { Link } from 'react-router-dom';
import { resolveIconName } from '@/lib/icon-resolver';

export interface Subcategory {
  name: string;
  slug: string;
}

export interface Category {
  category: string;
  slug: string;
  subcategories?: Subcategory[];
  description?: string;
  icon?: string;
}

const LazyIconify = lazy(() =>
  import('@iconify/react').then(module => ({ default: module.Icon }))
);

export interface CategorySectionTemplateProps {
  id?: string;
  title: string;
  description: string;
  basePath: string; // e.g. '/government' or '/services'
  categories: Category[];
  previewLimit?: number;
  viewAllLabel?: string;
}

export function CategorySectionTemplate({
  id,
  title,
  description,
  basePath,
  categories = [],
  previewLimit = 4,
  viewAllLabel = 'View all',
}: CategorySectionTemplateProps) {
  const displayedCategories = categories.slice(0, previewLimit);

  return (
    <Section id={id}>
      <div className="w-full flex flex-col items-start justify-between gap-6 lg:gap-8 py-4 overflow-x-hidden mx-auto">
        {/* 1️⃣ Header */}
        <div className="w-full shrink-0 flex flex-col justify-center items-center gap-3 pt-2">
          <div className="flex items-center justify-center gap-2.5 text-fantas-800 font-axis-sng-indlab-value uppercase text-2xl sm:text-3xl tracking-wide">
            <h2 className="leading-snug justify-center font-axis-wide-header text-center">
              {title}
            </h2>
          </div>

          <p className="text-fantas-900/70 font-axis-wide-subheader uppercase text-sm leading-snug tracking-wider text-center">
            {description}
          </p>
        </div>

        {/* 2️⃣ Divider */}
        <div
          className="hidden lg:block h-[2px] bg-fantas-800/10 self-stretch my-1 mx-2"
          aria-hidden="true"
        />

        {/* 3️⃣ Grid of Cards */}
        <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 justify-items-center items-start py-2 p-1">
          {displayedCategories.map(category => (
            <Link
              key={category.slug}
              to={`${basePath}/${category.slug}`}
              className="group flex flex-col items-center text-center w-full h-full max-w-[140px] sm:max-w-[160px] transition-transform duration-300"
            >
              <div className="relative w-24 h-24 sm:w-30 sm:h-30 rounded-full border border-fantas-300/80 bg-fantas-50/50 flex items-center justify-center p-3 sm:p-5 group-hover:scale-105 group-hover:border-fantas-700 group-hover:bg-fantas-100/50 transition-all duration-300 overflow-hidden">
                <div className="text-fantas-700 group-hover:text-fantas-800 transition-colors">
                  <Suspense
                    fallback={
                      <div className="h-9 w-9 sm:h-14 sm:w-14 rounded-full bg-fantas-200/40 animate-pulse shrink-0" />
                    }
                  >
                    <LazyIconify
                      icon={resolveIconName(category.icon)}
                      className="h-9 w-9 sm:h-14 sm:w-14 shrink-0 transition-transform duration-300 group-hover:scale-105"
                    />
                  </Suspense>
                </div>
              </div>

              <h3 className="mt-2.5 sm:mt-3 text-xs sm:text-sm font-axis-navbar-focus font-bold uppercase tracking-wider text-gray-800 group-hover:text-fantas-700 transition-colors line-clamp-2 text-pretty leading-snug">
                {category.category}
              </h3>
            </Link>
          ))}

          {/* View All Button */}
          {categories.length > previewLimit && (
            <div className="flex items-center justify-center w-full h-full min-h-[100px] sm:min-h-[128px]">
              <Link
                to={basePath}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-fantas-400 text-fantas-800 font-axis-navbar-focus hover:bg-fantas-800 hover:text-white hover:border-fantas-800 transition-all duration-300 text-sm sm:text-md uppercase tracking-wider text-center whitespace-nowrap"
              >
                {viewAllLabel}
              </Link>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
