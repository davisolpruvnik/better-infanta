import type { NavigationItem } from '../types';
import {
  serviceCategories as servicesData,
  governmentCategories as governmentData,
} from './yamlLoader';

interface Subcategory {
  name: string;
  slug: string;
}

interface Category {
  category: string;
  slug: string;
  subcategories: Subcategory[];
}

export const mainNavigation: NavigationItem[] = [
  {
    label: 'Services',
    href: '/services',
    children: (servicesData.categories as Category[]).map(category => ({
      label: category.category,
      href: `/services/${category.slug}`,
    })),
  },
  {
    label: 'Government',
    href: '/government',
    children: (governmentData.categories as Category[]).map(category => ({
      label: category.category,
      href: `/government/${category.slug}`,
    })),
  },
  {
    label: 'Statistics',
    href: '/statistics',
  },
  {
    label: 'Transparency',
    href: '/transparency',
  },
];

export const footerNavigation = {
  mainSections: [
    {
      title: 'About BettergovPH',
      links: [
        { label: 'About the Portal', href: '/about' },
        // { label: 'Privacy Policy', href: '/privacy' },
        // { label: 'Terms of Use', href: '/terms' },
        // { label: 'Accessibility', href: '/accessibility' },
        // { label: 'Contact Us', href: '/about' },
        { label: 'Join BetterGovPH Community', href: 'https://bettergov.ph/join-us' },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'All Services', href: '/services' },
        ...(servicesData.categories as Category[])
          .slice(0, 4)
          .map(category => ({
            label: category.category,
            href: `/services/${category.slug}`,
          })),
      ],
    },
    {
      title: 'Government',
      links: [
        {
          label: 'Contact Center',
          href: 'https://contactcenterngbayan.gov.ph',
        },
        {
          label: 'Official Gazette',
          href: 'https://www.officialgazette.gov.ph',
        },
        { label: 'Stop Gambling Addiction!', href: 'https://www.pagcor.ph/regulatory/exclusion.php' },
        {
          label: 'Electronic Notary Services',
          href: 'https://sc.judiciary.gov.ph/enotarization/'
        },
        { label: 'Hotlines', href: '/philippines/hotlines' }
      ],
    },
    {
      title: 'Open Data',
      links: [
        { label: 'Open Data', href: 'https://data.gov.ph' },
        { label: 'Freedom of Information', href: 'https://www.foi.gov.ph' },
        {
          label: 'Project NOAH',
          href: 'https://noah.up.edu.ph/'
        },
        {
          label: 'Bureau of Local Government & Finance',
          href: 'https://blgf.gov.ph/lgu-fiscal-data/'
        }
      ],
    }
  ],
  socialLinks: [
    {
      label: 'GitHub',
      href: 'https://github.com/davisolpruvnik/betterinfanta',
    },
  ],
};
