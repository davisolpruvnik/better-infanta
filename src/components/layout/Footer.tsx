// src/components/ui/Footer.tsx
import React, { lazy, Suspense } from 'react';
import { footerNavigation } from '../../data/navigation';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// 💡 1. Lazy load the Iconify component as LazyIconify to avoid bundle bloat on load
const LazyIconify = lazy(() =>
  import('@iconify/react').then(m => ({ default: m.Icon }))
);

// 💡 2. Map social labels to clean, high-contrast Remix Icons
const SOCIAL_ICONS: Record<string, string> = {
  Facebook: 'ri:facebook-box-fill',
  Twitter: 'ri:twitter-x-fill', // Modern X/Twitter variant
  Instagram: 'ri:instagram-line',
  YouTube: 'ri:youtube-fill',
  GitHub: 'ri:github-fill',
};

const Footer: React.FC = () => {
  const { t } = useTranslation('common');

  // 💡 3. Dynamic social icon resolver with Suspense loaders
  const getSocialIcon = (label: string) => {
    const iconName = SOCIAL_ICONS[label];
    if (!iconName) return null;

    return (
      <Suspense
        fallback={
          <div className="h-5 w-5 rounded-full bg-gray-800 animate-pulse shrink-0" />
        }
      >
        <LazyIconify
          icon={iconName}
          className="h-5 w-5 shrink-0 transition-transform duration-200 hover:scale-110"
        />
      </Suspense>
    );
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              {/* 💡 Checkmark Portal Logo (Lazy Loaded with pulse placeholder) */}
              <Suspense
                fallback={
                  <div className="h-12 w-12 mr-3 rounded-full bg-gray-800 animate-pulse shrink-0" />
                }
              >
                <LazyIconify
                  icon="ri:checkbox-circle-fill"
                  className="h-12 w-12 mr-3 text-primary-400 shrink-0"
                />
              </Suspense>

              <div>
                <div className="font-bold">Infanta, Quezon Portal</div>
                <div className="text-xs text-gray-400">
                  A BetterGov.ph Portal
                </div>
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-4">
              A community portal providing Philippine citizens, businesses, and
              visitors with information and services.
            </p>

            {/* Social Links Row */}
            <div className="flex space-x-4">
              {footerNavigation.socialLinks.map(link => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit our official ${link.label} page`}
                >
                  {getSocialIcon(link.label)}
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation Links Columns */}
          {footerNavigation.mainSections.map(section => (
            <div key={section.title}>
              <h3 className="text-lg text-gray-400 font-axis-navbar-focus uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-gray-500 hover:text-white text-sm transition-colors font-axis-footer-focus uppercase tracking-wider leading-snug"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Copyright & Standard Footer Links */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-center text-sm sm:text-xs font-axis-medium tracking-wide mb-4 md:mb-0">
              {t('footer.copyright')}
            </p>
            <div className="flex space-x-6 font-axis-subtitular-focus tracking-wider uppercase">
              <Link
                to="https://github.com/bettergovph/bettergov"
                className="text-gray-500 hover:text-white text-sm transition-colors"
              >
                Contribute at GitHub
              </Link>
              <Link
                to="/sitemap"
                className="text-gray-500 hover:text-white text-sm transition-colors"
              >
                Sitemap
              </Link>
              <a
                href="/accessibility"
                className="text-gray-500 hover:text-white text-sm transition-colors"
              >
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
