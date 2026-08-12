import Section from '../components/ui/Section';
import { useParams, Link } from 'react-router-dom';
import { Text } from '../components/ui/Text';
import {
  serviceCategories,
  getCategorySubcategories,
  type Subcategory,
  type CategoryIndex,
} from '../data/yamlLoader';
import ServicesSection from '../components/home/ServicesSection';
import SEO from '../components/SEO';
import { Banner } from '@bettergov/kapwa/banner';
import { useState, useEffect, lazy, Suspense, useMemo, memo } from 'react';
import { resolveIconName } from '@/lib/icon-resolver';
import Breadcrumbsless from '@/components/ui/BreadcrumbsLess';

// 💡 Dynamic Lazy Loading Iconify
const LazyIconify = lazy(() =>
  import('@iconify/react').then(module => ({ default: module.Icon }))
);

// ⚡ 1. Memoized Icon Component (Prevents re-instantiating icons on render)
const ServiceIcon = memo(({ iconName, className = 'h-6 w-6' }: { iconName?: string; className?: string }) => {
  return (
    <Suspense
      fallback={
        <div className={`${className} rounded-full bg-fantas-200/40 animate-pulse shrink-0`} />
      }
    >
      <LazyIconify
        icon={resolveIconName(iconName)}
        className={`${className} shrink-0 transition-transform duration-300 group-hover:scale-110`}
      />
    </Suspense>
  );
});
ServiceIcon.displayName = 'ServiceIcon';

// ⚡ 2. Memoized Subcategory Card (Prevents re-rendering cards unless props change)
interface SubcategoryCardProps {
  categorySlug: string;
  subcategory: Subcategory;
  fallbackIcon?: string;
}

const SubcategoryCard = memo(({ categorySlug, subcategory, fallbackIcon }: SubcategoryCardProps) => {
  return (
    <Link
      to={`/services/${categorySlug}/${subcategory.slug}`}
      className="group flex flex-col items-center text-center w-full max-w-[130px] sm:max-w-[160px] md:max-w-[180px] focus:outline-none transition-transform duration-300 py-2"
    >
      {/* fantas Badge Circle */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full border border-fantas-300/80 bg-fantas-50/50 flex items-center justify-center p-3 sm:p-5 group-hover:scale-105 group-hover:border-fantas-700 group-hover:bg-fantas-100/50 transition-all duration-300 overflow-hidden">
        <div className="text-fantas-700 group-hover:text-fantas-800 transition-colors">
          <ServiceIcon
            iconName={subcategory.icon || fallbackIcon || 'RiFileTextLine'}
            className="h-9 w-9 sm:h-14 sm:w-14 md:h-16 md:w-16"
          />
        </div>
      </div>

      <h3 className="mt-2.5 sm:mt-4 text-xs sm:text-sm font-axis-navbar-focus font-bold uppercase tracking-wide text-gray-800 group-hover:text-fantas-700 transition-colors duration-200 line-clamp-2 leading-snug">
        {subcategory.name}
      </h3>

      {subcategory.description && (
        <p className="mt-1 text-[10px] sm:text-xs font-axis-thin text-gray-600 line-clamp-2 leading-tight px-1">
          {subcategory.description}
        </p>
      )}
    </Link>
  );
});
SubcategoryCard.displayName = 'SubcategoryCard';

// ⚡ 3. Main Services Page Component
const Services: React.FC = () => {
  const { category } = useParams();
  const [categoryIndex, setCategoryIndex] = useState<CategoryIndex>({
    layout: 'grid',
    pages: [],
  });
  const [loading, setLoading] = useState(false);

  const subcategories: Subcategory[] = categoryIndex.pages;

  // ⚡ Memoized category lookup (Saves CPU cycles on re-renders)
  const categoryData = useMemo(() => {
    return serviceCategories.categories.find(c => c.slug === category);
  }, [category]);

  // ⚡ Optimized Data Fetching with cancellation cleanup to prevent memory leaks
  useEffect(() => {
    let isMounted = true;

    if (category && categoryData) {
      setLoading(true);
      getCategorySubcategories(category)
        .then(res => {
          if (isMounted) setCategoryIndex(res);
        })
        .catch(console.error)
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [category, categoryData]);

  // 1️⃣ ALL SERVICES STANDALONE PAGE (/services)
  if (!category) {
    return (
      <>
        <SEO
          title="Services"
          description={`All services provided by the ${import.meta.env.VITE_GOVERNMENT_NAME} government. Find what you need for citizenship, business, education, and more.`}
          keywords="government services, public services, local government, civic services"
        />
        <ServicesSection
          title={`All local government services`}
          description={`All services provided by the ${import.meta.env.VITE_GOVERNMENT_NAME} government. Find what you need for citizenship, business, education, and more.`}
          previewLimit={999}
        />
      </>
    );
  }

  // 2️⃣ CATEGORY NOT FOUND VIEW
  if (!categoryData) {
    return (
      <Section className="px-4 mb-12">
        <Breadcrumbsless className="mb-8" />
        <Banner
          type="error"
          title="Category not found"
          description="The category you are looking for does not exist."
          icon
        />
      </Section>
    );
  }

  // 3️⃣ SINGLE CATEGORY SUBCATEGORIES VIEW (/services/:category)
  return (
    <>
      <SEO
        title={categoryData.category || category}
        description={categoryData.description}
        keywords={`${categoryData.category}, government services, public services, local government`}
      />
      <Section className="px-3 sm:px-6 lg:px-8 mb-12 overflow-x-hidden">
        <Breadcrumbsless className="mb-6" />

        {/* Section Header with Line Dividers */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 mb-1 sm:mb-2 w-full max-w-4xl mx-auto">
          <div className="flex-1 h-[1px] bg-gray-200" />
          <div className="flex items-center gap-2 text-gray-700 shrink-0">
            <ServiceIcon iconName="ri:group-line" className="h-4 w-4 sm:h-5 sm:w-5 text-fantas-700" />
            <h2 className="text-sm sm:text-md md:text-lg lg:text-xl font-axis-titular-focus uppercase tracking-wider text-gray-800 text-center">
              {categoryData.category || category} Services
            </h2>
          </div>
          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>

        {categoryData.description && (
          <p className="text-center font-axis-subtitular-focus text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10 tracking-wide text-xs sm:text-sm md:text-base px-2">
            {categoryData.description}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Text>Loading services...</Text>
          </div>
        ) : (
          <div className="w-full max-w-7xl mx-auto">
            {/* Grid de Subcategorias com componentes Memoizados */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 md:gap-8 justify-items-center items-start">
              {subcategories.map(subcategory => (
                <SubcategoryCard
                  key={subcategory.slug}
                  categorySlug={category}
                  subcategory={subcategory}
                  fallbackIcon={categoryData?.icon}
                />
              ))}
            </div>

            {subcategories.length === 0 && (
              <p className="text-center text-gray-500 font-axis-thin my-12 text-xs sm:text-sm">
                No services available under this category at the moment.
              </p>
            )}
          </div>
        )}
      </Section>
    </>
  );
};

export default Services;
