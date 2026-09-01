import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Sigma, Sparkles, BookOpen, Copy, RotateCcw } from 'lucide-react';
import katex from 'katex';

interface MathTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertFormula: (latex: string, isBlock?: boolean) => void;
  initialFormula?: string;
}

// MathType Formula Tool Categories & Templates
const MATH_TOOLBAR_CATEGORIES = [
  {
    category: 'Fractions & Roots',
    items: [
      { label: 'Fraction (a/b)', latex: '\\frac{a}{b}', preview: '\\frac{a}{b}' },
      { label: 'Square Root (√x)', latex: '\\sqrt{x}', preview: '\\sqrt{x}' },
      { label: 'N-th Root (ⁿ√x)', latex: '\\sqrt[n]{x}', preview: '\\sqrt[n]{x}' },
      { label: 'Exponent (xⁿ)', latex: 'x^{n}', preview: 'x^{n}' },
      { label: 'Subscript (xₙ)', latex: 'x_{n}', preview: 'x_{n}' },
      { label: 'Sub & Sup (xₙᵐ)', latex: 'x_{n}^{m}', preview: 'x_{n}^{m}' },
      { label: 'Parentheses (a+b)', latex: '\\left( a + b \\right)', preview: '\\left( a + b \\right)' },
      { label: 'Brackets [a+b]', latex: '\\left[ a + b \\right]', preview: '\\left[ a + b \\right]' },
      { label: 'Braces {a+b}', latex: '\\left\\{ a + b \\right\\}', preview: '\\left\\{ a + b \\right\\}' },
      { label: 'Absolute Value |x|', latex: '\\left| x \\right|', preview: '\\left| x \\right|' }
    ]
  },
  {
    category: 'Calculus & Operators',
    items: [
      { label: 'Indefinite Integral ∫', latex: '\\int f(x) \\, dx', preview: '\\int f(x) \\, dx' },
      { label: 'Definite Integral ∫ₐᵇ', latex: '\\int_{a}^{b} f(x) \\, dx', preview: '\\int_{a}^{b} f(x) \\, dx' },
      { label: 'Summation ∑', latex: '\\sum_{i=1}^{n} a_i', preview: '\\sum_{i=1}^{n} a_i' },
      { label: 'Product ∏', latex: '\\prod_{i=1}^{n} x_i', preview: '\\prod_{i=1}^{n} x_i' },
      { label: 'Limit lim', latex: '\\lim_{x \\to \\infty} f(x)', preview: '\\lim_{x \\to \\infty} f(x)' },
      { label: 'Derivative dy/dx', latex: '\\frac{dy}{dx}', preview: '\\frac{dy}{dx}' },
      { label: 'Partial Derivative ∂f/∂x', latex: '\\frac{\\partial f}{\\partial x}', preview: '\\frac{\\partial f}{\\partial x}' },
      { label: 'Vector v⃗', latex: '\\vec{v}', preview: '\\vec{v}' }
    ]
  },
  {
    category: 'Greek Letters',
    items: [
      { label: 'Alpha (α)', latex: '\\alpha', preview: '\\alpha' },
      { label: 'Beta (β)', latex: '\\beta', preview: '\\beta' },
      { label: 'Gamma (γ)', latex: '\\gamma', preview: '\\gamma' },
      { label: 'Delta (δ)', latex: '\\delta', preview: '\\delta' },
      { label: 'Epsilon (ε)', latex: '\\epsilon', preview: '\\epsilon' },
      { label: 'Theta (θ)', latex: '\\theta', preview: '\\theta' },
      { label: 'Lambda (λ)', latex: '\\lambda', preview: '\\lambda' },
      { label: 'Mu (μ)', latex: '\\mu', preview: '\\mu' },
      { label: 'Pi (π)', latex: '\\pi', preview: '\\pi' },
      { label: 'Sigma (σ)', latex: '\\sigma', preview: '\\sigma' },
      { label: 'Omega (ω)', latex: '\\omega', preview: '\\omega' },
      { label: 'Capital Delta (Δ)', latex: '\\Delta', preview: '\\Delta' },
      { label: 'Capital Omega (Ω)', latex: '\\Omega', preview: '\\Omega' }
    ]
  },
  {
    category: 'Symbols & Chemistry',
    items: [
      { label: 'Plus-Minus ±', latex: '\\pm', preview: '\\pm' },
      { label: 'Infinity ∞', latex: '\\infty', preview: '\\infty' },
      { label: 'Approx ≈', latex: '\\approx', preview: '\\approx' },
      { label: 'Not Equal ≠', latex: '\\neq', preview: '\\neq' },
      { label: 'Less Than / Equal ≤', latex: '\\le', preview: '\\le' },
      { label: 'Greater Than / Equal ≥', latex: '\\ge', preview: '\\ge' },
      { label: 'Right Arrow →', latex: '\\rightarrow', preview: '\\rightarrow' },
      { label: 'Reversible Arrow ⇌', latex: '\\rightleftharpoons', preview: '\\rightleftharpoons' },
      { label: 'Degree °C', latex: '^{\\circ}\\text{C}', preview: '^{\\circ}\\text{C}' },
      { label: 'Water (H₂O)', latex: '\\text{H}_2\\text{O}', preview: '\\text{H}_2\\text{O}' },
      { label: 'Carbon Dioxide (CO₂)', latex: '\\text{CO}_2', preview: '\\text{CO}_2' }
    ]
  },
  {
    category: 'Matrices & Systems',
    items: [
      { label: '2×2 Matrix', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', preview: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
      { label: '3×3 Matrix', latex: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}', preview: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}' },
      { label: 'Piecewise Cases', latex: 'f(x) = \\begin{cases} x^2 & x \\ge 0 \\\\ -x & x < 0 \\end{cases}', preview: 'f(x) = \\begin{cases} x^2 & x \\ge 0 \\\\ -x & x < 0 \\end{cases}' }
    ]
  }
];

