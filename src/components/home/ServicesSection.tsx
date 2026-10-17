// src/components/home/ServicesSection.tsx
import servicesData from '../../data/services.json';
import { useTranslation } from '../../hooks/useTranslation';
import { CategorySectionTemplate } from '../sections/CategorySection';

interface ServicesSectionProps {
  title?: string;
  description?: string;
  previewLimit?: number;
}

export default function ServicesSection({
  title = "Municipal Gov't Services",
  description = 'Find services offered by the local government of Infanta.',
  previewLimit = 3,
}: ServicesSectionProps) {
  const { t } = useTranslation();

  return (
    <CategorySectionTemplate
      title={title}
      description={description}
      basePath="/services"
      categories={((servicesData as any)?.categories || []) as Category[]}
      previewLimit={previewLimit}
      viewAllLabel={t('services.viewAll') || 'View all'}
    />
  );
}
