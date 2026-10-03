import { lazy, Suspense } from 'react';
import Section from '../ui/Section';
import { useTranslation } from '../../hooks/useTranslation';
import { Link } from 'react-router-dom';
import { serviceCategories } from '../../data/yamlLoader';
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

interface ServicesSectionProps {
  title?: string;
  description?: string;
  previewLimit?: number;
}

export default function ServicesSection({
  title,
  description,
  previewLimit = 3,
}: ServicesSectionProps) {
  const { t } = useTranslation();

  const getIcon = (iconName?: string, className = 'h-6 w-6') => {
    return (
      <Suspense
        fallback={
          <div className={`${className} rounded-full bg-fantas-200/40 animate-pulse shrink-0`} />
        }
      >
        <LazyIconify
          icon={resolveIconName(iconName)}
          className={`${className} shrink-0 transition-transform duration-300 group-hover:scale-105`}
        />
      </Suspense>
    );
  };

  const allCategories = (serviceCategories.categories || []) as Category[];
  const displayedCategories = allCategories.slice(0, previewLimit);

  return (
    <Section>
      {/* 📐 Main Container: Prevents Overflow and Adapts to Screen Sizes */}
      <div className="w-full flex flex-col items-start justify-between gap-6 lg:gap-8 py-4 overflow-x-hidden mx-auto">

        {/* 1️⃣ TOP SIDE (Desktop): Header and Subheader */}
        <div className="w-full shrink-0 flex flex-col justify-center items-center gap-3 pt-2">
          <div className="flex items-center justify-center gap-2.5 text-fantas-800 font-axis-sng-indlab-value uppercase text-2xl sm:text-3xl tracking-wide">
            <h2 className="leading-snug justify-center font-axis-wide-header">
              Municipal Gov't Services
            </h2>
          </div>

          <p className="text-fantas-900/70 font-axis-wide-subheader uppercase text-sm leading-snug tracking-wider">
              Find services offered by the local government of Infanta.
          </p>
        </div>

        {/* 2️⃣ VERTICAL DIVIDER BAR ( | ) */}
        <div
          className="hidden lg:block h-[2px] bg-fantas-800/10 self-stretch my-1 mx-2"
          aria-hidden="true"
        />

        {/* 3️⃣ RIGHT SIDE: UNIVERSAL AUTO-ADAPTING CSS GRID */}
        <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 justify-items-center items-start py-2 p-1">

          {/* Service Cards */}
          {displayedCategories.map(category => (
            <Link
              key={category.slug}
              to={`/services/${category.slug}`}
              className="group flex flex-col items-center text-center w-full h-full max-w-[140px] sm:max-w-[160px] transition-transform duration-300"
            >
              {/* fantas Badge Circle */}
              <div className="relative w-24 h-24 sm:w-30 sm:h-30 rounded-full border border-fantas-300/80 bg-fantas-50/50 flex items-center justify-center p-3 sm:p-5 group-hover:scale-105 group-hover:border-fantas-700 group-hover:bg-fantas-100/50 transition-all duration-300 overflow-hidden">
                <div className="text-fantas-700 group-hover:text-fantas-800 transition-colors">
                  {getIcon(category.icon, 'h-9 w-9 sm:h-14 sm:w-14')}
                </div>
              </div>

              {/* Badge Label */}
              <h3 className="mt-2.5 sm:mt-3 text-sm font-axis-navbar-focus uppercase tracking-wider text-gray-800 group-hover:text-fantas-700 transition-colors line-clamp-2 text-pretty leading-snug">
                {category.category}
              </h3>
            </Link>
          ))}

          {/* 4️⃣ "VIEW ALL SERVICES" BUTTON */}
          {allCategories.length > previewLimit && (
            <div className="flex items-center justify-center w-full h-full min-h-[100px] sm:min-h-[128px]">
              <Link
                to="/services"
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-fantas-400 text-fantas-800 font-axis-navbar-focus hover:bg-fantas-800 hover:text-white hover:border-fantas-800 transition-all duration-300 text-sm sm:text-md uppercase tracking-wider text-center whitespace-nowrap"
              >
                {t('services.viewAll') || 'View all'}
              </Link>
            </div>
          )}

        </div>

      </div>
    </Section>
  );
}
