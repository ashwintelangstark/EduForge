import { MathAST } from './math-ast.js';
import { Question } from './question.js';

export type Alignment = 'left' | 'center' | 'right' | 'justify';

export interface TextFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  superscript?: boolean;
  subscript?: boolean;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: number; // in pt or px
  letterSpacing?: number;
  textEffect?: 'none' | 'shadow' | 'glow' | 'outline' | 'reflection';
  underlineStyle?: 'single' | 'double' | 'dotted' | 'dashed' | 'wavy';
  underlineColor?: string;
  characterBorder?: boolean;
}

export interface TextRun {
  id: string;
  text: string;
  formatting?: TextFormatting;
}

export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'equation'
  | 'image'
  | 'table'
  | 'shape'
  | 'wordart'
  | 'question'
  | 'page_break'
  | 'horizontal_line'
  | 'section_header';

export interface BaseBlock {
  id: string;
  type: BlockType;
  column?: 0 | 1 | 'auto';
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  runs: TextRun[];
  alignment?: Alignment;
  lineSpacing?: number; // e.g. 1.15, 1.5
  indent?: number; // e.g. in mm or px
  listType?: 'none' | 'bullet' | 'number' | 'alpha' | 'roman' | 'multilevel';
  listLevel?: number;
  listBulletStyle?: string;
  border?: 'none' | 'box' | 'all' | 'left' | 'bottom' | 'top';
  backgroundColor?: string;
  styleName?: string;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  runs: TextRun[];
  alignment?: Alignment;
  border?: 'none' | 'box' | 'all' | 'left' | 'bottom' | 'top';
  backgroundColor?: string;
}

export interface EquationBlock extends BaseBlock {
  type: 'equation';
  ast?: MathAST;
  rawLatex: string;
  alignment?: Alignment;
  displayMode?: 'block' | 'inline';
  fontSize?: number;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt?: string;
  width?: number; // in px or mm
  height?: number;
  alignment?: Alignment;
  caption?: string;
}

export interface TableCell {
  id: string;
  content: DocumentBlock[];
  colSpan?: number;
  rowSpan?: number;
  backgroundColor?: string;
  borderColor?: string;
  textAlign?: Alignment;
  padding?: number;
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  rows: number;
  cols: number;
  cells: TableCell[][];
  alignment?: Alignment;
  hasBorder?: boolean;
  borderColor?: string;
  widthPercent?: number;
}

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'callout' | 'box' | 'triangle' | 'star';

export interface ShapeBlock extends BaseBlock {
  type: 'shape';
  shapeType: ShapeType;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  labelText?: string;
  alignment?: Alignment;
}

export type WordArtStyle =
  | 'gradient_purple'
  | 'gold_3d'
  | 'neon_blue'
  | 'cyber_glow'
  | 'metallic'
  | 'outline_red'
  | 'sunset'
  | 'rainbow';

export interface WordArtBlock extends BaseBlock {
  type: 'wordart';
  text: string;
  style: WordArtStyle;
  fontSize: number;
  fontFamily?: string;
  alignment?: Alignment;
}

export interface QuestionBlock extends BaseBlock {
  type: 'question';
  question: Question;
  fontSize?: number;
  scale?: number;
  padding?: number;
  lineSpacing?: number;
}

export interface PageBreakBlock extends BaseBlock {
  type: 'page_break';
}

export interface HorizontalLineBlock extends BaseBlock {
  type: 'horizontal_line';
  style?: 'solid' | 'dashed' | 'dotted' | 'double';
  color?: string;
  thickness?: number;
}

export interface SectionHeaderBlock extends BaseBlock {
  type: 'section_header';
  title: string;
  subtitle?: string;
  instructions?: string;
  totalMarks?: number;
}

export type DocumentBlock =
  | ParagraphBlock
  | HeadingBlock
  | EquationBlock
  | ImageBlock
  | TableBlock
  | ShapeBlock
  | WordArtBlock
  | QuestionBlock
  | PageBreakBlock
  | HorizontalLineBlock
  | SectionHeaderBlock;

export interface DocumentSection {
  id: string;
  title: string;
  subtitle?: string;
  instructions?: string;
  marks?: number;
  blocks: DocumentBlock[];
}

export interface PaperMargins {
  top: number;    // mm (e.g. 20)
  bottom: number; // mm (e.g. 20)
  left: number;   // mm (e.g. 20)
  right: number;  // mm (e.g. 20)
}

export interface PaperMetadata {
  instituteName?: string;
  examName?: string;
  academicYear?: string;
  subject?: string;
  courseCode?: string;
  grade?: string;
  timeAllowedMinutes?: number;
  maxMarks?: number;
  generalInstructions?: string[];
  date?: string;
  logoUrl?: string;
  headerTemplate?: 'boxed' | 'classic' | 'minimal' | 'modern' | 'double_line';
  createdBy?: string;
  author?: string;
}

export interface DocumentSettings {
  pageSize: 'A4';
  orientation: 'portrait' | 'landscape';
  margins: PaperMargins;
  columns: 1 | 2;
  columnGap: number; // in mm, e.g. 8mm
  columnDivider: boolean;
  defaultFont: string; // e.g. 'Inter', 'Times New Roman', 'Arial', 'Computer Modern'
  defaultFontSize: number; // e.g. 11pt
  questionSpacing: number; // in mm or px
  optionSpacing: number;
  lineSpacing: number;
  paragraphSpacing: number;
  headerHeightMm?: number;
  footerHeightMm?: number;
  showPageNumbers?: boolean;
  pageNumberPosition?: 'bottom_center' | 'bottom_right' | 'top_right';
}

export interface DocumentModel {
  id: string;
  title: string;
  templateId?: string;
  metadata: PaperMetadata;
  settings: DocumentSettings;
  sections: DocumentSection[];
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}
