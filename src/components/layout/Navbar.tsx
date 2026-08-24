// src/components/home/Navbar.tsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { lazy, Suspense, useState } from 'react';
import { LanguageType } from '@/types';
import icoImg from '../../assets/better_infanta_ico.svg';
import { mainNavigation } from '@/data/navigation';
import Timekeeper from './Timekeeper-Weather';
import { LANGUAGES } from '@/i18n/languages';

// 💡 1. Lazy load the Iconify component (0% bundle tax on initial page load)
const LazyIconify = lazy(() =>
  import('@iconify/react').then(m => ({ default: m.Icon }))
);

// 💡 2. Local, ultra-fast icon renderer with a pulsing skeleton fallback
const renderIcon = (iconName: string, className = 'h-4 w-4') => (
  <Suspense
    fallback={
      <div
        className={`${className} bg-gray-200/40 rounded animate-pulse shrink-0`}
      />
    }
  >
    <LazyIconify icon={iconName} className={`${className} shrink-0`} />
  </Suspense>
);

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { t, i18n } = useTranslation('common');

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setActiveMenu(null);
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    setActiveMenu(null);
  };

  const toggleSubmenu = (label: string) => {
    setActiveMenu(activeMenu === label ? null : label);
  };

  const changeLanguage = (newLanguage: LanguageType) => {
    i18n.changeLanguage(newLanguage);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      {/* Main navigation */}
      <div className="container mx-auto px-8 sm:px-12">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center" onClick={closeMenu}>
              <div>
                <img
                  src={icoImg}
                  alt="Better Infanta IcoLogo"
                  className="w-16 h-16 object-contain shrink-0"
                />
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center justify-end w-full max-w-3xl ml-auto space-x-8">
            <div className="flex items-center space-x-8">
              {mainNavigation.map(item => (
                <div key={item.label} className="relative group">
                  <Link
                    to={item.href}
                    className="group flex items-center text-fantas-900/80 font-axis-navbar-focus hover:text-fantas-700 uppercase tracking-wider transition-colors"
                  >
                    {t(`${item.label}`)}
                    {item.children &&
                      renderIcon(
                        'lucide:chevron-down',
                        'ml-1 h-4 w-4 text-gray-800 group-hover:text-fantas-700 transition-transform duration-300 group-hover:rotate-180'
                      )}
                  </Link>
                  {item.children && (
                    <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        {item.children.map(child => (
                          <Link
                            key={child.label}
                            to={child.href}
                            className="text-left block px-4 py-2 text-md tracking-wide text-gray-700 hover:bg-fantas-50 hover:text-fantas-700 font-axis-subtitular-focus"
                            role="menuitem"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={toggleMenu}
              aria-expanded={isOpen}
              aria-label="Toggle main menu"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-fantas-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-fantas-500 transition-colors"
            >
              {isOpen
                ? renderIcon('lucide:x', 'block h-6 w-6')
                : renderIcon('lucide:menu', 'block h-6 w-6')}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:block border-t border-gray-200">
        <Timekeeper />
      </div>

      {/* Mobile menu container */}
      <div className={`lg:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="container mx-auto px-4 pt-2 pb-4 space-y-1 border-t border-gray-200 bg-white shadow-lg">
          {mainNavigation.map(item => {
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isSubmenuOpen = activeMenu === item.label;

            return (
              <div key={item.label} className="border-b border-gray-100 last:border-b-0">
                {hasChildren ? (
                  /* Accordion Trigger Button for items with submenu */
                  <button
                    type="button"
                    onClick={() => toggleSubmenu(item.label)}
                    aria-expanded={isSubmenuOpen}
                    className="w-full flex justify-between items-center px-4 py-3 text-sm text-gray-700 font-axis-navbar-focus hover:bg-gray-50 hover:text-fantas-700 uppercase tracking-wider transition-colors"
                  >
                    <span>{t(item.label.toUpperCase())}</span>
                    {renderIcon(
                      'lucide:chevron-down',
                      `h-5 w-5 text-gray-600 transition-transform duration-300 ease-in-out ${
                        isSubmenuOpen ? 'rotate-180 text-fantas-700' : ''
                      }`
                    )}
                  </button>
                ) : (
                  /* Direct Link for items without submenus */
                  <Link
                    to={item.href}
                    onClick={closeMenu}
                    className="block px-4 py-3 text-sm text-gray-700 font-axis-navbar-focus hover:bg-gray-50 hover:text-fantas-700 uppercase tracking-wider transition-colors"
                  >
                    {t(item.label.toUpperCase())}
                  </Link>
                )}

                {/* Animated Accordion Panel */}
                {hasChildren && (
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isSubmenuOpen
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-6 py-2 space-y-1 bg-gray-50/80 rounded-md my-1">
                        {item.children?.map(child => (
                          <Link
                            key={child.label}
                            to={child.href}
                            onClick={closeMenu}
                            className="block px-4 py-2 text-sm tracking-wide text-gray-600 hover:bg-fantas-50 hover:text-fantas-700 font-axis-subtitular-focus transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Language Selector */}
          <div className="px-4 py-3 mt-2 border-t border-gray-200">
            <div className="flex items-center">
              {renderIcon('lucide:globe', 'h-5 w-5 text-gray-800 mr-2')}
              <select
                value={i18n.language}
                onChange={e => changeLanguage(e.target.value as LanguageType)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 hover:border-fantas-600 focus:outline-none focus:ring-1 focus:ring-fantas-600 focus:border-fantas-600 font-axis-navbar-focus"
              >
                {Object.entries(LANGUAGES).map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
