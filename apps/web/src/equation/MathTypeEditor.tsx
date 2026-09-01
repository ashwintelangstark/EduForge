import React, { useState, useRef } from 'react';
import { KaTeXRenderer } from './KaTeXRenderer.js';
import {
  Sigma, X, Check, Copy, Trash2, Sparkles, Layers,
  Plus, Divide, Superscript, CornerDownLeft, ArrowRight
} from 'lucide-react';

interface MathTypeEditorProps {
  isOpen: boolean;
  initialLatex?: string;
  targetFieldLabel?: string;
  onClose: () => void;
  onInsertEquation: (latex: string) => void;
}

interface SymbolGroup {
  name: string;
  title: string;
  symbols: { latex: string; tooltip: string }[];
}

export const MathTypeEditor: React.FC<MathTypeEditorProps> = ({
  isOpen,
  initialLatex = '',
  targetFieldLabel = 'Active Field',
  onClose,
  onInsertEquation
}) => {
  const [latex, setLatex] = useState<string>(initialLatex);
  const [activeTab, setActiveTab] = useState<'visual' | 'fraction_builder' | 'structure_slots' | 'presets' | 'latex'>('visual');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- SEPARATE NUMERATOR & DENOMINATOR STATE ---
  const [numerator, setNumerator] = useState<string>('u^2 \\sin 2\\theta');
  const [denominator, setDenominator] = useState<string>('2g');
  const [fractionType, setFractionType] = useState<'standard' | 'derivative' | 'partial' | 'slash'>('standard');

  // --- SEPARATE POWER / SUBSCRIPT STATE ---
  const [baseVal, setBaseVal] = useState<string>('x');
  const [subscriptVal, setSubscriptVal] = useState<string>('i');
  const [powerVal, setPowerVal] = useState<string>('2');

  // --- SEPARATE RADICAL STATE ---
  const [rootIndex, setRootIndex] = useState<string>('');
  const [radicandVal, setRadicandVal] = useState<string>('b^2 - 4ac');

  // --- SEPARATE INTEGRAL STATE ---
  const [intLower, setIntLower] = useState<string>('0');
  const [intUpper, setIntUpper] = useState<string>('\\pi / 2');
  const [intIntegrand, setIntIntegrand] = useState<string>('\\sin^2 x');
  const [intVar, setIntVar] = useState<string>('x');

  if (!isOpen) return null;

  // --- Top Row Symbol Palettes (MathType 7 Standard) ---
  const symbolGroups: SymbolGroup[] = [
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

  // Quick structure templates
  const structureTemplates = [
    { latex: '\\frac{a}{b}', snippet: '\\frac{a}{b}', tooltip: 'Standard Fraction' },
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

  // STEM Presets
  const presetFormulas = [
    { title: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', subject: 'Math' },
    { title: 'Euler Identity', latex: 'e^{i\\pi} + 1 = 0', subject: 'Math' },
    { title: 'Binomial Theorem', latex: '(a + b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k', subject: 'Math' },
    { title: 'Gaussian Integral', latex: '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}', subject: 'Math' },
    { title: 'Coulomb Law', latex: 'F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{|q_1 q_2|}{r^2}', subject: 'Physics' },
    { title: 'Photoelectric Effect', latex: 'h\\nu = \\Phi + \\frac{1}{2}m v_{\\max}^2', subject: 'Physics' },
    { title: 'de Broglie Wavelength', latex: '\\lambda = \\frac{h}{p} = \\frac{h}{mv} = \\frac{h}{\\sqrt{2mE_k}}', subject: 'Physics' },
    { title: 'Lorentz Force', latex: '\\vec{F} = q(\\vec{E} + \\vec{v} \\times \\vec{B})', subject: 'Physics' },
    { title: 'Nernst Equation', latex: 'E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{2.303 RT}{nF} \\log_{10} Q', subject: 'Chemistry' },
    { title: 'Arrhenius Rate', latex: 'k = A e^{-\\frac{E_a}{RT}}', subject: 'Chemistry' }
  ];

  const handleInsertSnippet = (snippet: string) => {
    setLatex(prev => (prev.trim() ? `${prev.trim()} ${snippet}` : snippet));
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Generate fraction from separate numerator and denominator
  const getConstructedFraction = () => {
    const num = numerator.trim() || 'a';
    const den = denominator.trim() || 'b';
    if (fractionType === 'derivative') return `\\frac{d (${num})}{d (${den})}`;
    if (fractionType === 'partial') return `\\frac{\\partial (${num})}{\\partial (${den})}`;
    if (fractionType === 'slash') return `(${num}) / (${den})`;
    return `\\frac{${num}}{${den}}`;
  };

  const handleInsertConstructedFraction = () => {
    const frac = getConstructedFraction();
    handleInsertSnippet(frac);
  };

  const handleInsertConstructedPower = () => {
    const b = baseVal.trim() || 'x';
    const sub = subscriptVal.trim();
    const sup = powerVal.trim();
    let res = b;
    if (sub) res += `_{${sub}}`;
    if (sup) res += `^{${sup}}`;
    handleInsertSnippet(res);
  };

  const handleInsertConstructedRadical = () => {
    const rad = radicandVal.trim() || 'x';
    const idx = rootIndex.trim();
    if (idx) {
      handleInsertSnippet(`\\sqrt[${idx}]{${rad}}`);
    } else {
      handleInsertSnippet(`\\sqrt{${rad}}`);
    }
  };

  const handleInsertConstructedIntegral = () => {
    const low = intLower.trim();
    const up = intUpper.trim();
    const integrand = intIntegrand.trim() || 'f(x)';
    const v = intVar.trim() || 'x';
    let res = '\\int';
    if (low) res += `_{${low}}`;
    if (up) res += `^{${up}}`;
    res += ` ${integrand}\\,d${v}`;
    handleInsertSnippet(res);
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!latex.trim()) {
      alert('Please enter or construct a math equation first.');
      return;
    }
    onInsertEquation(latex.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* MathType Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-100/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Sigma className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  MathType Visual Equation & Fraction Editor
                </h3>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  Target: {targetFieldLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Edit numerator, denominator, powers, and roots separately with visual preview</p>
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

        {/* Live Equation Display Board */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col items-center justify-center min-h-[110px]">
          <div className="w-full max-w-3xl bg-white border-2 border-indigo-200 rounded-xl p-3 shadow-inner flex flex-col items-center justify-center min-h-[70px] relative group">
            {latex ? (
              <div className="text-xl md:text-2xl text-slate-900 font-serif overflow-x-auto w-full text-center py-1">
                <KaTeXRenderer math={latex} block={true} />
              </div>
            ) : (
              <div className="text-slate-400 italic text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-slate-300" />
                <span>Click any symbol, fraction slot, or template below to build your formula...</span>
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

        {/* MathType Toolbar Tab Navigation */}
        <div className="flex flex-wrap items-center border-b border-slate-200 px-6 bg-white gap-1 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'visual'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sigma className="w-3.5 h-3.5" /> Symbol & Template Palettes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fraction_builder')}
            className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'fraction_builder'
                ? 'border-indigo-600 text-indigo-700 font-black bg-indigo-50/40 rounded-t'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Divide className="w-3.5 h-3.5 text-indigo-600" /> Numerator / Denominator Slot Editor
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('structure_slots')}
            className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'structure_slots'
                ? 'border-indigo-600 text-indigo-700 font-black bg-indigo-50/40 rounded-t'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Superscript className="w-3.5 h-3.5 text-indigo-600" /> Powers, Roots & Integrals Slots
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'presets'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> STEM Presets
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('latex')}
            className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'latex'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Raw LaTeX
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 max-h-[380px] bg-slate-50/50 space-y-4">
          
          {/* TAB 1: VISUAL TWO-TIER PALETTES */}
          {activeTab === 'visual' && (
            <div className="space-y-4">
              {/* Structure templates */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" /> Quick Templates (Click to insert or use Slot Editor above)
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('fraction_builder')}
                    className="text-[10px] text-indigo-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    Open Separate Num/Den Editor <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {structureTemplates.map((t, idx) => (
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

              {/* Symbol palettes */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 block flex items-center gap-1.5">
                  <Sigma className="w-3.5 h-3.5 text-slate-600" /> Symbol & Greek Palettes
                </span>
                <div className="space-y-2">
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

          {/* TAB 2: SEPARATE NUMERATOR & DENOMINATOR BUILDER */}
          {activeTab === 'fraction_builder' && (
            <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
                    <Divide className="w-4 h-4 text-indigo-600" /> Fraction Slot Editor (Edit Numerator & Denominator Separately)
                  </h4>
                  <p className="text-xs text-slate-500">Type whatever expression you want in the Top (Numerator) and Bottom (Denominator) boxes below</p>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="font-bold text-slate-600">Style:</span>
                  <select
                    value={fractionType}
                    onChange={e => setFractionType(e.target.value as any)}
                    className="p-1 border border-slate-300 rounded font-bold text-xs bg-slate-50 text-slate-900 cursor-pointer"
                  >
                    <option value="standard">Standard \frac&#123;N&#125;&#123;D&#125;</option>
                    <option value="derivative">Derivative \frac&#123;dN&#125;&#123;dD&#125;</option>
                    <option value="partial">Partial \frac&#123;\partial N&#125;&#123;\partial D&#125;</option>
                    <option value="slash">Inline (N) / (D)</option>
                  </select>
                </div>
              </div>

              {/* Live Interactive Fraction Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  
                  {/* Numerator Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span> Numerator (Top Slot)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">LaTeX / Variables</span>
                    </div>
                    <input
                      type="text"
                      value={numerator}
                      onChange={e => setNumerator(e.target.value)}
                      placeholder="e.g. u^2 \sin 2\theta, -b \pm \sqrt{b^2 - 4ac}, q_1 q_2"
                      className="w-full font-mono text-sm font-bold p-2.5 bg-white border-2 border-indigo-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                    {/* Quick Numerator Symbols */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['x^2', '\\sqrt{x}', '\\sin\\theta', '\\cos\\theta', '\\Delta', '\\pi', '\\pm', '\\alpha', 'q_1 q_2'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNumerator(prev => (prev ? `${prev} ${s}` : s))}
                          className="px-1.5 py-0.5 bg-white hover:bg-indigo-100 border border-slate-200 rounded text-[11px] font-mono text-slate-700 cursor-pointer"
                        >
                          +{s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Horizontal Fraction Bar Separator */}
                  <div className="h-0.5 bg-indigo-400 rounded-full w-full my-2"></div>

                  {/* Denominator Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span> Denominator (Bottom Slot)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">LaTeX / Variables</span>
                    </div>
                    <input
                      type="text"
                      value={denominator}
                      onChange={e => setDenominator(e.target.value)}
                      placeholder="e.g. 2g, 4\pi\varepsilon_0 r^2, 2a, dx"
                      className="w-full font-mono text-sm font-bold p-2.5 bg-white border-2 border-indigo-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                    {/* Quick Denominator Symbols */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['2g', '4\\pi\\varepsilon_0 r^2', '2a', 'dx', 'dt', 'r^2', 'n', '\\lambda'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setDenominator(prev => (prev ? `${prev} ${s}` : s))}
                          className="px-1.5 py-0.5 bg-white hover:bg-indigo-100 border border-slate-200 rounded text-[11px] font-mono text-slate-700 cursor-pointer"
                        >
                          +{s}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Live Visual Preview Card & Insert Action */}
                <div className="flex flex-col items-center justify-center p-6 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-4">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-900">
                    Constructed Fraction Output:
                  </span>
                  
                  <div className="p-4 bg-white border-2 border-indigo-200 rounded-xl shadow-xs text-xl md:text-2xl text-center min-w-[200px] overflow-x-auto">
                    <KaTeXRenderer math={getConstructedFraction()} block={true} />
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200 truncate max-w-xs">
                    {getConstructedFraction()}
                  </div>

                  <button
                    type="button"
                    onClick={handleInsertConstructedFraction}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer text-xs"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Insert Fraction into Main Equation</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: POWERS, ROOTS & INTEGRALS SLOTS */}
          {activeTab === 'structure_slots' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Power / Subscript Slot Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                  <Superscript className="w-3.5 h-3.5 text-indigo-600" /> Base, Sub & Power
                </h5>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Base Variable:</label>
                    <input
                      type="text"
                      value={baseVal}
                      onChange={e => setBaseVal(e.target.value)}
                      className="w-full font-mono p-1.5 border border-slate-300 rounded font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Subscript (_):</label>
                      <input
                        type="text"
                        value={subscriptVal}
                        onChange={e => setSubscriptVal(e.target.value)}
                        className="w-full font-mono p-1.5 border border-slate-300 rounded font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Power (^):</label>
                      <input
                        type="text"
                        value={powerVal}
                        onChange={e => setPowerVal(e.target.value)}
                        className="w-full font-mono p-1.5 border border-slate-300 rounded font-bold"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-center text-lg">
                  <KaTeXRenderer math={`${baseVal || 'x'}_{${subscriptVal || ''}}^{${powerVal || ''}}`} />
                </div>
                <button
                  type="button"
                  onClick={handleInsertConstructedPower}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Insert Power / Subscript
                </button>
              </div>

              {/* Radical / N-th Root Slot Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                  <span className="font-serif">√</span> Root & Radicand Slot
                </h5>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Root Index (leave blank for square root):</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 for cube root, n"
                      value={rootIndex}
                      onChange={e => setRootIndex(e.target.value)}
                      className="w-full font-mono p-1.5 border border-slate-300 rounded font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Radicand Expression:</label>
                    <input
                      type="text"
                      value={radicandVal}
                      onChange={e => setRadicandVal(e.target.value)}
                      className="w-full font-mono p-1.5 border border-slate-300 rounded font-bold"
                    />
                  </div>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-center text-lg">
                  <KaTeXRenderer math={rootIndex ? `\\sqrt[${rootIndex}]{${radicandVal}}` : `\\sqrt{${radicandVal}}`} />
                </div>
                <button
                  type="button"
                  onClick={handleInsertConstructedRadical}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Insert Root
                </button>
              </div>

              {/* Definite Integral Slot Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                  <span className="font-serif">∫</span> Integral Slots
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Lower Bound:</label>
                      <input
                        type="text"
                        value={intLower}
                        onChange={e => setIntLower(e.target.value)}
                        className="w-full font-mono p-1 border border-slate-300 rounded font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Upper Bound:</label>
                      <input
                        type="text"
                        value={intUpper}
                        onChange={e => setIntUpper(e.target.value)}
                        className="w-full font-mono p-1 border border-slate-300 rounded font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Integrand & Variable:</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={intIntegrand}
                        onChange={e => setIntIntegrand(e.target.value)}
                        className="flex-1 font-mono p-1 border border-slate-300 rounded font-bold"
                      />
                      <input
                        type="text"
                        value={intVar}
                        onChange={e => setIntVar(e.target.value)}
                        className="w-12 font-mono p-1 border border-slate-300 rounded font-bold text-center"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-center text-lg">
                  <KaTeXRenderer math={`\\int_{${intLower}}^{${intUpper}} ${intIntegrand}\\,d${intVar}`} />
                </div>
                <button
                  type="button"
                  onClick={handleInsertConstructedIntegral}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Insert Integral
                </button>
              </div>

            </div>
          )}

          {/* TAB 4: STEM PRESETS */}
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

          {/* TAB 5: RAW LATEX */}
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

        {/* MathType Action Footer */}
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
              onClick={handleApply}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Insert into {targetFieldLabel}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
