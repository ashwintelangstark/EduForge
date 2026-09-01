import { DocumentSettings, PaperMetadata } from './document.js';
import { OptionLayoutType } from './question.js';

export interface TemplateSectionConfig {
  defaultTitle: string;
  defaultInstructions?: string;
  defaultMarks?: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'generic' | 'competitive' | 'school' | 'university' | 'custom';
  thumbnailUrl?: string;
  settings: DocumentSettings;
  defaultMetadata: Partial<PaperMetadata>;
  defaultSections: TemplateSectionConfig[];
  defaultOptionLayout: OptionLayoutType;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}
