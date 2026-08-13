// src/components/ui/Footer.tsx
import React, { lazy, Suspense } from 'react';
import { footerNavigation } from '../../data/navigation';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Disclaimer from './disclaimer';

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
    <footer className="bg-fantas-900 text-white">
      <div className="container mx-auto px-8 sm:px-12 pt-12 pb-8">
        <Disclaimer />
        <div className="grid grid-cols-1 xs:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-6 pt-12">
          <div className='pb-8'>
            <div className="flex items-center mb-4">
              {/* 💡 Checkmark Portal Logo (Lazy Loaded with pulse placeholder) */}
              <Suspense
                fallback={
                  <div className="h-12 w-12 mr-3 rounded-full bg-fantas-900 animate-pulse shrink-0" />
                }
              >
                <div
                  className="w-32 h-18 bg-fantas-50 shrink-0 [mask-image:url('../../assets/better_infanta_logotemp.svg')] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:clear-left] scale-115"
                  role="img"
                  aria-label="Better Infanta Logo"
                />
              </Suspense>

              {/*<div>
                <div className="font-axis-sng-indlab-value tracking-wider uppercase leading-tight text-fantas-50">Better Infanta</div>
                <div className="font-axis-subtitular-focus tracking-wider uppercase text-sm text-fantas-50">
                  A BetterGov.ph Portal
                </div>
              </div>*/}
            </div>

            <p className="font-axis-footer-focus text-fantas-50/90 tracking-wider text-sm mb-4 wrap-break-word">
              A community portal providing Infantahins, visitors, and businesses with information and services.
            </p>

            {/* Social Links Row */}
            <div className="flex space-x-4 justify-center md:justify-start lg:justify-start">
              <span className='uppercase font-axis-subtitular-focus tracking-wider text-sm text-fantas-50/90'>Profile</span>
              {footerNavigation.socialLinks.map(link => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-fantas-50/90 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit our official ${link.label} page`}
                >
                  {getSocialIcon(link.label)}
                </Link>
              ))}
            </div>
            <div className='pt-8 flex flex-col gap-4'>
              {/* Cost to create website */}
              <div className='flex flex-row items-center justify-between gap-2'>
                <span className='uppercase font-axis-navbar-focus text-sm text-fantas-50 tracking-wider leading-snug line-clamp-2 text-pretty'>
                  Cost to create this website
                </span>
                <div className='min-w-[130px] bg-flamengo-500/75 px-2.5 py-1.5 ml-auto shrink-0 flex items-baseline justify-end gap-1.5'>
                  <span className='text-xs font-axis-navbar-focus tracking-wider opacity-90 text-fantas-50'>PHP</span>
                  <span className='uppercase font-axis-sng-indlab-value tracking-wider text-4xl text-fantas-50'>650</span>
                </div>
              </div>

              {/* Cost for every Infantahin */}
              <div className='flex flex-row items-center justify-between gap-2'>
                <span className='uppercase font-axis-navbar-focus text-sm text-fantas-50 tracking-wider leading-snug line-clamp-2 text-pretty'>
                  Cost for every Infantahin
                </span>
                <div className='min-w-[130px] bg-arvore-600/80 px-2.5 py-1.5 ml-auto shrink-0 flex items-baseline justify-end gap-1.5'>
                  <span className='text-xs font-axis-navbar-focus tracking-wider opacity-90 text-fantas-50'>PHP</span>
                  <span className='uppercase font-axis-sng-indlab-value tracking-wider text-4xl text-fantas-50'>0</span>
                </div>
              </div>
            </div>
          </div>


          {/* Navigation Links Columns */}
          {footerNavigation.mainSections.map((section, index) => (
            <div
              key={section.title}
              className={index === 2 ? 'xs:col-start-2 md:col-start-2 lg:col-start-auto' : ''}
            >
              <h3 className="text-lg text-fantas-900 font-axis-navbar-focus uppercase tracking-wider mb-4">
                <span className='bg-fantas-50 px-1.5 py-0.5'>{section.title}</span>
              </h3>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-fantas-50/75 hover:text-white text-sm transition-colors font-axis-footer-focus uppercase tracking-wider"
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
        <div className="border-t border-fantas-50/30 border-dotted mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-fantas-50/90 text-center text-xs font-axis-footer-focus uppercase tracking-wider mb-4 md:mb-0 text-pretty">
              {t('footer.copyright')}
            </p>
            <div className="flex space-x-6 font-axis-footer-focus tracking-wider uppercase">
              <Link
                to="https://github.com/bettergovph/bettergov"
                className="text-fantas-50/90 hover:text-white text-xs transition-colors"
              >
                Contribute
              </Link>
              <Link
                to="/sitemap"
                className="text-fantas-50/90 hover:text-white text-xs transition-colors"
              >
                Sitemap
              </Link>
              <a
                href="/accessibility"
                className="text-fantas-50/90 hover:text-white text-xs transition-colors"
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
