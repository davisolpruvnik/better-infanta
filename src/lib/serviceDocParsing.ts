import { ParsedServiceDoc, ProcessedStep, RequirementGroup } from "@/types/serviceDocuments";

export function formatRequirementLabel(key: string): string {
  if (key === 'requirements') return 'General';
  const cleanKey = key.replace(/^requirements_?/, '');
  if (!cleanKey) return 'General';
  return cleanKey
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatSlugToTitle(slug: string): string {
  if (!slug) return '';
  if (slug.includes(' ')) return slug;
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

export function parseServiceDocument(
  titleFromLoader: string,
  descriptionFromLoader: string,
  rawMarkdown: string
): ParsedServiceDoc {
  let fallbackTitle = titleFromLoader;
  if (rawMarkdown) {
    const h1Match = rawMarkdown.match(/^#\s+(.+)$/m);
    fallbackTitle = h1Match ? h1Match[1].trim() : formatSlugToTitle(titleFromLoader);
  }

  if (!rawMarkdown || typeof rawMarkdown !== 'string' || !rawMarkdown.trim().startsWith('---')) {
    return {
      isStructured: false,
      title: fallbackTitle,
      description: descriptionFromLoader,
      requirementsGroups: [],
      whocanavail: [],
      steps: [],
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
        rawMarkdownContent: rawMarkdown,
      };
    }

    const frontmatterText = parts[1];
    const remainingMarkdown = parts.slice(2).join('---').trim();

    const data: Record<string, string | string[]> = {};
    let currentKey = '';
    let currentList: string[] = [];

    for (const line of frontmatterText.split('\n')) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (trimmedLine.startsWith('-') && currentKey) {
        const itemValue = trimmedLine
          .replace(/^-\s*/, '')
          .replace(/^["']|["']$/g, '')
          .trim();
        currentList.push(itemValue);
        data[currentKey] = [...currentList];
        continue;
      }

      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex !== -1) {
        const key = trimmedLine.substring(0, colonIndex).trim();
        const value = trimmedLine
          .substring(colonIndex + 1)
          .trim()
          .replace(/^["']|["']$/g, '');

        currentKey = key;
        currentList = [];

        if (value) data[key] = value;
      }
    }

    const requirementsGroups: RequirementGroup[] = [];
    for (const key of Object.keys(data)) {
      if (key.startsWith('requirements')) {
        const items = Array.isArray(data[key]) ? (data[key] as string[]) : [];
        if (items.length > 0) {
          requirementsGroups.push({ key, label: formatRequirementLabel(key), items });
        }
      }
    }

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
      whocanavail: Array.isArray(data['whocanavail']) ? (data['whocanavail'] as string[]) : [],
      steps: Array.isArray(data['steps']) ? (data['steps'] as string[]) : [],
      postscripts: Array.isArray(data['postscripts'])
        ? (data['postscripts'] as string[]).join('\n')
        : (data['postscripts'] as string) || undefined,
      rawMarkdownContent: remainingMarkdown,
    };
  } catch (err) {
    console.error('Failed parsing structured frontmatter', err);
    return {
      isStructured: false,
      title: fallbackTitle,
      description: descriptionFromLoader,
      requirementsGroups: [],
      whocanavail: [],
      steps: [],
      rawMarkdownContent: rawMarkdown,
    };
  }
}

export function processSteps(steps: string[]): ProcessedStep[] {
  const counters: number[] = [];

  const getIndentClass = (lvl: number) => {
    if (lvl === 1) return 'pl-0 sm:pl-8 mt-4 ml-0';
    if (lvl === 2) return 'pl-0 sm:pl-8 mt-4 ml-0 sm:ml-4';
    if (lvl >= 3) return 'pl-0 sm:pl-8 mt-4 ml-0 sm:ml-8';
    return '';
  };

  return steps.map((step, i) => {
    const trimmed = step.trim();
    const levelMatch = trimmed.match(/^>+/);
    const level = levelMatch ? levelMatch[0].length : 0;
    const cleanStep = trimmed.replace(/^>+/, '').trim();

    const isAccordion = cleanStep.includes('|');
    const [summaryText, ...detailParts] = cleanStep.split('|');
    const detailText = detailParts.join('|').trim();

    if (counters.length <= level) {
      while (counters.length <= level) counters.push(0);
    } else {
      counters.splice(level + 1);
    }

    counters[level]++;

    const badge = counters
      .map((val, idx) => {
        if (idx === 0) return `${val}`;
        if (idx === 1) return String.fromCharCode(65 + (val - 1));
        return `${val}`;
      })
      .join('.');

    return {
      id: i,
      level,
      cleanStep,
      badge,
      summaryText: summaryText.trim(),
      detailText,
      isAccordion,
      isSubStep: level > 0,
      indentClass: getIndentClass(level),
    };
  });
}
