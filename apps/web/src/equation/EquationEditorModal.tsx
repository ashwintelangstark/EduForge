import React, { useState, useRef } from 'react';
import { MathAST } from '@eduforge/shared';
import { KaTeXRenderer } from './KaTeXRenderer.js';
import {
  Sigma, X, Check, Copy, Trash2, Sparkles, Layers, Plus
} from 'lucide-react';

interface EquationEditorModalProps {
  isOpen: boolean;
  initialLatex?: string;
  onClose: () => void;
  onSave: (latex: string, ast: MathAST) => void;
}

export const EquationEditorModal: React.FC<EquationEditorModalProps> = ({
  isOpen,
  initialLatex = '',
  onClose,
  onSave
}) => {
  const [latex, setLatex] = useState<string>(initialLatex);
  const [activeTab, setActiveTab] = useState<'visual' | 'presets' | 'latex'>('visual');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  // --- 1. Top Row Symbol Palettes (MathType 7 Standard) ---
  const symbolGroups = [
    {
      name: 'relational',
      title: 'Relational',
      symbols: [
        { latex: '=', tooltip: 'Equal' },
        { latex: '\\neq', tooltip: 'Not Equal' },
        { latex: '<', tooltip: 'Less than' },
        { latex: '>', tooltip: 'Greater than' },
        { latex: '\\leq', tooltip: 'Less or equal' },
        { latex: '\\geq', tooltip: 'Greater or equal' },
        { latex: '\\approx', tooltip: 'Approx' },
        { latex: '\\equiv', tooltip: 'Identical' },
        { latex: '\\pm', tooltip: 'Plus-minus' },
        { latex: '\\mp', tooltip: 'Minus-plus' },
        { latex: '\\times', tooltip: 'Multiplication' },
        { latex: '\\div', tooltip: 'Division' },
        { latex: '\\cdot', tooltip: 'Dot product' }
      ]
    },
    {
      name: 'spaces_dots',
      title: 'Spaces & Dots',
      symbols: [
        { latex: '\\,', tooltip: 'Thin space' },
        { latex: '\\quad', tooltip: 'Quad space' },
        { latex: '\\qquad', tooltip: 'Double space' },
        { latex: '\\dots', tooltip: 'Dots' },
        { latex: '\\cdots', tooltip: 'Center dots' },
        { latex: '\\vdots', tooltip: 'Vertical dots' },
        { latex: '\\ddots', tooltip: 'Diagonal dots' }
      ]
    },
    {
      name: 'accents',
      title: 'Accents & Vectors',
      symbols: [
        { latex: '\\vec{x}', tooltip: 'Vector arrow' },
        { latex: '\\hat{x}', tooltip: 'Unit vector' },
        { latex: '\\dot{x}', tooltip: 'First derivative' },
        { latex: '\\ddot{x}', tooltip: 'Second derivative' },
        { latex: '\\bar{x}', tooltip: 'Overbar' },
        { latex: '\\vec{F}', tooltip: 'Vector Force' },
        { latex: '\\vec{v}', tooltip: 'Vector Velocity' },
        { latex: '\\vec{B}', tooltip: 'Magnetic Field' }
      ]
    },
    {
      name: 'operators',
      title: 'Operators & Sets',
      symbols: [
        { latex: '\\in', tooltip: 'Element of' },
        { latex: '\\notin', tooltip: 'Not in' },
        { latex: '\\subset', tooltip: 'Subset' },
        { latex: '\\cup', tooltip: 'Union' },
        { latex: '\\cap', tooltip: 'Intersection' },
        { latex: '\\emptyset', tooltip: 'Empty set' },
        { latex: '\\forall', tooltip: 'For all' },
        { latex: '\\exists', tooltip: 'Exists' },
        { latex: '\\nabla', tooltip: 'Del / Nabla' },
        { latex: '\\partial', tooltip: 'Partial' },
        { latex: '\\infty', tooltip: 'Infinity' }
      ]
    },
    {
      name: 'arrows',
      title: 'Arrows & Equilibrium',
      symbols: [
        { latex: '\\rightarrow', tooltip: 'Right arrow' },
        { latex: '\\leftarrow', tooltip: 'Left arrow' },
        { latex: '\\leftrightarrow', tooltip: 'Bidirectional' },
        { latex: '\\Rightarrow', tooltip: 'Implies' },
        { latex: '\\Leftrightarrow', tooltip: 'If and only if' },
        { latex: '\\uparrow', tooltip: 'Up' },
        { latex: '\\downarrow', tooltip: 'Down' },
        { latex: '\\rightleftharpoons', tooltip: 'Equilibrium' },
        { latex: '\\xrightarrow{\\Delta}', tooltip: 'Reaction heat' }
      ]
    },
    {
      name: 'greek_lower',
      title: 'Greek Lowercase',
      symbols: [
        { latex: '\\alpha', tooltip: 'alpha' },
        { latex: '\\beta', tooltip: 'beta' },
        { latex: '\\gamma', tooltip: 'gamma' },
        { latex: '\\delta', tooltip: 'delta' },
        { latex: '\\varepsilon', tooltip: 'epsilon' },
        { latex: '\\theta', tooltip: 'theta' },
        { latex: '\\lambda', tooltip: 'lambda' },
        { latex: '\\mu', tooltip: 'mu' },
        { latex: '\\pi', tooltip: 'pi' },
        { latex: '\\rho', tooltip: 'rho' },
        { latex: '\\sigma', tooltip: 'sigma' },
        { latex: '\\tau', tooltip: 'tau' },
        { latex: '\\phi', tooltip: 'phi' },
        { latex: '\\psi', tooltip: 'psi' },
        { latex: '\\omega', tooltip: 'omega' }
      ]
    },
    {
      name: 'greek_upper',
      title: 'Greek Uppercase',
      symbols: [
        { latex: '\\Gamma', tooltip: 'Gamma' },
        { latex: '\\Delta', tooltip: 'Delta' },
        { latex: '\\Theta', tooltip: 'Theta' },
        { latex: '\\Lambda', tooltip: 'Lambda' },
        { latex: '\\Sigma', tooltip: 'Sigma' },
        { latex: '\\Phi', tooltip: 'Phi' },
        { latex: '\\Psi', tooltip: 'Psi' },
        { latex: '\\Omega', tooltip: 'Omega' }
      ]
    }
  ];

  // --- 2. Second Row Template Palettes (MathType 7 Standard) ---
  const templates = [
    { latex: '\\frac{a}{b}', snippet: '\\frac{a}{b}', tooltip: 'Fraction' },
    { latex: '\\frac{\\partial y}{\\partial x}', snippet: '\\frac{\\partial y}{\\partial x}', tooltip: 'Partial Derivative' },
    { latex: '\\sqrt{x}', snippet: '\\sqrt{x}', tooltip: 'Square Root' },
    { latex: '\\sqrt[n]{x}', snippet: '\\sqrt[n]{x}', tooltip: 'N-th Root' },
    { latex: 'x^{n}', snippet: 'x^{n}', tooltip: 'Superscript Power' },
    { latex: 'x_{n}', snippet: 'x_{n}', tooltip: 'Subscript Index' },
    { latex: 'x_{i}^{n}', snippet: 'x_{i}^{n}', tooltip: 'Sub & Superscript' },
    { latex: '\\left( x \\right)', snippet: '\\left( x \\right)', tooltip: 'Parentheses' },
    { latex: '\\left[ x \\right]', snippet: '\\left[ x \\right]', tooltip: 'Square Brackets' },
    { latex: '\\left\\{ x \\right\\}', snippet: '\\left\\{ x \\right\\}', tooltip: 'Curly Braces' },
    { latex: '|x|', snippet: '\\left| x \\right|', tooltip: 'Modulus' },
    { latex: '\\left( \\frac{a}{b} \\right)', snippet: '\\left( \\frac{a}{b} \\right)', tooltip: 'Fraction in Brackets' },
    { latex: '\\sum_{i=1}^{n} x_i', snippet: '\\sum_{i=1}^{n} x_i', tooltip: 'Summation' },
    { latex: '\\prod_{i=1}^{n} x_i', snippet: '\\prod_{i=1}^{n} x_i', tooltip: 'Product' },
    { latex: '\\int_{a}^{b} f(x)\\,dx', snippet: '\\int_{a}^{b} f(x)\\,dx', tooltip: 'Definite Integral' },
    { latex: '\\int f(x)\\,dx', snippet: '\\int f(x)\\,dx', tooltip: 'Indefinite Integral' },
    { latex: '\\iint_S dA', snippet: '\\iint_{S} dA', tooltip: 'Double Integral' },
    { latex: '\\oint_C \\vec{B} \\cdot d\\vec{l}', snippet: '\\oint_{C} \\vec{B} \\cdot d\\vec{l}', tooltip: 'Contour Integral' },
    { latex: '\\lim_{x \\to 0} f(x)', snippet: '\\lim_{x \\to 0} f(x)', tooltip: 'Limit' },
    { latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}', snippet: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}', tooltip: '2x2 Matrix' },
    { latex: '\\begin{bmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{bmatrix}', snippet: '\\begin{bmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{bmatrix}', tooltip: '3x3 Matrix' },
    { latex: '\\begin{cases} x + y = 1 \\\\ x - y = 0 \\end{cases}', snippet: '\\begin{cases} x + y = 1 \\\\ x - y = 0 \\end{cases}', tooltip: 'System Equations' }
  ];

  // --- 3. Preset Formulas ---
  const presetFormulas = [
    { title: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', subject: 'Math' },
    { title: 'Euler Identity', latex: 'e^{i\\pi} + 1 = 0', subject: 'Math' },
    { title: 'Binomial Theorem', latex: '(a + b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k', subject: 'Math' },
    { title: 'Gaussian Integral', latex: '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}', subject: 'Math' },
    { title: 'Coulomb Law', latex: 'F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{|q_1 q_2|}{r^2}', subject: 'Physics' },
    { title: 'Photoelectric Effect', latex: 'h\\nu = \\Phi + \\frac{1}{2}m v_{\\max}^2', subject: 'Physics' },
    { title: 'de Broglie Wavelength', latex: '\\lambda = \\frac{h}{p} = \\frac{h}{mv} = \\frac{h}{\\sqrt{2mE_k}}', subject: 'Physics' },
    { title: 'Nernst Equation', latex: 'E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{2.303 RT}{nF} \\log_{10} Q', subject: 'Chemistry' },
    { title: 'Arrhenius Rate', latex: 'k = A e^{-\\frac{E_a}{RT}}', subject: 'Chemistry' }
  ];

  const handleInsertSnippet = (snippet: string) => {
    setLatex(prev => (prev.trim() ? `${prev.trim()} ${snippet}` : snippet));
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!latex.trim()) {
      alert('Please enter a LaTeX math equation');
      return;
    }
    const defaultAst: MathAST = {
      version: '1.0',
      nodes: [],
      rawLatex: latex.trim()
    };
    onSave(latex.trim(), defaultAst);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-100/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Sigma className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                MathType Visual Equation Editor
              </h3>
              <p className="text-xs text-slate-500 font-medium">Construct mathematical equations using visual symbol palettes & structural templates</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Equation Board */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col items-center justify-center min-h-[120px]">
          <div className="w-full max-w-3xl bg-white border-2 border-slate-300 rounded-xl p-4 shadow-inner flex flex-col items-center justify-center min-h-[75px] relative group">
            {latex ? (
              <div className="text-xl md:text-2xl text-slate-900 font-serif overflow-x-auto w-full text-center py-1">
                <KaTeXRenderer math={latex} block={true} />
              </div>
            ) : (
              <div className="text-slate-400 italic text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-slate-300" />
                <span>Click any symbol or template below to begin building your equation...</span>
              </div>
            )}

            {latex && (
              <button
                type="button"
                onClick={() => setLatex('')}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Clear Equation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-white gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'visual'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sigma className="w-3.5 h-3.5" /> Visual Palettes (MathType Standard)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'presets'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Standard STEM Formulas
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('latex')}
            className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'latex'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Raw LaTeX Syntax
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 max-h-[380px] bg-slate-50/50 space-y-4">
          {activeTab === 'visual' && (
            <div className="space-y-4">
              
              {/* Templates */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900 mb-2 block flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" /> Structure Templates (Fractions, Roots, Integrals, Matrices)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {templates.map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertSnippet(t.snippet)}
                      className="flex flex-col items-center justify-center p-2 h-14 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-400 rounded-lg transition-all text-slate-800 shadow-2xs hover:shadow-sm active:scale-95 group cursor-pointer"
                      title={t.tooltip}
                    >
                      <div className="scale-90 group-hover:scale-100 transition-transform">
                        <KaTeXRenderer math={t.latex} />
                      </div>
                      <span className="text-[9px] text-slate-400 group-hover:text-indigo-700 mt-0.5 truncate w-full text-center">
                        {t.tooltip}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Symbols */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block flex items-center gap-1.5">
                  <Sigma className="w-3.5 h-3.5 text-slate-600" /> Symbol & Greek Palettes
                </span>
                <div className="space-y-2.5">
                  {symbolGroups.map(grp => (
                    <div key={grp.name} className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-50/80 border border-slate-200/60 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight min-w-[80px]">
                        {grp.title}:
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {grp.symbols.map((sym, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleInsertSnippet(sym.latex)}
                            className="px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 rounded text-xs text-slate-800 transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer font-serif"
                            title={sym.tooltip}
                          >
                            <KaTeXRenderer math={sym.latex} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presetFormulas.map((form, fIdx) => (
                <div
                  key={fIdx}
                  onClick={() => handleInsertSnippet(form.latex)}
                  className="p-3.5 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-400 rounded-xl transition-all cursor-pointer shadow-xs group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-800">
                      {form.title}
                    </span>
                    <span className="text-[10px] bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-700 font-bold px-1.5 py-0.2 rounded">
                      {form.subject}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center overflow-x-auto text-sm">
                    <KaTeXRenderer math={form.latex} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'latex' && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                Direct LaTeX Input Expression
              </label>
              <textarea
                ref={textareaRef}
                value={latex}
                onChange={e => setLatex(e.target.value)}
                rows={4}
                placeholder="Type or paste LaTeX math string (e.g. \frac{-b \pm \sqrt{b^2 - 4ac}}{2a})"
                className="w-full font-mono text-xs p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-100/90 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLatex}
              className="px-3 py-1.5 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied LaTeX!' : 'Copy LaTeX'}</span>
            </button>
            <span className="text-slate-400 font-mono text-[11px] truncate max-w-xs hidden sm:inline">
              {latex || 'No equation'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Insert Equation</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
