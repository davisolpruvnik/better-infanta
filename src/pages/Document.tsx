// src/pages/Document.tsx
import Section from '../components/ui/Section';
import Breadcrumbsless from '@/components/ui/BreadcrumbsLess';
import { Heading } from '../components/ui/Heading';
import { Text } from '../components/ui/Text';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Radio, RadioGroup, Separator } from '@base-ui/react';

import SEO from '../components/SEO';
import {
  loadMarkdownContent,
  type MarkdownContent,
} from '../lib/markdownLoader';
import { createMarkdownComponents } from '../components/ui/markdownComponents';
import { getTypographyTheme } from '../lib/typographyThemes';

// 💡 Clean imports: Only fetch what we need from Loader and custom Icon component
import {
  serviceCategories,
  governmentCategories,
  getCategorySubcategories,
  isNestedCategory,
  type Subcategory,
  type CategoryIndex,
} from '../data/yamlLoader';

import LazyIcon from '@/components/ui/Lazying';
import { DocumentHeader } from '@/components/sections/DocumentHeader';
import {
  formatSlugToTitle,
  parseServiceDocument,
  processSteps,
} from '@/lib/serviceDocParsing';
import { AnimatePresence, motion } from 'motion/react';

interface DocumentProps {
  theme?: string;
  categoryType?: 'service' | 'government';
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
  const [activeReqKey, setActiveReqKey] = useState<string>('');
  const [activeFeeKey, setActiveFeeKey] = useState<string>('');
  const [openStepId, setOpenStepId] = useState<string | null>(null);

  const markdownComponents = useMemo(
    () => createMarkdownComponents(getTypographyTheme(initialTheme)),
    [initialTheme]
  );

  const [breadcrumbs, setBreadcrumbs] = useState([
    { label: 'Home', href: '/' },
  ]);

  // Lightweight wrapper function matching DocumentHeader's rendering contract
  const renderHeaderIcon = (name?: string, className?: string) => (
    <LazyIcon name={name} className={className} />
  );

  // 💡 Memoized Frontmatter Parsing from serviceDocParsing lib
  const doc = useMemo(() => {
    if (!markdownContent) return null;
    return parseServiceDocument(
      markdownContent.title || documentSlug || '',
      markdownContent.description || '',
      markdownContent.content
    );
  }, [markdownContent, documentSlug]);

  // 💡 Memoized Timeline Steps Processing from serviceDocParsing lib
  const processedSteps = useMemo(() => {
    if (!doc?.steps) return [];
    return processSteps(doc.steps);
  }, [doc?.steps]);

  // 💡 HELPER: Calculates horizontal connector line back to timeline
  const getConnectorClass = (indentClass: string) => {
    if (indentClass.includes('ml-4')) {
      return 'absolute top-[14px] -left-[40px] w-[48px] h-px bg-fantas-200 pointer-events-none';
    }
    if (indentClass.includes('ml-2')) {
      return 'absolute top-[14px] -left-[32px] w-[40px] h-px bg-fantas-200 pointer-events-none';
    }
    return 'absolute top-[14px] -left-6 w-8 h-px bg-fantas-200 pointer-events-none';
  };

  // Handle active dynamic requirement tab defaults
  useEffect(() => {
    if (doc?.requirementsGroups && doc.requirementsGroups.length > 0) {
      setActiveReqKey(doc.requirementsGroups[0].key);
    }
  }, [doc]);

  // Handle active dynamic regulatory fee tab defaults
  useEffect(() => {
    if (doc?.regulatory_fees && doc.regulatory_fees.length > 0) {
      const defaultCategory = doc.regulatory_fees[0].category || '0';
      setActiveFeeKey(defaultCategory);
    }
  }, [doc]);

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
              href: undefined,
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
            href: undefined,
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

  if (loading) {
    return (
      <Section className="p-3 mb-12">
        <div>
          <LazyIcon
            name="fluent-emoji-high-contrast:construction"
            className="w-8 h-8 text-black"
          />
        </div>
        <span>Loading...</span>
      </Section>
    );
  }

