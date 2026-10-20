export interface RegulatoryFeeItem {
  name: string;
  price: string;
}

export interface RegulatoryFeeCategory {
  category?: string;
  items: RegulatoryFeeItem[];
}

export interface RequirementGroup {
  key: string;
  label: string;
  items: string[];
}

export interface ProcessedStep {
  id: number;
  level: number;
  cleanStep: string;
  badge: string;
  summaryText: string;
  detailText: string;
  isAccordion: boolean;
  isSubStep: boolean;
  indentClass: string;
}

export interface ParsedServiceDoc {
  isStructured: boolean;
  title: string;
  description: string;
  fees?: string;
  feeDetails?: string;
  time?: string;
  timeDetails?: string;
  office?: string;
  officeAddress?: string;
  officeHours?: string;
  requirementsGroups: RequirementGroup[];
  whocanavail: string[];
  steps: string[];
  postscripts?: string;
  feeBreakdownMode?: 'separate' | 'inline';
  regulatory_fees?: RegulatoryFeeCategory[];
  rawMarkdownContent: string;
}

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

    const data: Record<string, any> = {};
    const lines = frontmatterText.split('\n');

    let currentKey = '';
    let currentList: string[] = [];

    // Parse top-level keys safely without eating everything below
    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmedLine = rawLine.trim();
      if (!trimmedLine) continue;

      // Check if this line is a top-level key (starts at margin, contains ':')
      const isTopLevelKey = !rawLine.startsWith(' ') && !rawLine.startsWith('\t') && !rawLine.startsWith('-') && trimmedLine.includes(':');

      if (isTopLevelKey) {
        // Save previously accumulated list
        if (currentKey && currentList.length > 0) {
          data[currentKey] = [...currentList];
        }

        const colonIdx = trimmedLine.indexOf(':');
        const key = trimmedLine.substring(0, colonIdx).trim();
        const value = trimmedLine.substring(colonIdx + 1).trim().replace(/^["']|["']$/g, '');

        currentKey = key;
        currentList = [];

        if (value) {
          data[key] = value;
        }
        continue;
      }

      // If it's a regular list item under an active key (like requirements, steps, whocanavail)
      if (currentKey && currentKey !== 'regulatory_fees' && trimmedLine.startsWith('-')) {
        const itemVal = trimmedLine.replace(/^-\s*/, '').replace(/^["']|["']$/g, '').trim();
        currentList.push(itemVal);
        data[currentKey] = [...currentList];
      }
    }

    // Save any trailing list
    if (currentKey && currentList.length > 0 && currentKey !== 'regulatory_fees') {
      data[currentKey] = [...currentList];
    }

    // 💡 Dedicated Safe Parser for regulatory_fees block
    const regulatory_fees: RegulatoryFeeCategory[] = [];
    const feeBlockMatch = frontmatterText.match(/regulatory_fees:\s*([\s\S]*?)(?=\n[a-zA-Z0-9_]+:|$)/);

    if (feeBlockMatch) {
      const feeLines = feeBlockMatch[1].split('\n');
      let curCat: RegulatoryFeeCategory | null = null;
      let curItem: RegulatoryFeeItem | null = null;

      for (const fLine of feeLines) {
        const t = fLine.trim();
        if (!t) continue;

        if (t.includes('category:')) {
          if (curCat) regulatory_fees.push(curCat);
          const name = t.replace(/.*category:\s*/, '').replace(/^["']|["']$/g, '').trim();
          curCat = { category: name, items: [] };
          curItem = null;
          continue;
        }

        if (t.includes('name:')) {
          if (!curCat) curCat = { category: 'General', items: [] };
          const name = t.replace(/.*name:\s*/, '').replace(/^["']|["']$/g, '').trim();
          curItem = { name, price: '' };
          curCat.items.push(curItem);
          continue;
        }

        if (t.includes('price:') && curItem) {
          const price = t.replace(/.*price:\s*/, '').replace(/^["']|["']$/g, '').trim();
          curItem.price = price;
          continue;
        }
      }
      if (curCat) regulatory_fees.push(curCat);
    }

    // Group requirements
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
      (Array.isArray(data['steps']) && data['steps'].length > 0)
    );

    const feeBreakdownMode = (data['fee_breakdown_mode'] as 'separate' | 'inline') || 'inline';

        return {
          isStructured,
          title: (data['title'] as string) || fallbackTitle,
          description: (data['description'] as string) || descriptionFromLoader,
          fees: data['fees'] as string,
          feeDetails: data['fee_details'] as string,
          time: (data['time'] || data['processingTime']) as string,
          timeDetails: (data['time_details'] || data['processingTime_details']) as string,
          office: data['office'] as string,
          officeAddress: (data['office_address'] as string) || undefined,
          officeHours: (data['office_hours'] as string) || undefined,
          requirementsGroups,
          whocanavail: Array.isArray(data['whocanavail']) ? (data['whocanavail'] as string[]) : [],
          steps: Array.isArray(data['steps']) ? (data['steps'] as string[]) : [],
          postscripts: Array.isArray(data['postscripts'])
            ? (data['postscripts'] as string[]).join('\n')
            : (data['postscripts'] as string) || undefined,
          feeBreakdownMode, // 💡 Add this line
          regulatory_fees,
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
    if (lvl === 1) return 'pl-2 mt-2 ml-0';
    if (lvl === 2) return 'pl-2 mt-2 ml-2';
    if (lvl >= 3) return 'pl-2 mt-2 ml-4';
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
