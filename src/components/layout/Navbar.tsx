// src/components/home/Navbar.tsx
import React, { useState, lazy, Suspense } from 'react';
import { mainNavigation } from '../../data/navigation';
import type { LanguageType } from '../../types/index';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n/languages';
import Timekeeper from './Timekeeper-Weather';

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
    <nav className="bg-white shadow-sm sticky top-0 z-25">
      {/* Main navigation */}
      <div className="container mx-auto px-8 sm:px-12">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              {/* 💡 FIXED: Unified dynamic checkmark logo */}
              {renderIcon(
                'lucide:check-circle-2',
                'h-10 w-10 mr-3 text-fantas-900'
              )}
              <div>
                <div className="text-fantas-900 font-bold">Better Infanta</div>
                <div className="text-xs text-fantas-800">
                  A community-run platform for Infanta, Quezon
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center justify-end w-full max-w-3xl ml-auto space-x-8">
            {/* Main Navigation Items */}
            <div className="flex items-center space-x-8">
              {mainNavigation.map(item => (
                <div key={item.label} className="relative group">
                  <a
                    href={item.href}
                    className="group flex items-center text-fantas-900/80 font-axis-navbar-focus hover:text-fantas-700 uppercase tracking-wider transition-colors"
                  >
                    {t(`${item.label}`)}
                    {item.children &&
                      renderIcon(
                        'lucide:chevron-down',
                        'ml-1 h-4 w-4 text-gray-800 group-hover:text-fantas-700 transition-all duration-200 group-hover:rotate-180'
                      )}
                  </a>
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

            {/* Auxiliary Links (About & Search) */}
            <div className="flex items-center space-x-6">
              <Link
                to="/about"
                className="flex items-center text-fantas-800 hover:text-fantas-700 font-axis-navbar-focus transition-colors uppercase tracking-wider"
              >
                About
              </Link>
              <Link
                to="/search"
                className="flex items-center text-fantas-800 hover:text-fantas-700 font-axis-navbar-focus transition-colors uppercase tracking-wider gap-1"
              >
                {renderIcon('lucide:search', 'h-4 w-4')}
                Search
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-fantas-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-fantas-500"
            >
              <span className="sr-only">Open main menu</span>
              {/* 💡 FIXED: Hamburger Menu Toggle icon */}
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

      {/* Mobile menu */}
      <div className={`lg:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="container mx-auto px-2 pt-2 pb-4 space-y-1 border-t border-gray-200 bg-white">
          {mainNavigation.map(item => (
            <div key={item.label}>
              <button
                onClick={() => toggleSubmenu(item.label)}
                className="w-full flex justify-between items-center px-4 py-2 text-sm text-gray-700 font-axis-navbar-focus hover:bg-gray-50 hover:text-fantas-700 uppercase tracking-wider transition-colors"
              >
                {t(`${item.label.toUpperCase()}`)}
                {item.children &&
                  /* 💡 FIXED: Mobile Chevron Down animation */
                  renderIcon(
                    'lucide:chevron-down',
                    `h-5 w-5 transition-transform ${activeMenu === item.label ? 'transform rotate-180' : ''}`
                  )}
              </button>
              {item.children && activeMenu === item.label && (
                <div className="pl-6 py-2 space-y-1 bg-gray-50">
                  {item.children.map(child => (
                    <Link
                      key={child.label}
                      to={child.href}
                      onClick={closeMenu}
                      className="block px-4 py-2 text-sm tracking-wide text-gray-700 hover:bg-fantas-50 hover:text-fantas-700 font-axis-subtitular-focus transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link
            to="/join-us"
            onClick={closeMenu}
            className="flex items-center gap-2 px-4 py-2 text-sm text-fantas-600 hover:bg-fantas-50 hover:text-fantas-700 font-axis-navbar-focus uppercase tracking-wider transition-colors"
          >
            {/* 💡 FIXED: Rocket icon */}
            {renderIcon(
              'lucide:rocket',
              'h-5 w-5 text-red-500 fill-red-500/20'
            )}
            Join Us
          </Link>
          <Link
            to="/about"
            onClick={closeMenu}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-fantas-700 font-axis-navbar-focus uppercase tracking-wider transition-colors"
          >
            About
          </Link>
          <Link
            to="/search"
            onClick={closeMenu}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-fantas-700 font-axis-navbar-focus uppercase tracking-wider transition-colors"
          >
            Search
          </Link>
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex items-center">
              {/* 💡 FIXED: Globe icon */}
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
