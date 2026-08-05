// src/pages/Document.tsx
import Section from '../components/ui/Section';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Heading } from '../components/ui/Heading';
import { Text } from '../components/ui/Text';
import { Banner } from '@bettergov/kapwa/banner';
import { useParams } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  loadMarkdownContent,
  type MarkdownContent,
} from '../lib/markdownLoader';
import { createMarkdownComponents } from '../lib/markdownComponents';
import { Card, CardContent, CardHeader } from '@bettergov/kapwa/card';
import { getTypographyTheme } from '../lib/typographyThemes';
import {
  serviceCategories,
  governmentCategories,
  getCategorySubcategories,
  isNestedCategory,
  type Subcategory,
  type CategoryIndex,
} from '../data/yamlLoader';
import SEO from '../components/SEO';
// 💡 Swapped out Tooltip for Popover to support tapping on touch devices
import { Radio, RadioGroup, Popover } from '@base-ui/react';

// 💡 1. Import your modular shared icon resolver
import { resolveIconName } from '@/lib/icon-resolver';

// 💡 2. Lazy load the Iconify component as LazyIconify to avoid bundle-bloat
const LazyIconify = lazy(() =>
  import('@iconify/react').then(module => ({ default: module.Icon }))
);

interface DocumentProps {
  theme?: string;
  categoryType?: 'service' | 'government';
}

