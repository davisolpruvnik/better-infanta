import Section from '../components/ui/Section';
import { useParams, Link } from 'react-router-dom';
import { Heading } from '../components/ui/Heading';
import { Text } from '../components/ui/Text';
import {
  serviceCategories,
  getCategorySubcategories,
  type Subcategory,
  type CategoryIndex,
} from '../data/yamlLoader';
import * as LucideIcons from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import ServicesSection from '../components/home/ServicesSection';
import SEO from '../components/SEO';
import { Card, CardContent } from '@bettergov/kapwa/card';
import { Banner } from '@bettergov/kapwa/banner';
import { useState, useEffect } from 'react';

const Services: React.FC = () => {
  const { category } = useParams();
  const [categoryIndex, setCategoryIndex] = useState<CategoryIndex>({
    layout: 'grid',
    pages: [],
  });
  const [loading, setLoading] = useState(false);
  const subcategories: Subcategory[] = categoryIndex.pages;

  const getCategory = () => {
    return serviceCategories.categories.find(c => c.slug === category);
  };

  const categoryData = getCategory();
  const Icon = LucideIcons[
    categoryData?.icon as keyof typeof LucideIcons
  ] as React.ComponentType<{ className?: string }>;

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
        <div className="flex flex-row items-center text-start mb-2 gap-4">
          <Icon className="h-10 w-10 text-primary-600 rounded-md" />
          <Heading>{categoryData.category || category}</Heading>
        </div>
        <Text className="text-gray-600 mb-8">{categoryData.description}</Text>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Text>Loading services...</Text>
          </div>
        ) : (
          <>
            {categoryIndex.title && (
              <Heading level={3}>{categoryIndex.title}</Heading>
            )}
            {categoryIndex.description && (
              <Text className="text-gray-600 mb-4">
                {categoryIndex.description}
              </Text>
            )}
            {categoryIndex.layout === 'grid' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subcategories.map(subcategory => (
                  <Link
                    key={subcategory.slug}
                    to={`/services/${category}/${subcategory.slug}`}
                    className="flex h-full" // Ensure the Link stretches to full cell height
                  >
                    <Card
                      hoverable
                      className="flex flex-col h-full w-full py-2.5 rounded-b-lg text-primary-600 hover:text-primary-700 bg-primary-50/25 hover:bg-primary-50/50 border-1 shadow-none hover:shadow-sm -translate-y-0 hover:-translate-y-0.5 transition-all duration-200 ease-in-out"
                    >
                      {/* CardContent is set to flex col to manage inner space distribution */}
                      <CardContent className="flex flex-col flex-1 p-5 h-full">
                        {/* 1. Header and description wrapper (fills remaining vertical space) */}
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {subcategory.name}
                          </h4>
                          {subcategory.description && (
                            <p className="mt-2 text-sm text-gray-600">
                              {subcategory.description}
                            </p>
                          )}
                        </div>

                        {/* 2. Badge container (always pinned to the absolute bottom) */}
                        <div className="mt-4 pt-1 flex items-center justify-start">
                          <span className="inline-block px-2 py-1 text-xs font-medium rounded-sm bg-gray-100 text-gray-800">
                            {categoryData.category || category}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-4 flex flex-col h-full p-6 bg-white rounded-xl border border-gray-200 justify-between align-baseline">
                {subcategories.map(subcategory => (
                  <Link
                    key={subcategory.slug}
                    to={`/services/${category}/${subcategory.slug}`}
                    className="block"
                  >
                    <Card hoverable className="flex flex-col h-full">
                      <CardContent className="flex flex-col flex-1 p-5">
                        {/* 1. Content Area (pushes badge down) */}
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {subcategory.name}
                          </h4>
                          {subcategory.description && (
                            <p className="mt-2 text-sm text-gray-600">
                              {subcategory.description}
                            </p>
                          )}
                        </div>

                        {/* 2. Pinned Badge */}
                        <div className="mt-4 pt-1 flex items-center justify-start">
                          <span className="inline-block px-2 py-1 text-xs font-medium rounded-sm bg-gray-100 text-gray-800">
                            {categoryData.category || category}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
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
