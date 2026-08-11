import { lazy, Suspense } from 'react';
import Section from '../ui/Section';
import { useTranslation } from '../../hooks/useTranslation';
import { Link } from 'react-router-dom';
import { governmentCategories } from '../../data/yamlLoader';
import { resolveIconName } from '@/lib/icon-resolver';

interface Subcategory {
  name: string;
  slug: string;
}

interface Category {
  category: string;
  slug: string;
  subcategories?: Subcategory[];
  description: string;
  icon: string;
}

const LazyIconify = lazy(() =>
  import('@iconify/react').then(module => ({ default: module.Icon }))
);

interface GovernmentActivitySectionProps {
  title?: string;
  description?: string;
  previewLimit?: number;
}

export default function GovernmentActivitySection({
  title,
  description,
  previewLimit = 3,
}: GovernmentActivitySectionProps) {
  const { t } = useTranslation();

  const getIcon = (iconName?: string, className = 'h-6 w-6') => {
    return (
      <Suspense
        fallback={
          <div className={`${className} rounded-full bg-purple-200/40 animate-pulse shrink-0`} />
        }
      >
        <LazyIconify
          icon={resolveIconName(iconName)}
          className={`${className} shrink-0 transition-transform duration-300 group-hover:scale-105`}
        />
      </Suspense>
    );
  };

  const allCategories = (governmentCategories.categories || []) as Category[];
  const displayedCategories = allCategories.slice(0, previewLimit);

  return (
    <Section id="#government">
      {/* 📐 Flex Container: Header on the LEFT (desktop), Circles on the RIGHT */}
      <div className="w-full flex flex-col lg:flex-row items-start justify-between gap-6 lg:gap-8 my-4 py-4 overflow-x-hidden">

        {/* 1️⃣ LEFT SIDE (Desktop): Header and Subheader */}
        <div className="w-full lg:w-1/4 shrink-0 flex flex-col items-start text-left gap-3 pt-2">
          <div className="flex items-center gap-2.5 text-gray-900 font-axis-sng-indlab-value uppercase text-2xl sm:text-3xl font-bold tracking-wide">
            {getIcon('ri:building-line', 'h-8 w-8 text-purple-600')}
            <h2 className="leading-snug">
              {title || t('governmentActivity.title', 'Government Agencies')}
            </h2>
          </div>

          <p className="text-gray-600 font-axis-thin text-sm leading-relaxed">
            {description ||
              t('governmentActivity.description', 'Find government offices, agencies, and public services.')}
          </p>
        </div>

        {/* 2️⃣ VERTICAL DIVIDER BAR ( | ) */}
        <div
          className="hidden lg:block w-[1.5px] bg-gray-200 self-stretch my-1 mx-2"
          aria-hidden="true"
        />

        {/* 3️⃣ RIGHT SIDE (Desktop): Circles & "View All" Button */}
        <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 justify-items-center items-start py-2 p-1">

          {/* Service Circles */}
          {displayedCategories.map(category => (
            <Link
              key={category.slug}
              to={`/government/${category.slug}`}
              className="group flex flex-col items-center text-center w-full max-w-[140px] sm:max-w-[160px] transition-transform duration-300"
            >
              {/* Purple Badge Circle */}
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-1 border-gray-300 bg-purple-50/20 flex items-center justify-center p-3 sm:p-5 group-hover:scale-105 group-hover:border-purple-600 transition-all duration-300 overflow-hidden">
                <div className="text-purple-600 group-hover:text-purple-800 transition-colors">
                  {getIcon(category.icon, 'h-9 w-9 sm:h-14 sm:w-14')}
                </div>
              </div>

              {/* Label */}
              <h3 className="mt-2.5 sm:mt-3 text-xs sm:text-sm font-axis-navbar-focus font-bold uppercase tracking-wider text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-2">
                {category.category}
              </h3>
            </Link>
          ))}

          {/* "VIEW ALL" BUTTON */}
          {allCategories.length > previewLimit && (
            <div className="flex items-center justify-center w-full h-full min-h-[100px] sm:min-h-[128px]">
              <Link
                to="/government"
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border-1 border-purple-400 text-purple-600 font-axis-medium hover:bg-purple-600 hover:text-white transition-all duration-300 shadow-sm text-sm sm:text-md uppercase tracking-wider text-center whitespace-nowrap font-axis-navbar-focus"
              >
                {t('governmentActivity.viewAll', 'View all')}
              </Link>
            </div>
          )}

        </div>

      </div>
    </Section>
  );
}
