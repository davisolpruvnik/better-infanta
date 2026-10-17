// src/components/home/GovernmentActivitySection.tsx
import { governmentCategories } from '../../data/yamlLoader';
import { useTranslation } from '../../hooks/useTranslation';
import { CategorySectionTemplate } from '../sections/CategorySection';

interface GovernmentActivitySectionProps {
  title?: string;
  description?: string;
  previewLimit?: number;
}

export default function GovernmentActivitySection({
  title = 'About the Government',
  description = 'Stay updated with the latest government activities and announcements.',
  previewLimit = 5,
}: GovernmentActivitySectionProps) {
  const { t } = useTranslation();

  return (
    <CategorySectionTemplate
      id="#government"
      title={title}
      description={description}
      basePath="/government"
      categories={(governmentCategories.categories || []) as Category[]}
      previewLimit={previewLimit}
      viewAllLabel={t('governmentActivity.viewAll', 'View all')}
    />
  );
}
