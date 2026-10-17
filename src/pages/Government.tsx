// src/pages/Government.tsx
import { governmentCategories } from '../data/yamlLoader';
import GovernmentActivitySection from '../components/home/GovernmentActivitySection';
import SEO from '../components/SEO';
import { CategoryCatalogPage } from '@/components/sections/CategoryCatalog';

const Government: React.FC = () => {
  return (
    <CategoryCatalogPage
      basePath="/government"
      categories={governmentCategories.categories}
      notFoundMessage="Process not found."
      emptyStateMessage="No offices or services available under this category at the moment."
      renderOverview={() => (
        <>
          <SEO
            title="Government"
            description="All services and offices provided by the municipal government of Infanta. Find what you need for citizenship, business, education, and more."
            keywords="government services, public services, local government, civic services"
          />
          <GovernmentActivitySection
            title="All local government agencies"
            description="All services and offices provided by the municipal government of Infanta. Find what you need for citizenship, business, education, and more."
            previewLimit={999}
          />
        </>
      )}
    />
  );
};

export default Government;
