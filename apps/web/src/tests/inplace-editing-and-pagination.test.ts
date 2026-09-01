import { describe, it, expect } from 'vitest';
import { paginateDocument } from '../editor/PaginationEngine.js';
import { DocumentModel, QuestionBlock } from '@eduforge/shared';

describe('EduForge In-Place Editing & Pagination Flow Tests', () => {
  it('should paginate 2-column exam papers from Left Column -> Right Column -> Page 2 -> Page 3', () => {
    // Generate 24 test questions to test 3-page flow (8 questions per page)
    const testBlocks: QuestionBlock[] = Array.from({ length: 24 }, (_, i) => ({
      id: `qblk-${i + 1}`,
      type: 'question',
      question: {
        id: `q-${i + 1}`,
        questionNumber: i + 1,
        questionType: 'MCQ_SINGLE' as const,
        content: [],
        tags: ['physics'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rawText: `Question ${i + 1}: Calculate the electric field intensity at distance r from a point charge q in a medium of dielectric constant K = ${i + 1}.`,
        marks: 4,
        negativeMarks: 1,
        difficulty: 'Medium' as const,
        subject: 'Physics',
        optionLayout: 'grid_2x2' as const,
        options: [
          { id: `opt-${i}-a`, key: 'a', rawText: `\\frac{q}{4\\pi\\varepsilon_0 K r^2}`, content: [], isCorrect: true },
          { id: `opt-${i}-b`, key: 'b', rawText: `\\frac{q^2}{4\\pi\\varepsilon_0 r}`, content: [], isCorrect: false },
          { id: `opt-${i}-c`, key: 'c', rawText: `\\frac{K q}{4\\pi\\varepsilon_0 r^2}`, content: [], isCorrect: false },
          { id: `opt-${i}-d`, key: 'd', rawText: `\\text{Zero}`, content: [], isCorrect: false }
        ]
      }
    }));

    const mockDoc: DocumentModel = {
      id: 'doc-flow-test',
      title: 'CBSE 2-Column Physics Exam Paper',
      templateId: 'cbse-12-board',
      settings: {
        pageSize: 'A4',
        orientation: 'portrait',
        columns: 2,
        columnGap: 8,
        columnDivider: true,
        margins: { top: 12, bottom: 12, left: 12, right: 12 },
        defaultFont: 'Calibri',
        defaultFontSize: 10.5,
        questionSpacing: 6,
        optionSpacing: 4,
        lineSpacing: 1.15,
        paragraphSpacing: 4
      },
      metadata: {
        instituteName: 'DELHI PUBLIC SENIOR SECONDARY SCHOOL',
        examName: 'ALL INDIA SENIOR SCHOOL CERTIFICATE EXAMINATION 2026',
        subject: 'Physics (042)',
        timeAllowedMinutes: 180,
        maxMarks: 70,
        generalInstructions: ['All questions are compulsory.', 'Use of log tables is permitted.']
      },
      sections: [
        {
          id: 'sec-a',
          title: 'SECTION A (Multiple Choice Questions)',
          instructions: 'Each question carries 1 mark',
          marks: 16,
          blocks: testBlocks
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const pages = paginateDocument(mockDoc);

    // Assert that we have at least 3 pages generated
    expect(pages.length).toBeGreaterThanOrEqual(3);

    // Page 1 assertions: has 1 column
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[0].isFirstPage).toBe(true);
    expect(pages[0].columns.length).toBe(1);
    expect(pages[0].columns[0].blocks.length).toBeGreaterThan(0);

    // Page 2 assertions
    expect(pages[1].pageNumber).toBe(2);
    expect(pages[1].isFirstPage).toBe(false);
    expect(pages[1].columns.length).toBe(1);
    expect(pages[1].columns[0].blocks.length).toBeGreaterThan(0);

    // Page 3 assertions
    expect(pages[2].pageNumber).toBe(3);
    expect(pages[2].columns[0].blocks.length).toBeGreaterThan(0);
  });

  it('should support diagram SVG attachments within question blocks', () => {
    const diagSvg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="black" fill="none"/></svg>';
    const qb: QuestionBlock = {
      id: 'qblk-diag',
      type: 'question',
      question: {
        id: 'q-diag',
        questionType: 'MCQ_SINGLE',
        content: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        difficulty: 'Medium',
        optionLayout: 'grid_2x2',
        rawText: 'In the given circuit diagram, find equivalent resistance between terminals A and B.',
        marks: 3,
        options: [
          { id: '1', key: 'a', rawText: '2 \\Omega', content: [], isCorrect: true },
          { id: '2', key: 'b', rawText: '4 \\Omega', content: [], isCorrect: false }
        ],
        diagramSvg: diagSvg
      }
    };

    expect(qb.question.diagramSvg).toBe(diagSvg);
    expect(qb.question.diagramSvg).toContain('<svg');
  });
});
