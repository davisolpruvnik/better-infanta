// src/pages/Document.tsx
import Section from '../components/ui/Section';
import Breadcrumbsless from '@/components/ui/BreadcrumbsLess';
import { Heading } from '../components/ui/Heading';
import { Text } from '../components/ui/Text';
import { Banner } from '@bettergov/kapwa/banner';
import { useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Radio, RadioGroup } from '@base-ui/react';

import SEO from '../components/SEO';
import {
  loadMarkdownContent,
  type MarkdownContent,
} from '../lib/markdownLoader';
import { createMarkdownComponents } from '../lib/markdownComponents';
import { getTypographyTheme } from '../lib/typographyThemes';

// 💡 1. Clean imports: Only fetch what we need from Loader and custom Icon component
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

  // Handle active dynamic requirement tab defaults
  useEffect(() => {
    if (doc?.requirementsGroups && doc.requirementsGroups.length > 0) {
      setActiveReqKey(doc.requirementsGroups[0].key);
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
        <Banner type="info" description="Loading document..." />
      </Section>
    );
  }

  if (error) {
    return (
      <Section className="p-3 mb-12 justify-center">
        <div className="flex justify-center mb-8">
          <Breadcrumbsless items={breadcrumbs} />
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
                      className="h-5 w-5 text-burgundy-900 shrink-0"
                    />
                    <h3 className="text-lg font-axis-navbar-focus uppercase tracking-wider text-burgundy-900/60">
                      Step-by-Step Procedure
                    </h3>
                  </div>

                  {/* Clean Stepper Timeline resting directly on the background */}
                  <div className="relative border-l border-primary-200 ml-4 pl-6 space-y-8">
                    {processedSteps.map(step => (
                      <div
                        key={step.id}
                        className={`relative transition-all duration-300 ${step.indentClass}`}
                      >
                        {/* FIXED BADGE ALIGNMENT: top-0.5 to align pixel-perfectly with the first line of text */}
                        {!step.isSubStep && (
                          <span className="flex absolute -left-[36.5px] top-0.5 h-6 w-6 items-center justify-center rounded-full bg-primary-700 border-white ring-1 ring-primary-50 text-white font-axis-chunky text-[10px] text-center shadow-sm z-10">
                            {step.badge}
                          </span>
                        )}

                        {step.isAccordion ? (
                          /* 💡 Clean, Border-free details disclosure */
                          <details className="group text-sm font-axis-book tracking-normal text-wrap leading-relaxed text-gray-700 py-1 cursor-pointer">
                            <summary className="flex items-center justify-start gap-3 select-none list-none outline-none">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2.5 flex-1 min-w-0 text-wrap break-words">
                                {step.isSubStep && (
                                  <span className="px-2 py-0.5 text-[10px] font-axis-chunky bg-primary-50 border border-primary-200 text-primary-800 rounded shrink-0">
                                    {step.badge}
                                  </span>
                                )}

                                {/* 💡 INLINE WRAPPER: Placed text and button inline so they flow, wrap, and stay adjacent */}
                                <span className="pr-4 text-xs sm:text-sm flex-1 min-w-0 text-pretty font-axis-book break-words leading-normal text-gray-900 inline-flex items-center gap-2 flex-wrap">
                                  <span>{step.summaryText.trim()}</span>

                                  {/* 💡 TAPPABLE CHIP: Circular micro-button indicating tap-to-expand */}
                                  <span
                                    className="inline-flex items-center justify-center size-5.5 rounded-full bg-primary-50 group-hover:bg-primary-100 text-primary-600 border border-primary-200/50 shadow-2xs transition-all duration-200 group-open:rotate-180 shrink-0 select-none"
                                    aria-hidden="true"
                                  >
                                    <LazyIcon
                                      name="mynaui:chevron-down-solid"
                                      className="h-3.5 w-3.5"
                                    />
                                  </span>
                                </span>
                              </div>
                            </summary>

                            {/* Detail text parsing */}
                            <div className="mt-2.5 pt-2.5 border-t border-gray-100 text-gray-600 font-axis-thin xs:text-xs sm:text-sm tracking-normal leading-snug markdown-content text-wrap break-words overflow-hidden">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                              >
                                {step.detailText}
                              </ReactMarkdown>
                            </div>
                          </details>
                        ) : (
                          /* Clean, Flat, Border-free static step layout */
                          <div className="text-gray-800 py-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2.5 text-wrap break-words">
                            {step.isSubStep && (
                              <span className="px-2 py-0.5 text-[9px] font-axis-chunky bg-primary-50 border border-primary-200 text-primary-800 rounded shrink-0">
                                {step.badge}
                              </span>
                            )}
                            <span className="text-xs sm:text-sm font-axis-book text-gray-800 flex-1 min-w-0 max-w-auto xs:text-pretty break-words leading-snug">
                              {step.cleanStep}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
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
                  {/* Left Column: Vertical Label Segment */}
                  <div className="w-[115px] shrink-0 flex items-center gap-1.5 pt-0.5">
                    <LazyIcon
                      name="lucide:user-check"
                      className="h-4 w-4 text-burgundy-900/60 shrink-0"
                    />
                    <span className="text-[12px] sm:text-xs font-axis-navbar-focus uppercase tracking-wider text-burgundy-900/60 leading-tight">
                      Who to avail
                    </span>
                  </div>

                  {/* Dynamic Vertical Divider Line */}
                  <div
                    className="w-px bg-gray-200 self-stretch shrink-0"
                    aria-hidden="true"
                  />

                  {/* Right Column: Dynamic Bullet List */}
                  <div className="flex-grow min-w-0">
                    <ul className="space-y-3">
                      {doc.whocanavail.map((req, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-600 font-axis-thin text-wrap break-words"
                        >
                          <LazyIcon
                            name="lucide:check-circle-2"
                            className="text-emerald-600 h-4 w-4 shrink-0"
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
                {/* Left Column: Vertical Label Segment + Radio Toggles (Option Chooser) */}
                <div className="w-[115px] shrink-0 flex flex-col items-start gap-4">
                  {/* Header Title */}
                  <div className="flex items-start gap-1.5 pt-0.5">
                    <LazyIcon
                      name="ri:clipboard-line"
                      className="h-4 w-4 text-burgundy-900/60 shrink-0"
                    />
                    <span className="text-[12px] sm:text-xs font-axis-navbar-focus uppercase tracking-wider text-burgundy-900/60 leading-tight">
                      Required Documents
                    </span>
                  </div>

                  {/* Base UI RadioGroup Option Chooser */}
                  {doc.requirementsGroups.length > 1 && (
                    <RadioGroup
                      value={activeReqKey}
                      onValueChange={setActiveReqKey}
                      className="w-full flex flex-col items-start gap-2.5 pt-2.5 border-t border-gray-200/50"
                    >
                      {doc.requirementsGroups.map(group => (
                        <label
                          key={group.key}
                          className="flex items-center gap-2 cursor-pointer text-[10px] sm:text-xs font-axis-navbar-focus uppercase tracking-wider text-gray-700/80 hover:text-gray-900 select-none"
                        >
                          <Radio.Root
                            value={group.key}
                            className="flex size-3.5 shrink-0 items-center justify-center border rounded-full p-0 border-primary-600 bg-white text-white data-checked:bg-primary-700 data-checked:border-primary-700 focus-visible:outline-2 cursor-pointer"
                          >
                            <Radio.Indicator className="flex items-center justify-center data-unchecked:hidden before:size-1 before:rounded-full before:bg-current" />
                          </Radio.Root>
                          <span className="font-axis-navbar-focus tracking-wider text-[11px] leading-snug">
                            {group.label}
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                </div>

                {/* Dynamic Vertical Divider Line */}
                <div
                  className="w-px bg-gray-200 self-stretch shrink-0"
                  aria-hidden="true"
                />

                {/* Right Column: Active Checklist */}
                <div className="flex-grow min-w-0 space-y-4">
                  {activeRequirements.length > 0 ? (
                    <ul className="space-y-3">
                      {activeRequirements.map((req, i) => (
                        <li
                          key={i}
                          className="flex gap-2.5 text-xs sm:text-sm text-gray-600 text-wrap break-words"
                        >
                          <LazyIcon
                            name="lucide:check-circle-2"
                            className="text-emerald-600 h-4 w-4 shrink-0 mt-0.5"
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

              {/* Minimalist, Clean Postscripts Indicator */}
              {doc.postscripts && (
                <div className="border-l-2 border-amber-500 pl-4 py-1 mt-8 flex items-start gap-3">
                  <LazyIcon
                    name="lucide:info"
                    className="h-5 w-5 text-amber-700 shrink-0 mt-0.5"
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-xs font-axis-navbar-focus uppercase tracking-widest text-amber-800 font-semibold leading-none">
                      Important Reminders / Notes
                    </h3>
                    <div className="text-xs sm:text-sm font-axis-book text-gray-600 leading-normal whitespace-pre-line text-wrap break-words">
                      {doc.postscripts}
                    </div>
                  </div>
                </div>
              )}
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
      </Section>
    </>
  );
}
