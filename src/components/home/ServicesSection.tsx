import Section from '../ui/Section';
import * as LucideIcons from 'lucide-react';
import { Text } from '../ui/Text';
import { useTranslation } from '../../hooks/useTranslation';
import { Card, CardContent } from '@bettergov/kapwa/card';
import { Link } from 'react-router-dom';

import { serviceCategories } from '../../data/yamlLoader';

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

export default function ServicesSection({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const { t } = useTranslation();

  const getIcon = (category: string) => {
    const IconComponent = LucideIcons[
      category as keyof typeof LucideIcons
    ] as React.ComponentType<{ className?: string }>;
    return IconComponent ? <IconComponent className="h-6 w-6" /> : null;
  };

  const displayedCategories = serviceCategories.categories as Category[];

  return (
    <Section>
      <div className="mb-8 text-center items-center font-axis-sng-indlab-value">
        <h1 className="text-4xl mb-2 uppercase tracking-wider">
          {title || t('services.title')}
        </h1>
        <span className="text-gray-600 mb-6 font-axis-medium">
          {description || t('services.description')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayedCategories.map(category => (
          <Card key={category.slug} hoverable className="inset-shadow-sm">
            <Link
              to={`/services/${category.slug}`}
              className="mt-auto text-primary-600 hover:text-primary-700 transition-colors inline-flex items-center bg-primary-50/25 hover:bg-primary-50/50 rounded-b-md h-full w-full justify-center py-2 border-0.5"
            >
              <CardContent className="flex flex-col h-full p-6 text-center">
                <div className="flex flex-col gap-2">
                  <div className="bg-primary-100 text-primary-600 p-3 rounded-md mb-4 self-center items-center">
                    {getIcon(category.icon)}
                  </div>

                  <h3 className="text-xl font-axis-navbar-focus uppercase tracking-wide mb-4 text-gray-900 self-center">
                    {category.category}
                  </h3>
                </div>
                <Text className="text-gray-800 font-axis-thin">
                  {category.description}
                </Text>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </Section>
  );
}
