// src/pages/Document.tsx
import Section from '../components/ui/Section';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Heading } from '../components/ui/Heading';
import { Text } from '../components/ui/Text';
import { Banner } from '@bettergov/kapwa/banner';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
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

interface DocumentProps {
  theme?: string;
  categoryType?: 'service' | 'government';
}

// Structured data map interface for custom layout parsing
interface ParsedServiceDoc {
  isStructured: boolean;
  title: string;
  description: string;
  fees?: string;
  time?: string;
  office?: string;
  requirements: string[];
  steps: string[];
  rawMarkdownContent: string;
}

// Built-in, zero-dependency parser to convert Markdown frontmatter into rich TSX layouts
function parseServiceDocument(
  titleFromLoader: string,
  descriptionFromLoader: string,
  rawMarkdown: string
): ParsedServiceDoc {
  if (!rawMarkdown.trim().startsWith('---')) {
    return {
      isStructured: false,
      title: titleFromLoader,
      description: descriptionFromLoader,
      requirements: [],
      steps: [],
      rawMarkdownContent: rawMarkdown,
    };
  }

  try {
    const parts = rawMarkdown.split('---');
    if (parts.length < 3) {
      return {
        isStructured: false,
        title: titleFromLoader,
        description: descriptionFromLoader,
        requirements: [],
        steps: [],
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

    // Bracket-notation is used here for secure index-signature reading
    const isStructured = !!(
      data['fees'] ||
      data['time'] ||
      data['office'] ||
      data['requirements'] ||
      data['steps']
    );

    return {
      isStructured,
      title: (data['title'] as string) || titleFromLoader,
      description: (data['description'] as string) || descriptionFromLoader,
      fees: data['fees'] as string,
      time: (data['time'] || data['processingTime']) as string,
      office: data['office'] as string,
      requirements: Array.isArray(data['requirements'])
        ? (data['requirements'] as string[])
        : [],
      steps: Array.isArray(data['steps']) ? (data['steps'] as string[]) : [],
      rawMarkdownContent: remainingMarkdown,
    };
  } catch (err) {
    console.error(
      'Failed parsing structured frontmatter, falling back to raw Markdown',
      err
    );
    return {
      isStructured: false,
      title: titleFromLoader,
      description: descriptionFromLoader,
      requirements: [],
      steps: [],
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

  const markdownComponents = createMarkdownComponents(
    getTypographyTheme(initialTheme)
  );

  const [breadcrumbs, setBreadcrumbs] = useState([
    { label: 'Home', href: '/' },
  ]);

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
              label: documentSlug,
              href: `${sectionHref}/${category}/${documentSlug}`,
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

        setBreadcrumbs([
          { label: 'Home', href: '/' },
          { label: sectionLabel, href: sectionHref },
          {
            label: categoryData?.category ?? category,
            href: `${sectionHref}/${category}`,
          },
          {
            label: content.title ?? documentSlug,
            href: `${sectionHref}/${category}/${documentSlug}`,
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
      <Section className="p-3 mb-12">
        <Breadcrumbs className="mb-8" items={breadcrumbs} />
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
        <Section className="p-3 mb-12">
          <Breadcrumbs className="mb-8" items={breadcrumbs} />
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

  return (
    <>
      <SEO
        title={doc.title}
        description={doc.description}
        keywords={`${documentSlug}, government services, public services, local government`}
      />
      <Section className="p-3 mb-12">
        <Breadcrumbs className="mb-8" items={breadcrumbs} />

        {/* 🏷️ Page Header area (Custom Visual Layout) */}
        <div className="mb-8 justify-between items-start gap-6 flex flex-col lg:flex-row border-b border-gray-100 pb-6">
          {/* LEFT COLUMN: Official Guide Tag, Title & Description */}
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-axis-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-2.5 py-1 rounded">
              Official Guide
            </span>
            <h1 className="text-4xl font-axis-titular-focus uppercase text-gray-900 mt-3 tracking-wide leading-snug">
              {doc.title}
            </h1>
            {doc.description && (
              <p className="text-lg text-gray-700/70 mt-1 max-w-3xl leading-snug tracking-wide font-axis-subtitular-focus">
                {doc.description}
              </p>
            )}
          </div>

          {/* RIGHT COLUMN: Quick Scan Info Hub (Only displays for structured docs) */}
          {doc.isStructured && (
            <div className="flex flex-col items-start lg:items-end gap-4 shrink-0 w-full lg:w-auto border-t lg:border-t-0 border-gray-100 pt-4 lg:pt-0">
              {/* Row 1: Fees & Expected Time side-by-side */}
              <div className="flex items-center gap-8">
                {/* Estimated Fees */}
                <div className="flex flex-col text-end">
                  <span className="text-[16px] font-axis-sng-indlab-header text-gray-500 uppercase tracking-widest">
                    Estimated Fees
                  </span>
                  <span className="text-3xl font-axis-sng-indlab-value text-burgundy-950 mt-1 proportional-nums">
                    {doc.fees || 'Free of charge'}
                  </span>
                </div>

                {/* Vertical Separator Line */}
                <div
                  className="w-px h-8 bg-gray-200/80 self-center"
                  aria-hidden="true"
                />

                {/* Expected Time */}
                <div className="flex flex-col text-end">
                  <span className="text-[16px] font-axis-sng-indlab-header text-gray-500 uppercase tracking-widest">
                    Expected Time
                  </span>
                  <span className="text-3xl font-axis-sng-indlab-value text-burgundy-950 mt-1 proportional-nums">
                    {doc.time || 'Immediate / Walk-In'}
                  </span>
                </div>
              </div>

              {/* Row 2: Where to Apply (Only displayed if doc.office exists) */}
              {doc.office && (
                <div className="flex flex-col items-start lg:items-end w-full">
                  <span className="text-[16px] font-axis-sng-indlab-header text-gray-500 uppercase tracking-widest">
                    Where to Apply
                  </span>
                  <span className="text-xl lg:text-2xl font-axis-sng-indlab-value text-burgundy-950 mt-1 leading-snug">
                    {doc.office}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {doc.isStructured ? (
          /* 💎 VISUAL DASHBOARD GRID (Triggers when Frontmatter fields exist) */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (2/3 Width): Required Documents & Steps Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stepper Timeline Box */}
              {doc.steps.length > 0 && (
                <Card className="border border-gray-200/80 shadow-xs rounded-xl">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-axis-bold uppercase tracking-wider text-burgundy-900 mb-6">
                      🚶 Step-by-Step Procedure
                    </h3>
                    <div className="relative border-l border-primary-200 ml-4 pl-6 space-y-8">
                      {doc.steps.map((step, i) => (
                        <div key={i} className="relative">
                          {/* Circle Stepper Number Badge */}
                          <span className="absolute -left-[37px] top-0.5 flex h-6.5 w-6.5 items-center justify-center rounded-full bg-primary-600 font-axis-chunky text-[11px] text-white border-2 border-white ring-2 ring-primary-50 shadow-sm">
                            {i + 1}
                          </span>
                          <div className="text-sm leading-relaxed text-gray-700 bg-gray-50/20 hover:bg-gray-50/60 p-3.5 rounded-lg border border-gray-100 transition-colors duration-200">
                            {step}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Optional raw markdown text inside the file (e.g. general notes/FAQ) */}
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

            {/* Right Column (1/3 Width): Quick Info Info Hub */}
            <div className="space-y-6">
              <Card className="border-t-4 border-t-burgundy-900 border border-gray-200 shadow-sm bg-cream-50/40 rounded-xl">
                <CardContent className="p-6 space-y-5">
                  <h3 className="text-xs font-axis-bold uppercase tracking-widest text-burgundy-900/60 border-b border-burgundy-900/10 pb-2">
                    Required Documents
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {doc.requirements.map((req, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-gray-700 bg-gray-50/50 border border-gray-100 p-3 rounded-lg"
                      >
                        <span className="text-emerald-500 font-bold shrink-0">
                          ✓
                        </span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* 📄 STANDARD FALLBACK (Renders standard markdown if no custom frontmatter fields exist) */
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
