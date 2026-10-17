// src/pages/Services.tsx
import { serviceCategories } from '../data/yamlLoader';
import ServicesSection from '../components/home/ServicesSection';
import SEO from '../components/SEO';
import { CategoryCatalogPage } from '@/components/sections/CategoryCatalog';

const Services: React.FC = () => {
  return (
    <CategoryCatalogPage
      basePath="/services"
      categories={serviceCategories.categories}
      titleSuffix="Services"
      badgeClassName="border-fantas-300/80 bg-fantas-50/50 p-3 sm:p-5 group-hover:border-fantas-700 group-hover:bg-fantas-100/50"
      notFoundMessage="Process not available yet."
      emptyStateMessage="No services available under this category at the moment."
      renderOverview={() => (
        <>
          <SEO
            title="Services"
            description="All services provided by the municipal government of Infanta. Find what you need for citizenship, business, education, and more."
            keywords="government services, public services, local government, civic services"
          />
          <ServicesSection
            title="All local government services"
            description="All services provided by the municipal government of Infanta. Find what you need for citizenship, business, education, and more."
            previewLimit={999}
          />
        </>
      )}
    />
  );
};

export default Services;