// Helper to format requirements keys dynamically into tab titles
function formatRequirementLabel(key: string): string {
  if (key === 'requirements') return 'General';
  const cleanKey = key.replace(/^requirements_?/, '');
  if (!cleanKey) return 'General';
  return cleanKey
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// 💡 Helper to cleanly format a raw slug if all YAML/Markdown metadata is missing
function formatSlugToTitle(slug: string): string {
  if (!slug) return '';
  if (slug.includes(' ')) return slug; // Already formatted
  return slug
    .split('-')
    .map(word => {
      const lower = word.toLowerCase();
      if (lower === 'sf') return 'SF';
      if (lower === 'id') return 'ID';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Structured data map interface for custom layout parsing
interface ParsedServiceDoc {
  isStructured: boolean;
  title: string;
  description: string;
  fees?: string;
  feeDetails?: string;
  time?: string;
  office?: string;
  officeAddress?: string;
  officeHours?: string;
  requirementsGroups: { key: string; label: string; items: string[] }[];
  whocanavail: string[];
  steps: string[];
  postscripts?: string;
  rawMarkdownContent: string;
}

// Built-in, zero-dependency parser to convert Markdown frontmatter into rich TSX layouts
function parseServiceDocument(
  titleFromLoader: string,
  descriptionFromLoader: string,
  rawMarkdown: string
): ParsedServiceDoc {
  // 💡 Check for markdown H1 header as a high-quality fallback for raw markdown files
  let fallbackTitle = titleFromLoader;
  if (rawMarkdown) {
    const h1Match = rawMarkdown.match(/^#\s+(.+)$/m);
    if (h1Match) {
      fallbackTitle = h1Match[1].trim();
    } else {
      fallbackTitle = formatSlugToTitle(titleFromLoader);
    }
  }

  if (
    !rawMarkdown ||
    typeof rawMarkdown !== 'string' ||
    !rawMarkdown.trim().startsWith('---')
  ) {
    return {
      isStructured: false,
      title: fallbackTitle,
      description: descriptionFromLoader,
      requirementsGroups: [],
      whocanavail: [],
      steps: [],
      postscripts: undefined,
      rawMarkdownContent: rawMarkdown || '',
    };
  }

  try {
    const parts = rawMarkdown.split('---');
    if (parts.length < 3) {
      return {
        isStructured: false,
        title: fallbackTitle,
        description: descriptionFromLoader,
        requirementsGroups: [],
        whocanavail: [],
        steps: [],
        postscripts: undefined,
        rawMarkdownContent: rawMarkdown,
      };
    }

    const frontmatterText = parts[1];
    const remainingMarkdown = parts.slice(2).join('---').trim();

    // FIXED: Strong typing instead of 'any' to satisfy strict TS/ESLint rules
    const data: Record<string, string | string[]> = {};
    let currentKey = '';
    let currentList: string[] = [];

    const lines = frontmatterText.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check if it's an array item (e.g., - "Valid ID")
      if (trimmedLine.startsWith('-') && currentKey) {
        const itemValue = trimmedLine
          .replace(/^-\s*/, '')
          .replace(/^["']|["']$/g, '')
          .trim();
        currentList.push(itemValue);
        data[currentKey] = [...currentList];
        continue;
      }

      // Check if it's a key-value property (e.g., fees: "₱50.00")
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex !== -1) {
        const key = trimmedLine.substring(0, colonIndex).trim();
        const value = trimmedLine
          .substring(colonIndex + 1)
          .trim()
          .replace(/^["']|["']$/g, '');

        currentKey = key;
        currentList = []; // Reset sub-list

        if (value) {
          data[key] = value;
        }
      }
    }

    // Dynamic processing of requirements fields
    const requirementsGroups: {
      key: string;
      label: string;
      items: string[];
    }[] = [];
    for (const key of Object.keys(data)) {
      if (key.startsWith('requirements')) {
        const items = Array.isArray(data[key]) ? (data[key] as string[]) : [];
        if (items.length > 0) {
          requirementsGroups.push({
            key,
            label: formatRequirementLabel(key),
            items,
          });
        }
      }
    }

    // Sort to prioritize general requirements first, followed by custom groups alphabetically
    requirementsGroups.sort((a, b) => {
      if (a.key === 'requirements') return -1;
      if (b.key === 'requirements') return 1;
      return a.label.localeCompare(b.label);
    });

    const isStructured = !!(
      data['fees'] ||
      data['time'] ||
      data['office'] ||
      requirementsGroups.length > 0 ||
      data['steps']
    );

    return {
      isStructured,
      title: (data['title'] as string) || fallbackTitle,
      description: (data['description'] as string) || descriptionFromLoader,
      fees: data['fees'] as string,
      feeDetails: data['fee_details'] as string,
      time: (data['time'] || data['processingTime']) as string,
      office: data['office'] as string,
      officeAddress: (data['office_address'] as string) || undefined,
      officeHours: (data['office_hours'] as string) || undefined,
      requirementsGroups,
      whocanavail: Array.isArray(data['whocanavail'])
        ? (data['whocanavail'] as string[])
        : [],
      steps: Array.isArray(data['steps']) ? (data['steps'] as string[]) : [],
      postscripts: Array.isArray(data['postscripts'])
        ? (data['postscripts'] as string[]).join('\n')
        : (data['postscripts'] as string) || undefined,
      rawMarkdownContent: remainingMarkdown,
    };
  } catch (err) {
    console.error(
      'Failed parsing structured frontmatter, falling back to raw Markdown',
      err
    );
    return {
      isStructured: false,
      title: fallbackTitle,
      description: descriptionFromLoader,
      requirementsGroups: [],
      whocanavail: [],
      steps: [],
      postscripts: undefined,
      rawMarkdownContent: rawMarkdown,
    };
  }
}

export default function Document({
  theme: initialTheme = 'default',
  categoryType,
}: DocumentProps) {
  const { documentSlug, category } = useParams();
  const [markdownContent, setMarkdownContent] =
    useState<MarkdownContent | null>(null);
  const [nestedIndex, setNestedIndex] = useState<CategoryIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 💡 Dynamic active requirements group state
  const [activeReqKey, setActiveReqKey] = useState<string>('');

  const markdownComponents = createMarkdownComponents(
    getTypographyTheme(initialTheme)
  );

  const [breadcrumbs, setBreadcrumbs] = useState([
    { label: 'Home', href: '/' },
  ]);

  // 💡 3. Dynamic Lazy Icon Helper
  const getIcon = (categoryName?: string, className = 'h-4 w-4') => {
    return (
      <Suspense
        fallback={
          <div
            className={`${className} rounded bg-primary-200/40 animate-pulse shrink-0`}
          />
        }
      >
        <LazyIconify
          icon={resolveIconName(categoryName)}
          className={`${className} shrink-0`}
        />
      </Suspense>
    );
  };

  useEffect(() => {
    if (!documentSlug || !category || !categoryType) {
      setError('No document specified');
      setLoading(false);
      return;
    }

    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const isGovernment = categoryType === 'government';
        const categories = isGovernment
          ? governmentCategories.categories
          : serviceCategories.categories;
        const sectionLabel = isGovernment ? 'Government' : 'Services';
        const sectionHref = isGovernment ? '/government' : '/services';
        const categoryData = categories.find(c => c.slug === category);

        if (isNestedCategory(documentSlug)) {
          const index = await getCategorySubcategories(documentSlug);
          setNestedIndex(index);
          setBreadcrumbs([
            { label: 'Home', href: '/' },
            { label: sectionLabel, href: sectionHref },
            {
              label: categoryData?.category ?? category,
              href: `${sectionHref}/${category}`,
            },
            {
              label: index.title ?? formatSlugToTitle(documentSlug),
              href: undefined, // 💡 Last item (current page) should not be clickable
            },
          ]);
          return;
        }

        const content = await loadMarkdownContent(
          documentSlug,
          category,
          categoryType
        );
        setMarkdownContent(content);

        // Parse frontmatter (or check for `# Title` headings) immediately to capture the clean title
        const parsedDoc = parseServiceDocument(
          content.title || documentSlug || '',
          content.description || '',
          content.content
        );

        setBreadcrumbs([
          { label: 'Home', href: '/' },
          { label: sectionLabel, href: sectionHref },
          {
            label: categoryData?.category ?? category,
            href: `${sectionHref}/${category}`,
          },
          {
            label:
              parsedDoc.title ||
              content.title ||
              formatSlugToTitle(documentSlug),
            href: undefined, // 💡 Last item (current page) should not be clickable
          },
        ]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load document'
        );
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [documentSlug, category, categoryType]);

  // Set default requirement tab on load
  useEffect(() => {
    if (markdownContent) {
      const doc = parseServiceDocument(
        markdownContent.title || documentSlug || '',
        markdownContent.description || '',
        markdownContent.content
      );
      if (doc.requirementsGroups.length > 0) {
        setActiveReqKey(doc.requirementsGroups[0].key);
      }
    }
  }, [markdownContent, documentSlug]);

  if (loading) {
    return (
      <Section className="p-3 mb-12">
        <Banner type="info" description="Loading document..." />
      </Section>
    );
  }

  if (error) {
    return (
      <Section className="p-3 mb-12 justify-center">
        {/* 💡 Centered breadcrumbs in error view */}
        <div className="flex justify-center mb-8">
          <Breadcrumbs items={breadcrumbs} />
        </div>
        <Banner
          type="error"
          title="Document Not Found"
          description={error}
          icon
        />
      </Section>
    );
  }

  if (nestedIndex) {
    const nestedPages: Subcategory[] = nestedIndex.pages;
    return (
      <>
        <SEO
          title={documentSlug}
          keywords={`${documentSlug}, government services, local government`}
        />
        <Section className="p-3 mb-12 justify-center">
          {/* 💡 Centered breadcrumbs in nested directory view */}
          <div className="flex justify-center mb-8">
            <Breadcrumbs items={breadcrumbs} />
          </div>
          {nestedIndex.title && (
            <Heading level={3}>{nestedIndex.title}</Heading>
          )}
          {nestedIndex.description && (
            <Text className="text-gray-600 mb-4">
              {nestedIndex.description}
            </Text>
          )}
          {nestedIndex.layout === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nestedPages.map((page, i) => (
                <Card hoverable key={page.slug ?? i} className="h-full">
                  <CardContent>
                    <h4 className="text-lg font-medium text-gray-900">
                      {page.name}
                    </h4>
                    {page.description && (
                      <p className="mt-2 text-sm text-gray-600">
                        {page.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {nestedPages.map((page, i) => (
                <Card key={page.slug ?? i} className="mb-4">
                  <CardContent>
                    <h4 className="text-lg font-medium text-gray-900">
                      {page.name}
                    </h4>
                    {page.description && (
                      <p className="mt-2 text-sm text-gray-600">
                        {page.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Section>
      </>
    );
  }

  if (!markdownContent) {
    return null;
  }

  // Parse Markdown content to check if it has structured YAML metadata
  const doc = parseServiceDocument(
    markdownContent.title || documentSlug || '',
    markdownContent.description || '',
    markdownContent.content
  );

  // Find active requirements array
  const activeGroup =
    doc.requirementsGroups.find(g => g.key === activeReqKey) ||
    doc.requirementsGroups[0];
  const activeRequirements = activeGroup ? activeGroup.items : [];

  return (
    <>
      <SEO
        title={doc.title}
        description={doc.description}
        keywords={`${documentSlug}, government services, public services, local government`}
      />
      <Section className="p-3 mb-12">
        {/* 💡 Centered breadcrumbs in primary document layout */}
        <div className="flex justify-center mb-8">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        {/* 🏷️ Page Header area (Responsive Layout) */}
        <div className="mb-8 justify-between items-start gap-6 flex flex-col lg:flex-row border-b border-gray-100 pb-6">
          {/* LEFT COLUMN: Official Guide Tag, Title & Description */}
          <div className="flex-1 min-w-0 text-center lg:text-start">
            <span className="text-[12px] font-axis-navbar-focus text-primary-600 uppercase tracking-widest bg-primary-50 px-2.5 py-1 rounded">
              Citizen Charter Guide
            </span>
            <h1 className="text-4xl font-axis-titular-focus uppercase text-gray-900 mt-3 tracking-wide leading-snug">
              {doc.title}
            </h1>
            {doc.description && (
              <p className="text-lg text-gray-700/70 mt-1 max-w-3xl leading-snug tracking-wide font-axis-subtitular-focus mx-auto lg:mx-0">
                {doc.description}
              </p>
            )}
          </div>

          {/* RIGHT COLUMN: Quick Scan Info Hub */}
          {doc.isStructured && (
            <div className="flex flex-col items-center lg:items-end text-center lg:text-end gap-4 shrink-0 w-full lg:w-auto border-t lg:border-t-0 border-gray-100 pt-4 lg:pt-0">
              {/* Row 1: Fees & Expected Time side-by-side */}
              <div className="flex items-center justify-center lg:justify-end gap-8 w-full lg:w-auto">
                {/* Estimated Fees */}
                <div className="relative flex flex-col items-center lg:items-end text-center lg:text-end">
                  <span className="block uppercase text-[16px] font-axis-sng-indlab-header text-gray-500 tracking-widest">
                    Estimated Cost
                  </span>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-3xl font-axis-sng-indlab-value text-burgundy-950">
                      {doc.fees || 'Free / No Fees'}
                    </span>
                    {/* 💡 Replaced Tooltip with Popover & openOnHover to enable BOTH hovering on desktops and tapping/clicking on mobile screens */}
                    {doc.feeDetails && (
                      <Popover.Root>
                        <Popover.Trigger
                          openOnHover
                          className="inline-flex items-center justify-center p-1 rounded-full text-burgundy-900/60 hover:text-burgundy-950 hover:bg-burgundy-50/50 transition-colors focus:outline-none cursor-pointer"
                        >
                          {getIcon('lucide:help-circle', 'h-4 w-4')}
                        </Popover.Trigger>
                        <Popover.Portal>
                          <Popover.Positioner side="bottom" sideOffset={6}>
                            <Popover.Popup className="z-50 max-w-xs p-2.5 bg-white border border-gray-200 rounded-xl shadow-lg text-[10px] leading-relaxed text-gray-600 normal-case origin-[var(--transform-origin)] transition-all duration-200 ease-out data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1.5 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[ending-style]:translate-y-1.5">
                              <span className="block text-[9px] font-axis-bold text-gray-700 uppercase tracking-wider mb-1 select-none">
                                Calculation Basis
                              </span>
                              {doc.feeDetails}
                            </Popover.Popup>
                          </Popover.Positioner>
                        </Popover.Portal>
                      </Popover.Root>
                    )}
                  </div>
                </div>

                {/* Vertical Separator Line */}
                <div
                  className="w-px h-8 bg-gray-200/80 self-center"
                  aria-hidden="true"
                />

                {/* Expected Time */}
                <div className="flex flex-col items-center lg:items-end text-center lg:text-end">
                  <span className="text-[16px] font-axis-sng-indlab-header text-gray-500 uppercase tracking-widest">
                    Expected Time
                  </span>
                  <span className="text-3xl font-axis-sng-indlab-value text-burgundy-950 mt-1 proportional-nums">
                    {doc.time || 'Immediate / Walk-In'}
                  </span>
                </div>
              </div>

              {/* Row 2: Where to Apply */}
              {doc.office && (
                <div className="flex flex-col items-center lg:items-end w-full">
                  <span className="text-[16px] font-axis-sng-indlab-header text-gray-500 uppercase tracking-widest">
                    Where to Apply
                  </span>
                  <span className="text-xl lg:text-2xl font-axis-sng-indlab-value text-burgundy-950 mt-1 leading-snug">
                    {doc.office}
                  </span>
                  <span className="text-sm font-axis-navbar-focus text-gray-600 tracking-wide">
                    {doc.officeAddress}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {doc.isStructured ? (
          /* 💎 VISUAL DASHBOARD GRID */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (2/3 Width): Steps Timeline & Postscripts (Displays 2nd on mobile screens, 1st on desktops) */}
            <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
              {/* Stepper Timeline Box */}
              {doc.steps.length > 0 && (
                <Card className="border border-gray-200/80 shadow-xs rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex flex-row items-center justify-center gap-2 pb-6">
                      {getIcon(
                        'ri:walk-line',
                        'h-5 w-5 text-burgundy-900 shrink-0'
                      )}
                      <h3 className="text-md font-axis-navbar-focus uppercase tracking-wider text-burgundy-900/60">
                        Step-by-Step Procedure
                      </h3>
                    </div>

                    {/* Vertical Timeline Connection Line */}
                    <div className="relative border-l border-primary-200 ml-4 pl-6 space-y-8">
                      {(() => {
                        const counters: number[] = [];

                        return doc.steps.map((step, i) => {
                          const trimmed = step.trim();

                          // Count consecutive '>' prefixes to measure indentation level
                          const levelMatch = trimmed.match(/^>+/);
                          const level = levelMatch ? levelMatch[0].length : 0;

                          // Strip all leading '>' markers to isolate the clean step content
                          const cleanStep = trimmed.replace(/^>+/, '').trim();

                          // Accordion split logic inside active step text
                          const isAccordion = cleanStep.includes('|');
                          const [summaryText, ...detailParts] =
                            cleanStep.split('|');
                          const detailText = detailParts.join('|').trim();

                          // Maintain the hierarchical counter stack
                          if (counters.length <= level) {
                            while (counters.length <= level) {
                              counters.push(0);
                            }
                          } else {
                            counters.splice(level + 1); // Reset child nodes
                          }

                          counters[level]++; // Increment current level

                          // Generate badge label
                          const displayBadge = counters
                            .map((val, idx) => {
                              if (idx === 0) return `${val}`;
                              if (idx === 1)
                                return String.fromCharCode(65 + (val - 1)); // 'A', 'B', 'C'
                              return `${val}`;
                            })
                            .join('.');

                          // Vite-safe mobile indentation spacing
                          const getIndentClass = (lvl: number) => {
                            if (lvl === 1) return 'pl-6 sm:pl-8 mt-4 ml-0';
                            if (lvl === 2)
                              return 'pl-6 sm:pl-8 mt-4 ml-3 sm:ml-4';
                            if (lvl >= 3)
                              return 'pl-6 sm:pl-8 mt-4 ml-6 sm:ml-8';
                            return '';
                          };

                          const isSubStep = level > 0;

                          return (
                            <div
                              key={i}
                              className={`relative transition-all duration-300 ${getIndentClass(level)}`}
                            >
                              {/* FIXED BADGE: Solid timeline circles for main steps */}
                              {!isSubStep && (
                                <span className="absolute -left-[36.5px] top-[14px] flex h-6 w-6 items-center justify-center rounded-full bg-primary-700 border-white ring-1 ring-primary-50 text-white font-axis-chunky text-[10px] shadow-sm z-10">
                                  {displayBadge}
                                </span>
                              )}

                              {isAccordion ? (
                                /* NATIVE ACCORDION STEP (Keep Uppercase Medium formatting for interactive summaries) */
                                <details className="group text-sm font-axis-medium tracking-normal leading-relaxed text-gray-700 bg-gray-50/40 hover:bg-gray-50/60 p-3.5 rounded-lg border border-gray-100 transition-colors duration-200 cursor-pointer">
                                  <summary className="flex items-center justify-between gap-3 select-none list-none outline-none">
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      {isSubStep && (
                                        <span className="px-2 py-0.5 text-[9px] font-axis-chunky bg-primary-50 border border-primary-200 text-primary-800 rounded shrink-0">
                                          {displayBadge}
                                        </span>
                                      )}
                                      <span className="pr-4">
                                        {summaryText.trim()}
                                      </span>
                                    </div>
                                    {getIcon(
                                      'tabler:chevron-up',
                                      'h-4 w-4 text-primary-600 transition-transform duration-200 group-open:rotate-180'
                                    )}
                                  </summary>
                                  {/* Detail text parsing */}
                                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 text-gray-600 font-axis-thin tracking-normal leading-tight markdown-content">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={markdownComponents}
                                    >
                                      {detailText}
                                    </ReactMarkdown>
                                  </div>
                                </details>
                              ) : (
                                /* STANDARD STATIC STEP (Fallback typography to font-axis-book if no interactive accordions) */
                                <div className="text-gray-800 bg-gray-50/20 hover:bg-gray-50/60 p-3.5 rounded-lg border border-gray-100 transition-colors duration-200 flex items-center gap-2.5">
                                  {isSubStep && (
                                    <span className="px-2 py-0.5 text-[9px] font-axis-chunky bg-primary-50 border border-primary-200 text-primary-800 rounded shrink-0">
                                      {displayBadge}
                                    </span>
                                  )}
                                  <span className="text-sm font-axis-thin text-gray-800 flex-1">
                                    {cleanStep}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 💡 POSTSCRIPTS (Hidden automatically if undefined) */}
              {doc.postscripts && (
                <div className="bg-amber-50/40 border border-amber-200/50 rounded-xl p-6 mt-6 flex items-start gap-3.5 shadow-xs">
                  {getIcon(
                    'lucide:info',
                    'h-5 w-5 text-amber-700 shrink-0 mt-0.5'
                  )}
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-xs font-axis-navbar-focus uppercase tracking-widest text-amber-800 font-semibold">
                      Important Reminders / Notes
                    </h4>
                    <div className="text-sm font-axis-book text-gray-700/90 leading-relaxed whitespace-pre-line">
                      {doc.postscripts}
                    </div>
                  </div>
                </div>
              )}

              {/* Optional raw markdown text */}
              {doc.rawMarkdownContent && (
                <Card className="border border-gray-200/80 shadow-xs rounded-xl p-6 markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {doc.rawMarkdownContent}
                  </ReactMarkdown>
                </Card>
              )}
            </div>

            {/* Right Column (1/3 Width): Quick Info Hub (Displays 1st on mobile screens, 2nd on desktops) */}
            <div className="order-1 lg:order-2 space-y-6">
              {/* Who can avail Card */}
              {doc.whocanavail.length > 0 && (
                <Card className="border-t-4 border-t-burgundy-900 border border-gray-200 shadow-sm bg-cream-50/40 rounded-xl">
                  <CardContent className="p-6 space-y-6">
                    <h3 className="justify-center text-md font-axis-navbar-focus uppercase tracking-wider text-burgundy-900/60 border-b border-burgundy-900/10 pb-2 flex items-center gap-2">
                      {getIcon(
                        'lucide:user-check',
                        'h-5 w-5 text-burgundy-900/60 shrink-0'
                      )}
                      <span>Who can avail</span>
                    </h3>
                    <ul className="grid grid-cols-1 gap-3">
                      {doc.whocanavail.map((req, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-sm text-gray-700 bg-gray-50/50 border border-gray-100 p-3 rounded-lg font-axis-thin"
                        >
                          {getIcon(
                            'lucide:check-circle-2',
                            'text-emerald-500 h-5 w-5 shrink-0'
                          )}
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Required Documents Card (With Dynamic Toggles) */}
              <Card className="border-t-4 border-t-burgundy-900 border border-gray-200 shadow-sm bg-cream-50/40 rounded-xl">
                <CardContent className="p-6 space-y-5">
                  <h3 className="justify-center text-md font-axis-navbar-focus uppercase tracking-wider text-burgundy-900/60 border-b border-burgundy-900/10 pb-2 flex items-center gap-2">
                    {getIcon(
                      'ri:clipboard-line',
                      'h-5 w-5 text-burgundy-900/60 shrink-0'
                    )}
                    <span>Required Documents</span>
                  </h3>

                  {/* 💡 DYNAMIC BASE UI RADIO TOGGLE CONTROLS FOR CUSTOM GROUPS */}
                  {doc.requirementsGroups.length > 1 && (
                    <RadioGroup
                      value={activeReqKey}
                      onValueChange={setActiveReqKey}
                      className="w-full grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 items-center"
                    >
                      {doc.requirementsGroups.map(group => (
                        <label
                          key={group.key}
                          className="flex items-center gap-2 cursor-pointer text-xs font-axis-navbar-focus uppercase tracking-wider text-gray-700 select-none transition-colors py-1"
                        >
                          <Radio.Root
                            value={group.key}
                            className="flex size-4 shrink-0 items-center justify-center border rounded-full p-0 border-primary-600 bg-white text-white data-checked:bg-primary-700 data-checked:border-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 cursor-pointer"
                          >
                            <Radio.Indicator className="flex items-center justify-center data-unchecked:hidden before:size-1.5 before:rounded-full before:bg-current" />
                          </Radio.Root>
                          <span className="font-medium">{group.label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  )}

                  {/* Active List Rendering */}
                  {activeRequirements.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-3">
                      {activeRequirements.map((req, i) => (
                        <li
                          key={i}
                          className="flex gap-2.5 text-sm text-gray-700 bg-gray-50/50 border border-gray-100 p-3 rounded-lg transition-all duration-200"
                        >
                          {getIcon(
                            'lucide:check-circle-2',
                            'text-emerald-500 h-5 w-5 shrink-0'
                          )}
                          <span className="font-axis-thin">{req}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-center text-gray-400 font-axis-thin py-2">
                      No documents specified for this category.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* 📄 STANDARD FALLBACK */
          <Card className="mb-8 markdown-content border border-gray-200 shadow-xs rounded-xl">
            <CardHeader className="p-6">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {doc.rawMarkdownContent}
              </ReactMarkdown>
            </CardHeader>
          </Card>
        )}
      </Section>
    </>
  );
}
