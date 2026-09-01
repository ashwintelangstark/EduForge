import React from 'react';
import { MathConstructTemplates, nodeToLatex } from './MathAST.js';
import { MathASTNode } from '@eduforge/shared';
import { KaTeXRenderer } from './KaTeXRenderer.js';

interface EquationPaletteProps {
  onInsertConstruct: (latexSnippet: string, astNode?: MathASTNode) => void;
}

export const EquationPalette: React.FC<EquationPaletteProps> = ({ onInsertConstruct }) => {
  const categories = [
    {
      title: 'Fractions & Roots',
      items: [
        { label: 'Fraction', latex: '\\frac{a}{b}', createNode: () => MathConstructTemplates.fraction() },
        { label: 'Square Root', latex: '\\sqrt{x}', createNode: () => MathConstructTemplates.sqrt() },
        { label: 'Nth Root', latex: '\\sqrt[n]{x}', createNode: () => MathConstructTemplates.nthRoot() },
        { label: 'Power', latex: 'x^2', createNode: () => MathConstructTemplates.power() },
        { label: 'Subscript', latex: 'x_0', createNode: () => MathConstructTemplates.subscript() },
        { label: 'Sub-Superscript', latex: 'x_0^2', createNode: (): MathASTNode => ({ id: `subsup-${Date.now()}`, type: 'sub_sup', base: [{ id: '1', type: 'text', value: 'x' }], subscript: [{ id: '2', type: 'text', value: '0' }], superscript: [{ id: '3', type: 'text', value: '2' }] }) }
      ]
    },
    {
      title: 'Calculus & Operators',
      items: [
        { label: 'Definite Integral', latex: '\\int_{a}^{b} f(x)\\,dx', createNode: () => MathConstructTemplates.integral() },
        { label: 'Indefinite Integral', latex: '\\int f(x)\\,dx', createNode: (): MathASTNode => ({ id: `int-${Date.now()}`, type: 'integral', integrand: [{ id: '1', type: 'text', value: 'f(x)' }], variable: 'x' }) },
        { label: 'Summation', latex: '\\sum_{i=1}^{n} x_i', createNode: () => MathConstructTemplates.summation() },
        { label: 'Product', latex: '\\prod_{i=1}^{n} x_i', createNode: (): MathASTNode => ({ id: `prod-${Date.now()}`, type: 'product', lower: [{ id: '1', type: 'text', value: 'i=1' }], upper: [{ id: '2', type: 'text', value: 'n' }], body: [{ id: '3', type: 'text', value: 'x_i' }] }) },
        { label: 'Limit', latex: '\\lim_{x \\to 0} f(x)', createNode: (): MathASTNode => ({ id: `lim-${Date.now()}`, type: 'limit', variable: 'x', target: '0', expression: [{ id: '1', type: 'text', value: 'f(x)' }] }) },
        { label: 'Derivative', latex: '\\frac{dy}{dx}', createNode: () => MathConstructTemplates.derivative() },
        { label: 'Partial Derivative', latex: '\\frac{\\partial f}{\\partial x}', createNode: (): MathASTNode => ({ id: `pderiv-${Date.now()}`, type: 'derivative', isPartial: true, numerator: [{ id: '1', type: 'text', value: 'f' }], variable: 'x' }) }
      ]
    },
    {
      title: 'Matrices & Vectors',
      items: [
        { label: '2x2 Matrix', latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}', createNode: () => MathConstructTemplates.matrix2x2() },
        { label: '3x3 Matrix', latex: '\\begin{bmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{bmatrix}' },
        { label: 'Vector Arrow', latex: '\\vec{v}', createNode: (): MathASTNode => ({ id: `vec-${Date.now()}`, type: 'vector', name: 'v', style: 'arrow' }) },
        { label: 'Unit Vector', latex: '\\hat{i}', createNode: (): MathASTNode => ({ id: `vec-${Date.now()}`, type: 'vector', name: 'i', style: 'hat' }) },
        { label: 'Parentheses', latex: '\\left( x \\right)', createNode: (): MathASTNode => ({ id: `brk-${Date.now()}`, type: 'bracket', leftBracket: '(', rightBracket: ')', content: [{ id: '1', type: 'text', value: 'x' }] }) },
        { label: 'Square Brackets', latex: '\\left[ x \\right]', createNode: (): MathASTNode => ({ id: `brk-${Date.now()}`, type: 'bracket', leftBracket: '[', rightBracket: ']', content: [{ id: '1', type: 'text', value: 'x' }] }) }
      ]
    },
    {
      title: 'Greek & Symbols',
      items: [
        { label: 'alpha', latex: '\\alpha' },
        { label: 'beta', latex: '\\beta' },
        { label: 'gamma', latex: '\\gamma' },
        { label: 'delta', latex: '\\delta' },
        { label: 'theta', latex: '\\theta' },
        { label: 'lambda', latex: '\\lambda' },
        { label: 'mu', latex: '\\mu' },
        { label: 'pi', latex: '\\pi' },
        { label: 'sigma', latex: '\\sigma' },
        { label: 'omega', latex: '\\omega' },
        { label: 'Delta', latex: '\\Delta' },
        { label: 'Omega', latex: '\\Omega' },
        { label: 'infinity', latex: '\\infty' },
        { label: 'plus-minus', latex: '\\pm' },
        { label: 'times', latex: '\\times' },
        { label: 'approx', latex: '\\approx' },
        { label: 'nabla', latex: '\\nabla' },
        { label: 'hbar', latex: '\\hbar' }
      ]
    }
  ];

  return (
    <div className="space-y-4 max-h-[380px] overflow-y-auto p-1">
      {categories.map(cat => (
        <div key={cat.title} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{cat.title}</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {cat.items.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const node = item.createNode ? item.createNode() : undefined;
                  const snippet = node ? nodeToLatex(node) : item.latex;
                  onInsertConstruct(snippet, node);
                }}
                className="flex flex-col items-center justify-center p-2 h-14 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-400 rounded-md transition-all text-slate-800 shadow-sm active:scale-95 group"
                title={item.label}
              >
                <KaTeXRenderer math={item.latex} className="text-sm scale-90 group-hover:scale-100 transition-transform" />
                <span className="text-[10px] text-slate-400 group-hover:text-sky-600 mt-1 truncate w-full text-center">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
