// src/components/home/GovernmentActivitySection.tsx
import Section from '../ui/Section';
import { useTranslation } from '../../hooks/useTranslation';
import { Link } from 'react-router-dom';
import { governmentCategories } from '../../data/yamlLoader';
import { lazy, Suspense } from 'react';
import { resolveIconName } from '@/lib/icon-resolver';

interface Subcategory {
  name: string;
  slug: string;
}

interface Category {
  category: string;
  slug: string;
  subcategories: Subcategory[];
  description: string;
  icon: string;
}

const LazyIconify = lazy(() =>
  import('@iconify/react').then(module => ({ default: module.Icon }))
);

export default function GovernmentActivitySection({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const { t } = useTranslation();

  const getIcon = (categoryName?: string, className = 'h-6 w-6') => {
    return (
      <Suspense
        fallback={
          <div
            className={`${className} rounded bg-purple-200/40 animate-pulse shrink-0`}
          />
        }
      >
        <LazyIconify
          icon={resolveIconName(categoryName)}
          className={`${className} shrink-0 transition-transform duration-300 group-hover:scale-105`}
        />
      </Suspense>
    );
  };

  const displayedCategories = governmentCategories.categories as Category[];

  return (
    <Section id="#government">
      {/* 🏷️ Synchronized Header */}
      <div className="mb-8 text-center items-center font-axis-sng-indlab-value">
        <h1 className="text-4xl mb-2 uppercase tracking-wider">
          {title || t('governmentActivity.title', 'Government Agencies')}
        </h1>
        <span className="text-gray-600 mb-6 font-axis-medium">
          {description || t('governmentActivity.description')}
        </span>
      </div>

      {/* 💎 Synchronized Slide-Wipe Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedCategories.map(category => (
          <Link
            key={category.slug}
            to={`/government/${category.slug}`}
            className="group relative flex h-full w-full overflow-hidden rounded-xl border border-purple-100/30 bg-purple-50/10 -translate-y-0 hover:-translate-y-0.2 transition-all duration-300 ease-in-and-out"
          >
            {/* 🌊 Sliding Wipe Background Layer */}
            <div
              className="absolute inset-0 bg-purple-800 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"
              aria-hidden="true"
            />

            {/* 📝 Left Content Column (z-10 to stay above the sliding background) */}
            <div className="relative z-10 flex-1 p-5 flex flex-col justify-start items-start text-start gap-4">
              {/* Header: Icon inline with the Title */}
              <div className="flex items-center gap-3 w-full">
                <div className="bg-purple-100 text-purple-700 group-hover:bg-white/20 group-hover:text-white p-2.5 rounded-lg shrink-0 transition-colors duration-300">
                  {getIcon(category.icon, 'h-5 w-5')}
                </div>
                <h3 className="text-lg font-axis-navbar-focus uppercase tracking-wide text-gray-900 group-hover:text-white transition-colors duration-300 line-clamp-2 leading-snug">
                  {category.category}
                </h3>
              </div>

              {/* Subtitle / Description */}
              <p className="text-sm text-gray-600 group-hover:text-purple-100/95 font-axis-thin transition-colors duration-300 leading-relaxed">
                {category.description}
              </p>
            </div>

            {/* ➡️ Right Accent Strip (Visual Height-spanning bar with indicator) */}
            <div className="relative z-10 flex items-center justify-center w-12 bg-purple-50/50 group-hover:bg-purple-900 border-l border-purple-100/40 group-hover:border-purple-900 transition-colors duration-300 shrink-0">
              {getIcon(
                'ri:arrow-right-double-line',
                'h-5 w-5 text-purple-600 group-hover:text-white transition-all duration-300'
              )}
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
