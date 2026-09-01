import { DocumentBlock } from './document.js';

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export type QuestionType =
  | 'MCQ_SINGLE'
  | 'MCQ_MULTIPLE'
  | 'NUMERICAL'
  | 'ASSERTION_REASON'
  | 'MATCHING';

export type OptionLayoutType =
  | 'grid_2x2'       // (a)  (b) \n (c)  (d)
  | 'grid_2x2_upper' // A.   B.  \n C.   D.
  | 'vertical'       // 1 item per line
  | 'horizontal'     // inline
  | 'auto';

export interface QuestionOption {
  id: string;
  key: string;       // 'a', 'b', 'c', 'd' or 'A', 'B', 'C', 'D' or '1', '2', '3', '4'
  content: DocumentBlock[];
  rawText?: string;
  isCorrect?: boolean;
  imageUrl?: string;
  imageSvg?: string;
  diagramSvg?: string;
}

export interface Question {
  id: string;
  questionCode?: string;
  question_code?: string;
  questionNumber?: number | string;
  questionType: QuestionType;
  content: DocumentBlock[];
  rawText?: string;
  options: QuestionOption[];
  correctAnswer?: string;
  marks: number;
  negativeMarks?: number;
  subject?: string;
  chapter?: string;
  topic?: string;
  difficulty: QuestionDifficulty;
  tags: string[];
  year?: number | string;
  optionLayout: OptionLayoutType;
  explanation?: DocumentBlock[];
  explanationText?: string;
  diagramUrl?: string;
  diagramSvg?: string;
  imageUrl?: string;
  imageUrls?: string[];
  isSystem?: boolean;
  isPublished?: boolean;
  status?: 'saved' | 'published' | 'draft';
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionBankFilter {
  searchQuery?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  difficulty?: QuestionDifficulty;
  year?: number | string;
  questionType?: QuestionType;
  tags?: string[];
  marksMin?: number;
  marksMax?: number;
}
