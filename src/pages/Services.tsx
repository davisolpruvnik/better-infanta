// src/pages/Services.tsx
import Section from '../components/ui/Section';
import { useParams, Link } from 'react-router-dom';
import { Text } from '../components/ui/Text';
import {
  serviceCategories,
  getCategorySubcategories,
  type Subcategory,
  type CategoryIndex,
} from '../data/yamlLoader';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import ServicesSection from '../components/home/ServicesSection';
import SEO from '../components/SEO';
import { Banner } from '@bettergov/kapwa/banner';
import { useState, useEffect, lazy, Suspense } from 'react';
import { resolveIconName } from '@/lib/icon-resolver';

// 💡 1. Import your modular shared icon resolver

// 💡 2. Lazy load the Iconify component as LazyIconify to avoid namespace collisions
const LazyIconify = lazy(() =>
  import('@iconify/react').then(module => ({ default: module.Icon }))
);

const Services: React.FC = () => {
  const { category } = useParams();
  const [categoryIndex, setCategoryIndex] = useState<CategoryIndex>({
    layout: 'grid',
    pages: [],
  });
  const [loading, setLoading] = useState(false);
  const subcategories: Subcategory[] = categoryIndex.pages;

  // 💡 3. Dynamic Lazy Icon Helper (Supports custom Tailwind sizes and transitions)
  const getIcon = (categoryName?: string, className = 'h-6 w-6') => {
    return (
      <Suspense
        fallback={
          <div
            className={`${className} rounded bg-primary-200/40 animate-pulse shrink-0`}
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

  const getCategory = () => {
    return serviceCategories.categories.find(c => c.slug === category);
  };

  const categoryData = getCategory();

  useEffect(() => {
    if (category && categoryData) {
      setLoading(true);
      getCategorySubcategories(category)
        .then(setCategoryIndex)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [category, categoryData]);

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
        />
      </>
    );
  }
  if (!categoryData) {
    return (
      <Section className="p-3 mb-12">
        <Breadcrumbs className="mb-8" />
        <Banner
          type="error"
          title="Category not found"
          description="The category you are looking for does not exist."
          icon
        />
      </Section>
    );
  }

  return (
    <>
      <SEO
        title={categoryData.category || category}
        description={categoryData.description}
        keywords={`${categoryData.category}, government services, public services, local government`}
      />
      <Section className="p-3 mb-8">
        <Breadcrumbs className="mb-8" />

        {/* Category Header Area */}
        <div className="flex flex-row items-center text-start gap-4">
          {/* 💡 FIXED: Renders larger h-10 category icon dynamically with no <Icon> wrapper */}
          {getIcon(categoryData.icon, 'h-10 w-10 text-primary-600')}
          <h1 className="text-4xl font-axis-titular-focus uppercase text-gray-900 tracking-wide leading-relaxed">
            {categoryData.category || category}
          </h1>
        </div>
        <p className="text-lg font-axis-subtitular-focus text-gray-600 mb-8 tracking-wide">
          {categoryData.description}
        </p>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Text>Loading services...</Text>
          </div>
        ) : (
          <>
            {categoryIndex.title && (
              <h1 className="font-axis-titular-focus uppercase text-gray-900 mt-3 tracking-wide leading-snug">
                {categoryIndex.title}
              </h1>
            )}
            {categoryIndex.description && (
              <p className="text-gray-600 mb-4">{categoryIndex.description}</p>
            )}

            {categoryIndex.layout === 'grid' ? (
              /* 💎 GRID LAYOUT (Synchronized Slide-Wipe Cards with font-axis-navbar-focus) */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {subcategories.map(subcategory => (
                  <Link
                    key={subcategory.slug}
                    to={`/services/${category}/${subcategory.slug}`}
                    className="group relative flex h-full w-full overflow-hidden rounded-xl border border-primary-100/30 bg-primary-50/10 hover:border-primary-500 shadow-xs hover:shadow-md -translate-y-0 hover:-translate-y-0.5 transition-all duration-300 ease-out"
                  >
                    {/* 🌊 Sliding Wipe Background Layer */}
                    <div
                      className="absolute inset-0 bg-primary-700 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"
                      aria-hidden="true"
                    />

                    {/* Left/Main Content Column */}
                    <div className="relative z-10 flex-1 p-5 flex flex-col justify-start items-start text-start gap-4">
                      {/* Header: Dynamic Icon inline with Title */}
                      <div className="flex items-center gap-3 w-full">
                        <div className="bg-primary-100 text-primary-600 group-hover:bg-white/20 group-hover:text-white p-2.5 flex items-center justify-center rounded-lg shrink-0 transition-colors duration-300">
                          {/* 💡 FIXED: Uses getIcon directly with standard h-5/w-5 sizes */}
                          {getIcon(
                            subcategory.icon ||
                              categoryData?.icon ||
                              'RiFileTextLine',
                            'h-5 w-5'
                          )}
                        </div>
                        <h3 className="text-md font-axis-navbar-focus uppercase tracking-wide text-gray-900 group-hover:text-white transition-colors duration-300 line-clamp-2 leading-snug">
                          {subcategory.name}
                        </h3>
                      </div>

                      {/* Description */}
                      {subcategory.description && (
                        <p className="text-sm text-gray-600 group-hover:text-primary-100/95 font-axis-thin transition-colors duration-300 leading-relaxed">
                          {subcategory.description}
                        </p>
                      )}

                      {/* Pinned Category Badge (Bottom-anchored, color-inverting) */}
                      <div className="mt-auto pt-4 flex items-center justify-start">
                        <span className="inline-block px-2.5 py-1 text-[9px] font-axis-bold uppercase tracking-wider rounded bg-gray-100 group-hover:bg-white/20 text-gray-800 group-hover:text-white transition-all duration-300">
                          {categoryData?.category || category}
                        </span>
                      </div>
                    </div>

                    {/* Right Accent Strip Indicator */}
                    <div className="relative z-10 flex items-center justify-center w-11 bg-primary-50/50 group-hover:bg-primary-800 border-l border-primary-100/40 group-hover:border-primary-600 transition-colors duration-300 shrink-0">
                      {/* 💡 FIXED: Uses getIcon directly to render the right arrow indicators cleanly */}
                      {getIcon(
                        'ri:arrow-right-double-line',
                        'h-5 w-5 text-primary-600 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300'
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* 📄 LIST LAYOUT (Horizontal Slide-Wipe Cards) */
              <div className="space-y-4 flex flex-col h-full bg-transparent">
                {subcategories.map(subcategory => (
                  <Link
                    key={subcategory.slug}
                    to={`/services/${category}/${subcategory.slug}`}
                    className="group relative flex w-full overflow-hidden rounded-xl border border-primary-100/30 bg-primary-50/10 hover:border-primary-500 shadow-xs hover:shadow-md -translate-y-0 hover:-translate-y-0.5 transition-all duration-300 ease-out"
                  >
                    {/* 🌊 Sliding Wipe Background Layer */}
                    <div
                      className="absolute inset-0 bg-primary-700 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"
                      aria-hidden="true"
                    />

                    {/* Left Content Column */}
                    <div className="relative z-10 flex-1 p-5 flex flex-col justify-start items-start text-start gap-4">
                      {/* Header */}
                      <div className="flex items-center gap-3 w-full">
                        <div className="bg-primary-100 text-primary-600 group-hover:bg-white/20 group-hover:text-white p-2.5 flex items-center justify-center rounded-lg shrink-0 transition-colors duration-300">
                          {/* 💡 FIXED: Uses getIcon directly */}
                          {getIcon(
                            subcategory.icon ||
                              categoryData?.icon ||
                              'RiFileTextLine',
                            'h-5 w-5'
                          )}
                        </div>
                        <h4 className="text-lg font-axis-navbar-focus uppercase tracking-wide text-gray-900 group-hover:text-white transition-colors duration-300 leading-snug">
                          {subcategory.name}
                        </h4>
                      </div>

                      {/* Description */}
                      {subcategory.description && (
                        <p className="text-sm text-gray-600 group-hover:text-primary-100/95 font-axis-thin transition-colors duration-300 leading-relaxed">
                          {subcategory.description}
                        </p>
                      )}

                      {/* Pinned Category Badge */}
                      <div className="mt-auto pt-1 flex items-center justify-start">
                        <span className="inline-block px-2 py-1 text-[10px] font-medium rounded-sm bg-gray-100 text-gray-800 group-hover:bg-white/10 group-hover:text-white transition-colors duration-300">
                          {categoryData?.category || category}
                        </span>
                      </div>
                    </div>

                    {/* Right Accent Strip */}
                    <div className="relative z-10 flex items-center justify-center w-12 bg-primary-50/50 group-hover:bg-primary-800 border-l border-primary-100/40 group-hover:border-primary-600 transition-colors duration-300 shrink-0">
                      {/* 💡 FIXED: Uses getIcon directly */}
                      {getIcon(
                        'ri:arrow-right-double-line',
                        'h-5 w-5 text-primary-600 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300'
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </Section>
    </>
  );
};

export default Services;
