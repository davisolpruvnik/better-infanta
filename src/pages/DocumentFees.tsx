// src/pages/DocumentFees.tsx
import Section from '../components/ui/Section';
import Breadcrumbsless from '@/components/ui/BreadcrumbsLess';
import { Heading } from '../components/ui/Heading';
import { Text } from '../components/ui/Text';
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import SEO from '../components/SEO';
import { loadMarkdownContent, type MarkdownContent } from '../lib/markdownLoader';
import { parseServiceDocument, formatSlugToTitle } from '@/lib/serviceDocParsing';
import { governmentCategories, serviceCategories } from '../data/yamlLoader';
import LazyIcon from '@/components/ui/Lazying';

interface DocumentFeesProps {
  categoryType?: 'service' | 'government';
}

export default function DocumentFees({ categoryType }: DocumentFeesProps) {
  const { documentSlug, category } = useParams();
  const [markdownContent, setMarkdownContent] = useState<MarkdownContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [breadcrumbs, setBreadcrumbs] = useState([
    { label: 'Home', href: '/' },
  ]);

  // Parse Document & Fees data
  const doc = useMemo(() => {
    if (!markdownContent) return null;
    return parseServiceDocument(
      markdownContent.title || documentSlug || '',
      markdownContent.description || '',
      markdownContent.content
    );
  }, [markdownContent, documentSlug]);

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
        const categories = isGovernment ? governmentCategories.categories : serviceCategories.categories;
        const sectionLabel = isGovernment ? 'Government' : 'Services';
        const sectionHref = isGovernment ? '/government' : '/services';
        const categoryData = categories.find(c => c.slug === category);

        const content = await loadMarkdownContent(documentSlug, category, categoryType);
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
            label: parsedDoc.title || content.title || formatSlugToTitle(documentSlug),
            href: `${sectionHref}/${category}/${documentSlug}`,
          },
          { label: 'Regulatory Fees & Breakdown', href: undefined },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fees');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [documentSlug, category, categoryType]);

  if (loading) {
    return (
      <Section className="p-3 mb-12">
        <div className="flex items-center gap-2">
          <LazyIcon name="fluent-emoji-high-contrast:construction" className="w-6 h-6 text-black" />
          <span>Loading schedule of fees...</span>
        </div>
      </Section>
    );
  }

  if (error || !doc) {
    return (
      <Section className="p-3 mb-12 justify-center">
        <div className="flex justify-center mb-8">
          <Breadcrumbsless items={breadcrumbs} />
        </div>
        <div className="flex flex-col justify-center items-center gap-2">
          <LazyIcon name="fluent-emoji-high-contrast:construction" className="w-8 h-8 text-fantas-800" />
          <span className="text-fantas-800 font-axis-bold">Fees schedule not available.</span>
        </div>
      </Section>
    );
  }

  return (
    <>
      <SEO
        title={`Regulatory Fees - ${doc.title}`}
        description={`Schedule of regulatory fees and breakdown for ${doc.title}`}
      />
      <Section className="mx-auto">
        <div className="flex justify-center mb-8">
          <Breadcrumbsless items={breadcrumbs} className="text-xs" />
        </div>

        {/* Header Back Button & Title */}
        <div className="mb-6">
          <Link
            to={-1 as any}
            className="inline-flex items-center gap-1.5 text-xs font-axis-navbar-focus uppercase tracking-wider text-fantas-700 hover:text-fantas-900 mb-4 transition-colors"
          >
            <LazyIcon name="lucide:arrow-left" className="h-4 w-4" />
            Back to Service Details
          </Link>
          <Heading level={2} className="text-xl font-axis-titular-focus text-fantas-900">
            {doc.title}: Regulatory Fees
          </Heading>
          <span className="font-axis-subtitular-focus tracking-wide text-sm text-gray-600 mt-1">
            Comprehensive breakdown of fees segregated by respective regulatory departments and offices.
          </span>
        </div>

        <div className='text-center font-axis-navbar-focus mb-6 underline uppercase tracking-wide text-xs text-fantas-900'>
          Based on 2026 Citizen's Charter; verify with the authorities for the fees if in doubt.
        </div>

        {/* Grid Container for Fees Categories (Similar to Agenda / Horoscopo card format) */}
        {doc.regulatory_fees && doc.regulatory_fees.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {doc.regulatory_fees.map((group, index) => (
              <div
                key={index}
                className="flex flex-col justify-between"
              >
                {group.category && (
                  <h3 className="text-sm font-axis-navbar-focus uppercase tracking-wider text-fantas-50 flex items-center gap-2 pb-4">
                    <span className="bg-fantas-900 px-2 py-1 leading-tight">{group.category}</span>
                  </h3>
                )}

                {group.items && group.items.length > 0 && (
                  <div className="flex-1 divide-y divide-fantas-900/20">
                    {group.items.map((item, itemIdx) => (
                      <div
                            key={itemIdx}
                            className="flex items-baseline justify-between gap-4 py-3 first:pt-1 last:pb-0 text-xs sm:text-sm"
                          >
                            {/* Left Side: Description */}
                            <span className="font-axis-book text-fantas-900/80 leading-snug max-w-[75%] flex-1 pr-2">
                              {item.name}
                            </span>

                            {/* Right Side: Fee / Price */}
                            <span className="font-axis-number-focus text-fantas-900 text-right leading-snug max-w-[50%] text-pretty self-baseline">
                              {item.price}
                            </span>
                          </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500 font-axis-thin">
              No detailed breakdown items are specified for this service. General fees apply: <strong className="text-fantas-900">{doc.fees}</strong>
            </p>
          </div>
        )}
      </Section>
    </>
  );
}
