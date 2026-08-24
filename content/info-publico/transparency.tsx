import { useTranslation } from 'react-i18next';

export default function TransparencyPage() {
  const { t } = useTranslation();
  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12 md:py-24">
      <div className="container mx-auto px-8 sm:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left section with title and search */}
          <div className="animate-fade-in">
            <span className="uppercase">Welcome to</span>
          </div>
        </div>
      </div>
    </div>
  );
}
