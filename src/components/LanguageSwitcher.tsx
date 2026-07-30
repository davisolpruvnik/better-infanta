import { useTranslation } from 'react-i18next';
import { lazy, Suspense } from 'react';

// 💡 LAZY ENABLED: Dynamic, eco-friendly Iconify renderer
const LazyIconify = lazy(() =>
  import('@iconify/react').then(module => ({ default: module.Icon }))
);

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fil', name: 'Filipino', flag: '🇵🇭' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer">
        {/* 💡 FIXED: Wrapped inside Suspense for eco-friendly, asynchronous 0kb render-on-demand */}
        <Suspense
          fallback={
            <div className="h-4 w-4 rounded-full bg-gray-200 animate-pulse shrink-0" />
          }
        >
          <LazyIconify icon="lucide:globe" className="h-4 w-4 shrink-0" />
        </Suspense>
        <span>{languages.find(lang => lang.code === i18n.language)?.flag}</span>
        <span className="hidden sm:inline">
          {languages.find(lang => lang.code === i18n.language)?.name}
        </span>
      </button>

      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1">
          {languages.map(language => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-100 transition-colors cursor-pointer ${
                i18n.language === language.code
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700'
              }`}
            >
              <span>{language.flag}</span>
              <span>{language.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
