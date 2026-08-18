export interface RequirementGroup {
  key: string;
  label: string;
  items: string[];
}

export interface ParsedServiceDoc {
  isStructured: boolean;
  title: string;
  description: string;
  fees?: string;
  feeDetails?: string;
  time?: string
  timeDetails?: string;
  office?: string;
  officeAddress?: string;
  officeHours?: string;
  requirementsGroups: RequirementGroup[];
  whocanavail: string[];
  steps: string[];
  postscripts?: string;
  rawMarkdownContent: string;
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
