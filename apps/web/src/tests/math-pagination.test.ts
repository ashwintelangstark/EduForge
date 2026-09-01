import { describe, it, expect } from 'vitest';
import { astToLatex, nodeToLatex, MathConstructTemplates } from '../equation/MathAST.js';
import { paginateDocument } from '../editor/PaginationEngine.js';
import { DocumentModel } from '@eduforge/shared';

describe('Math AST Engine Tests', () => {
  it('should format fractions correctly in LaTeX', () => {
    const frac = MathConstructTemplates.fraction('x^2 + 1', '2y');
    const latex = nodeToLatex(frac);
    expect(latex).toBe('\\frac{x^2 + 1}{2y}');
  });

  it('should format square roots and nth roots correctly', () => {
    const sqrt = MathConstructTemplates.sqrt('2gh');
    expect(nodeToLatex(sqrt)).toBe('\\sqrt{2gh}');

    const nthRoot = MathConstructTemplates.nthRoot('3', 'V');
    expect(nodeToLatex(nthRoot)).toBe('\\sqrt[3]{V}');
  });

  it('should format powers, subscripts, and sub-superscripts', () => {
    const pow = MathConstructTemplates.power('u', '2');
    expect(nodeToLatex(pow)).toBe('u^{2}');

    const sub = MathConstructTemplates.subscript('v', '0');
    expect(nodeToLatex(sub)).toBe('v_{0}');
  });

  it('should format definite and indefinite integrals', () => {
    const int = MathConstructTemplates.integral('0', '\\pi', '\\sin x', 'x');
    expect(nodeToLatex(int)).toBe('\\int_{0}^{\\pi} \\sin x \\, dx');
  });

  it('should format 2x2 matrices', () => {
    const mat = MathConstructTemplates.matrix2x2('1', '0', '0', '1');
    const latex = nodeToLatex(mat);
    expect(latex).toContain('\\begin{bmatrix}');
    expect(latex).toContain('1 & 0 \\\\ 0 & 1');
    expect(latex).toContain('\\end{bmatrix}');
  });

  it('should format derivatives', () => {
    const d = MathConstructTemplates.derivative('y', 'x', 2);
    expect(nodeToLatex(d)).toBe('\\frac{d^2 y}{d x^2}');
  });
});

describe('Pagination Engine Tests', () => {
  it('should divide content across discrete A4 pages', () => {
    const doc: DocumentModel = {
      id: 'doc-page-test',
      title: 'Pagination Multi-Page Test',
      metadata: {
        instituteName: 'ACADEMY',
        examName: 'EXAM',
        subject: 'Physics',
        timeAllowedMinutes: 180,
        maxMarks: 100
      },
      settings: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 15, bottom: 15, left: 15, right: 15 },
        columns: 2,
        columnGap: 8,
        columnDivider: true,
        defaultFont: 'Inter',
        defaultFontSize: 10.5,
        questionSpacing: 12,
        optionSpacing: 4,
        lineSpacing: 1.25,
        paragraphSpacing: 6
      },
      sections: [
        {
          id: 'sec-1',
          title: 'SECTION A',
          marks: 100,
          blocks: Array.from({ length: 14 }, (_, i) => ({
            id: `q-${i + 1}`,
            type: 'question' as const,
            question: {
              id: `q-${i + 1}`,
              questionNumber: i + 1,
              questionType: 'MCQ_SINGLE' as const,
              rawText: `Question statement number ${i + 1} regarding classical kinematics and laws of motion in physics.`,
              content: [],
              options: [
                { id: '1', key: 'a', rawText: 'Option A', isCorrect: true, content: [] },
                { id: '2', key: 'b', rawText: 'Option B', isCorrect: false, content: [] },
                { id: '3', key: 'c', rawText: 'Option C', isCorrect: false, content: [] },
                { id: '4', key: 'd', rawText: 'Option D', isCorrect: false, content: [] }
              ],
              correctAnswer: 'a',
              marks: 4,
              difficulty: 'Medium' as const,
              tags: [],
              optionLayout: 'grid_2x2' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }))
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const pages = paginateDocument(doc);
    expect(pages.length).toBeGreaterThanOrEqual(2);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[0].columns.length).toBe(1); // Single-column layout
    expect(pages[1].pageNumber).toBe(2);
  });
});