const PRESET_FORMULAS = [
  { name: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { name: 'Pythagorean Theorem', latex: 'a^2 + b^2 = c^2' },
  { name: 'Einstein Energy', latex: 'E = m c^2' },
  { name: 'Normal Distribution', latex: 'f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}' },
  { name: 'Chemical Equilibrium', latex: 'aA + bB \\rightleftharpoons cC + dD' }
];

export const MathTypeModal: React.FC<MathTypeModalProps> = ({
  isOpen,
  onClose,
  onInsertFormula,
  initialFormula = ''
}) => {
  const [latexInput, setLatexInput] = useState(initialFormula || '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
  const [activeTab, setActiveTab] = useState('Fractions & Roots');
  const [isBlockDisplay, setIsBlockDisplay] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialFormula) {
      setLatexInput(initialFormula);
    }
  }, [initialFormula]);

  // Render KaTeX Live Preview
  useEffect(() => {
    if (!previewRef.current) return;
    try {
      setErrorMsg('');
      katex.render(latexInput.trim() || '\\text{Formula Preview}', previewRef.current, {
        displayMode: isBlockDisplay,
        throwOnError: true
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Syntax Error');
    }
  }, [latexInput, isBlockDisplay]);

  if (!isOpen) return null;

  const handleAppendSymbol = (symbolLatex: string) => {
    setLatexInput(prev => `${prev} ${symbolLatex}`.trim());
  };

  const handleInsert = () => {
    if (!latexInput.trim()) return;
    onInsertFormula(latexInput.trim(), isBlockDisplay);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 font-sans animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
              <Sigma className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                MathType Formula Editor
                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                  LaTeX Replica
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Insert mathematical expressions, scientific equations, and chemical symbols.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-white">
          
          {/* Live Rendered KaTeX Preview Box */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold uppercase text-slate-500 tracking-wide">
              Live Equation Typesetting Preview
            </label>
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/70 min-h-[90px] flex items-center justify-center text-slate-900 overflow-x-auto shadow-inner">
              <div ref={previewRef} className="text-lg font-serif" />
            </div>
            {errorMsg && (
              <span className="text-[11px] font-bold text-red-600 block pt-0.5">
                ⚠️ {errorMsg}
              </span>
            )}
          </div>

          {/* Category Tabs */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
              {MATH_TOOLBAR_CATEGORIES.map(cat => (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setActiveTab(cat.category)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === cat.category
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            {/* Symbol Palette Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1 max-h-40 overflow-y-auto pr-1">
              {MATH_TOOLBAR_CATEGORIES.find(c => c.category === activeTab)?.items.map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleAppendSymbol(item.latex)}
                  className="p-2 border border-slate-200/80 rounded-xl bg-white hover:bg-teal-50/60 hover:border-teal-300 text-slate-900 text-xs font-semibold flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer shadow-2xs group"
                >
                  <span className="truncate text-[11px] text-slate-700 group-hover:text-teal-900">{item.label}</span>
                  <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded shrink-0">
                    + Insert
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Preset Formulas */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold uppercase text-slate-500 tracking-wide">
              Preset Quick Equations
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PRESET_FORMULAS.map(pf => (
                <button
                  key={pf.name}
                  type="button"
                  onClick={() => setLatexInput(pf.latex)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all"
                >
                  {pf.name}
                </button>
              ))}
            </div>
          </div>

          {/* Raw LaTeX Input Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-extrabold uppercase text-slate-500 tracking-wide">
                LaTeX Formula Code
              </label>
              <button
                type="button"
                onClick={() => setLatexInput('')}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>
            <textarea
              rows={2}
              value={latexInput}
              onChange={e => setLatexInput(e.target.value)}
              placeholder="Enter or edit LaTeX code e.g. \frac{a}{b}"
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Mode Switch: Inline vs Block Display */}
          <div className="flex items-center justify-between pt-1 text-xs font-semibold text-slate-700 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBlockDisplay}
                onChange={e => setIsBlockDisplay(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span>Display as Block Formula (Centered on new line)</span>
            </label>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-end gap-2 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!latexInput.trim()}
            onClick={handleInsert}
            className="px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> Insert Formula into Editor
          </button>
        </div>
      </div>
    </div>
  );
};