  if (error) {
    return (
      <Section className="p-3 mb-12 justify-center">
        <div className="flex justify-center mb-8">
          <Breadcrumbsless items={breadcrumbs} />
        </div>
        <div className="flex flex-col justify-center items-center gap-2">
          <LazyIcon
            name="fluent-emoji-high-contrast:construction"
            className="w-8 h-8 text-fantas-800"
          />
          <span className="text-fantas-800 font-axis-bold">
            Process not available yet.
          </span>
        </div>
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
          <div className="flex justify-center mb-8">
            <Breadcrumbsless items={breadcrumbs} />
          </div>
          {nestedIndex.title && (
            <Heading level={3}>{nestedIndex.title}</Heading>
          )}
          {nestedIndex.description && (
            <Text className="text-gray-600 mb-4">
              {nestedIndex.description}
            </Text>
          )}
          <div
            className={
              nestedIndex.layout === 'grid'
                ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                : 'space-y-4'
            }
          >
            {nestedPages.map((page, i) => (
              <div
                key={page.slug ?? i}
                className="h-full py-4 border-b border-gray-200 last:border-0"
              >
                <h4 className="text-lg font-medium text-gray-900">
                  {page.name}
                </h4>
                {page.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {page.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      </>
    );
  }

  if (!doc) return null;

  const activeGroup =
    doc.requirementsGroups.find(g => g.key === activeReqKey) ||
    doc.requirementsGroups[0];
  const activeRequirements = activeGroup ? activeGroup.items : [];

  // Active Regulatory Fee Category resolution
  const activeFeeCategory =
    doc.regulatory_fees?.find(
      (g, idx) => (g.category || String(idx)) === activeFeeKey
    ) || doc.regulatory_fees?.[0];
  const activeFeeItems = activeFeeCategory ? activeFeeCategory.items : [];

  return (
    <>
      <SEO
        title={doc.title}
        description={doc.description}
        keywords={`${documentSlug}, government services, public services, local government`}
      />
      <Section className="p-3 mb-12">
        <div className="flex justify-center mb-8">
          <Breadcrumbsless items={breadcrumbs} className="text-xs" />
        </div>

        <DocumentHeader doc={doc} renderIcon={renderHeaderIcon} />

        {doc.isStructured ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
            {/* Steps & Content (Left 2/3 Column) */}
            <div className="order-2 lg:order-1 lg:col-span-2 space-y-10">
              {processedSteps.length > 0 && (
                <div className="space-y-6">
                  {/* Clean, Non-Boxed Step Header */}
                  <div className="flex flex-row items-center gap-2 pb-4 border-b border-gray-200">
                    <LazyIcon
                      name="ri:walk-line"
                      className="h-5 w-5 text-fantas-950 shrink-0"
                    />
                    <h3 className="text-lg font-axis-navbar-focus uppercase tracking-wider text-fantas-950">
                      Step-by-Step Procedure
                    </h3>
                  </div>

                  {/* Stepper Timeline */}
                  <div className="relative border-l border-fantas-200 ml-4 pl-6 space-y-8">
                    {processedSteps.map(step => {
                      const isStepOpen = openStepId === step.id;

                      return (
                        <div
                          key={step.id}
                          className={`relative transition-all duration-300 ${step.indentClass}`}
                        >
                          {!step.isSubStep && (
                            <span className="flex absolute -left-[36.5px] top-0.5 h-6 w-6 items-center justify-center rounded-full bg-fantas-800 border-white ring-1 ring-fantas-50 text-white font-axis-chunky text-[10px] text-center shadow-sm z-10">
                              {step.badge}
                            </span>
                          )}

                          {step.isSubStep && (
                            <span
                              className={getConnectorClass(step.indentClass)}
                              aria-hidden="true"
                            />
                          )}

                          {step.isAccordion ? (
                            <div className="text-sm font-axis-book tracking-normal text-wrap leading-relaxed text-gray-700 py-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenStepId(prev =>
                                    prev === step.id ? null : step.id
                                  )
                                }
                                aria-expanded={isStepOpen}
                                className="w-full text-left flex items-start justify-start gap-3 select-none outline-none cursor-pointer group"
                              >
                                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-2.5 flex-1 min-w-0 text-wrap break-words">
                                  {step.isSubStep && (
                                    <span className="px-2 py-0.5 text-[10px] font-axis-chunky bg-fantas-50 border border-fantas-200 text-fantas-800 rounded shrink-0">
                                      {step.badge}
                                    </span>
                                  )}

                                  <span className="pr-4 text-xs sm:text-sm flex-1 min-w-0 max-w-2xl font-axis-book break-words leading-normal text-fantas-950">
                                    <span>{step.summaryText.trim()}</span>{' '}
                                    <span
                                      className={`inline-flex items-center justify-center size-5.5 rounded-full bg-fantas-50 group-hover:bg-fantas-100 text-fantas-600 border border-fantas-200/50 shadow-2xs transition-transform duration-200 shrink-0 select-none align-middle ml-1.5 ${
                                        isStepOpen ? 'rotate-180' : 'rotate-0'
                                      }`}
                                      aria-hidden="true"
                                    >
                                      <LazyIcon
                                        name="mynaui:chevron-down-solid"
                                        className="h-3.5 w-3.5"
                                      />
                                    </span>
                                  </span>
                                </div>
                              </button>

                              <AnimatePresence initial={false}>
                                {isStepOpen && (
                                  <motion.div
                                    key={`accordion-${step.id}`}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{
                                      height: 'auto',
                                      opacity: 1,
                                      transition: {
                                        height: {
                                          duration: 0.25,
                                          ease: [0.04, 0.62, 0.23, 0.98],
                                        },
                                        opacity: { duration: 0.2, delay: 0.05 },
                                      },
                                    }}
                                    exit={{
                                      height: 0,
                                      opacity: 0,
                                      transition: {
                                        height: {
                                          duration: 0.2,
                                          ease: [0.04, 0.62, 0.23, 0.98],
                                        },
                                        opacity: { duration: 0.15 },
                                      },
                                    }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-2.5 pt-2.5 border-t border-gray-300 border-dotted text-fantas-800 font-axis-thin xs:text-xs sm:text-sm tracking-normal leading-snug markdown-content text-wrap break-words">
                                      <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={markdownComponents}
                                      >
                                        {step.detailText}
                                      </ReactMarkdown>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ) : (
                            <div className="text-gray-800 py-1 flex flex-col sm:flex-row items-start gap-2 sm:gap-2.5 text-wrap break-words">
                              {step.isSubStep && (
                                <span className="px-2 py-0.5 text-[10px] font-axis-chunky bg-fantas-50 border border-fantas-200 text-fantas-800 rounded shrink-0">
                                  {step.badge}
                                </span>
                              )}
                              <span className="text-xs sm:text-sm font-axis-book text-fantas-950 flex-1 min-w-0 max-w-2xl xs:text-pretty break-words leading-snug">
                                {step.cleanStep}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Supplementary Markdown content rendered flat */}
              {doc.rawMarkdownContent && (
                <div className="pt-6 markdown-content text-wrap break-words overflow-hidden">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {doc.rawMarkdownContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Editorial Quick Info Sidebar (Right 1/3 Column) */}
            <div className="order-1 lg:order-2 space-y-10">
              {/* Who to avail Section */}
              {doc.whocanavail.length > 0 && (
                <div className="flex flex-row items-stretch gap-4 border-b border-gray-200 pb-6">
                  <div className="w-[115px] shrink-0 flex items-start gap-1.5 pt-0.5">
                    <LazyIcon
                      name="lucide:user-check"
                      className="h-4 w-4 text-fantas-950 shrink-0"
                    />
                    <span className="text-[14px] font-axis-navbar-focus uppercase tracking-wider text-fantas-950 leading-tight">
                      Who to avail
                    </span>
                  </div>

                  <div
                    className="w-px bg-gray-200 self-stretch shrink-0"
                    aria-hidden="true"
                  />

                  <div className="flex-grow min-w-0">
                    <ul className="space-y-3">
                      {doc.whocanavail.map((req, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 font-axis-thin text-wrap break-words"
                        >
                          <LazyIcon
                            name="lucide:check-circle-2"
                            className="text-kapwa-green-600 h-4 w-4 shrink-0 mt-0.5"
                          />
                          <span className="leading-normal">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Required Documents Section */}
              <div className="flex flex-row items-stretch gap-4 border-b border-gray-200 pb-6">
                <div className="w-[115px] shrink-0 flex flex-col items-start gap-4">
                  <div className="flex items-start gap-1.5 pt-0.5">
                    <LazyIcon
                      name="ri:clipboard-line"
                      className="h-4 w-4 text-fantas-950 shrink-0"
                    />
                    <span className="text-[14px] font-axis-navbar-focus uppercase tracking-wider text-fantas-950 leading-tight">
                      Required Documents
                    </span>
                  </div>

                  {doc.requirementsGroups.length > 1 && (
                    <RadioGroup
                      value={activeReqKey}
                      onValueChange={setActiveReqKey}
                      className="w-full flex flex-col items-start gap-2.5 pt-2.5 border-t border-gray-200/50"
                    >
                      {doc.requirementsGroups.map(group => (
                        <label
                          key={group.key}
                          className="flex items-start gap-2 cursor-pointer text-[10px] sm:text-xs font-axis-navbar-focus uppercase tracking-wider text-gray-700/80 hover:text-gray-900 select-none"
                        >
                          <Radio.Root
                            value={group.key}
                            className="flex size-3.5 shrink-0 items-center justify-center border rounded-full p-0 border-fantas-600 bg-white text-white data-checked:bg-fantas-700 data-checked:border-fantas-700 focus-visible:outline-2 cursor-pointer"
                          >
                            <Radio.Indicator className="flex items-center justify-center data-unchecked:hidden before:size-1 before:rounded-full before:bg-current" />
                          </Radio.Root>
                          <span className="font-axis-navbar-focus tracking-wider text-[12px] leading-snug">
                            {group.label}
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                </div>

                <div
                  className="w-px bg-gray-200 self-stretch shrink-0"
                  aria-hidden="true"
                />

                <div className="flex-grow min-w-0 space-y-4">
                  {activeRequirements.length > 0 ? (
                    <ul className="space-y-3">
                      {activeRequirements.map((req, i) => (
                        <li
                          key={i}
                          className="flex gap-2.5 text-xs sm:text-sm text-gray-700 text-wrap break-words"
                        >
                          <LazyIcon
                            name="lucide:check-circle-2"
                            className="text-kapwa-green-600 h-4 w-4 shrink-0 mt-0.5"
                          />
                          <span className="font-axis-thin leading-normal">
                            {req}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-center text-gray-400 font-axis-thin py-2">
                      No documents specified for this category.
                    </p>
                  )}
                </div>
              </div>

              {/* 💡 INLINE REGULATORY FEES: Directly below Required Documents, matching layout & RadioGroup */}
              {doc.regulatory_fees &&
                doc.regulatory_fees.length > 0 &&
                doc.feeBreakdownMode !== 'separate' && (
                  <div className="flex flex-row items-stretch gap-4 border-b border-gray-200 pb-6">
                    {/* Left Column: Vertical Label Segment + Radio Toggles */}
                    <div className="w-[115px] shrink-0 flex flex-col items-start gap-4">
                      <div className="flex items-start gap-1.5 pt-0.5">
                        <LazyIcon
                          name="lucide:receipt"
                          className="h-4 w-4 text-fantas-950 shrink-0"
                        />
                        <span className="text-[14px] font-axis-navbar-focus uppercase tracking-wider text-fantas-950 leading-tight">
                          Regulatory Fees
                        </span>
                      </div>

                      {/* Base UI RadioGroup Category Chooser (only if > 1 category) */}
                      {doc.regulatory_fees.length > 1 && (
                        <RadioGroup
                          value={activeFeeKey}
                          onValueChange={setActiveFeeKey}
                          className="w-full flex flex-col items-start gap-2.5 pt-2.5 border-t border-gray-200/50"
                        >
                          {doc.regulatory_fees.map((group, idx) => {
                            const groupKey = group.category || String(idx);
                            return (
                              <label
                                key={groupKey}
                                className="flex items-start gap-2 cursor-pointer text-[10px] sm:text-xs font-axis-navbar-focus uppercase tracking-wider text-gray-700/80 hover:text-gray-900 select-none"
                              >
                                <Radio.Root
                                  value={groupKey}
                                  className="flex size-3.5 shrink-0 items-center justify-center border rounded-full p-0 border-fantas-600 bg-white text-white data-checked:bg-fantas-700 data-checked:border-fantas-700 focus-visible:outline-2 cursor-pointer"
                                >
                                  <Radio.Indicator className="flex items-center justify-center data-unchecked:hidden before:size-1 before:rounded-full before:bg-current" />
                                </Radio.Root>
                                <span className="font-axis-navbar-focus tracking-wider text-[12px] leading-snug">
                                  {group.category || `Category ${idx + 1}`}
                                </span>
                              </label>
                            );
                          })}
                        </RadioGroup>
                      )}
                    </div>

                    {/* Dynamic Vertical Divider Line */}
                    <div
                      className="w-px bg-gray-200 self-stretch shrink-0"
                      aria-hidden="true"
                    />

                    {/* Right Column: Active Fee Checklist */}
                    <div className="flex-grow min-w-0 space-y-3">
                      {activeFeeItems.length > 0 ? (
                        <ul className="space-y-3">
                          {activeFeeItems.map((item, iIdx) => (
                            <li
                              key={iIdx}
                              className="flex items-start justify-between gap-4 text-xs sm:text-sm font-axis-thin text-gray-700 wrap-break-word"
                            >
                              <div className="flex items-start gap-2 min-w-0 flex-1">
                                  <LazyIcon
                                    name="lucide:check-circle-2"
                                    className="text-kapwa-green-600 h-4 w-4 shrink-0 mt-0.5"
                                  />
                                  <span className="leading-snug wrap-break-word text-pretty">
                                    {item.name}
                                  </span>
                                </div>

                                {/* Right: Balanced, Wrapped Price Badge */}
                                <span className="font-axis-number-focus text-fantas-950 text-right text-balance wrap-break-word max-w-[35%] leading-snug bg-fantas-100 px-2 py-0.5 text-xs border border-fantas-100 self-start">
                                  {item.price}
                                </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-center text-gray-400 font-axis-thin py-2">
                          No fees specified for this category.
                        </p>
                      )}
                    </div>
                  </div>
                )}

              {/* 💡 SEPARATE SUBPAGE CARD: Only shown when feeBreakdownMode === 'separate' */}
              {doc.regulatory_fees &&
                doc.regulatory_fees.length > 0 &&
                doc.feeBreakdownMode === 'separate' && (
                  <div className="bg-fantas-50/60 border border-fantas-200 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-white border border-fantas-200 text-fantas-800 shadow-2xs shrink-0">
                        <LazyIcon
                          name="fluent-emoji-high-contrast:ledger"
                          className="h-5 w-5"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-axis-navbar-focus uppercase tracking-wider text-fantas-950 truncate">
                          Regulatory Fees Breakdown
                        </h4>
                        <p className="text-xs text-fantas-900/70 font-axis-thin truncate">
                          View list of fees per office
                        </p>
                      </div>
                    </div>

                    <Link
                      to="fees"
                      className="px-3 py-1.5 bg-fantas-800 hover:bg-fantas-900 text-white  text-xs font-axis-navbar-focus uppercase tracking-wider transition-colors shrink-0 shadow-2xs"
                    >
                      View Fees
                    </Link>
                  </div>
                )}

              {/* Minimalist, Clean Postscripts Indicator */}
              {doc.postscripts && (
                <div className="border-l-2 border-fantas-500 pl-4 py-1 mt-8 flex flex-col items-start gap-3">
                  <div className="flex flex-row gap-2 items-center">
                    <LazyIcon
                      name="lucide:info"
                      className="h-5 w-5 text-fantas-700 shrink-0"
                    />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <h3 className="text-lg font-axis-navbar-focus uppercase tracking-wider text-fantas-800 font-semibold leading-none">
                        Important Reminders / Notes
                      </h3>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm font-axis-book text-gray-700/80 leading-normal whitespace-pre-line text-wrap break-words">
                    {doc.postscripts}
                  </div>
                </div>
              )}

              <div className="border-l-2 border-fantas-500 pl-4 py-1 mt-8 flex flex-col items-start gap-3">
                <div className="flex flex-row gap-2 items-center">
                  <LazyIcon
                    name="mingcute:contacts-fill"
                    className="text-fantas-700 w-5 h-5"
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-lg font-axis-navbar-focus uppercase tracking-wider text-fantas-800 font-semibold leading-none">
                      Contact for Suggestions/Feedback
                    </h3>
                  </div>
                </div>
                <div className="text-xs sm:text-sm font-axis-book text-gray-700/80 leading-normal whitespace-pre-line text-wrap break-words">
                  <span>
                    For any suggestions or modifications in procedures or
                    services of the local government, do not hesitate to contact
                    through email:{' '}
                    <span className="font-axis-bold text-fantas-800">
                      betterinfantaquezon.org@atomicmail.io
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 📄 STANDARD FALLBACK */
          <div className="pt-6 markdown-content text-wrap break-words overflow-hidden">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {doc.rawMarkdownContent}
            </ReactMarkdown>
          </div>
        )}

        <div className="mt-8 flex flex-row flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-fantas-950/80 font-axis-subtitular-focus uppercase tracking-wide">
          <span>Source</span>
          <Separator orientation="vertical" className="h-4 w-px bg-fantas-800" />
          <a
            href="https://infanta.gov.ph/citizens-charter"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-row gap-1 font-axis-navbar-focus hover:text-fantas-700/80 underline-offset-4 hover:underline transition-colors items-center"
          >
            Citizen's Charter (March 2026 Issue)
            <LazyIcon
              name="tabler:file-download"
              className="h-4 w-4 text-fantas-950 shrink-0"
            />
          </a>
        </div>
      </Section>
    </>
  );
}
