import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  Atom, FlaskConical, Gauge, Bookmark, ChevronRight, ChevronLeft,
  Search, GripVertical, Plus, Sparkles, HelpCircle
} from 'lucide-react';
import { PhysicsChapter, ChemistryNotation, Unit, ScientificConstant, Question } from '@eduforge/shared';
import { KaTeXRenderer } from '../equation/KaTeXRenderer.js';
import { MathTextRenderer } from '../equation/MathTextRenderer.js';

interface ScienceDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  onInsertFormula?: (latex: string) => void;
  onInsertQuestion?: (question: Question) => void;
}

export const ScienceDrawer: React.FC<ScienceDrawerProps> = ({
  isOpen,
  onToggle,
  onInsertFormula,
  onInsertQuestion
}) => {
  const [activeTab, setActiveTab] = useState<'physics' | 'chemistry' | 'constants' | 'qbank'>('physics');
  const [search, setSearch] = useState('');
  
  const [physicsChapters, setPhysicsChapters] = useState<PhysicsChapter[]>([]);
  const [chemistryNotations, setChemistryNotations] = useState<ChemistryNotation[]>([]);
  const [constants, setConstants] = useState<ScientificConstant[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getPhysicsChapters().catch(() => []),
      api.getChemistryNotations().catch(() => []),
      api.getConstants().catch(() => []),
      api.getQuestions().catch(() => [])
    ]).then(([p, c, consts, q]) => {
      setPhysicsChapters(p);
      setChemistryNotations(c);
      setConstants(consts);
      setQuestions(q);
      setLoading(false);
    });
  }, []);

  const allPhysicsSymbols = React.useMemo(() => {
    return physicsChapters.flatMap(ch => ch.symbols);
  }, [physicsChapters]);

  const filteredPhysics = React.useMemo(() => {
    if (!search.trim()) return allPhysicsSymbols;
    const q = search.toLowerCase();
    return allPhysicsSymbols.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.symbol.toLowerCase().includes(q) ||
      (s.commonFormulas && s.commonFormulas.some((f: string) => f.toLowerCase().includes(q)))
    );
  }, [allPhysicsSymbols, search]);

  const filteredChemistry = React.useMemo(() => {
    if (!search.trim()) return chemistryNotations;
    const q = search.toLowerCase();
    return chemistryNotations.filter(n =>
      n.name.toLowerCase().includes(q) ||
      n.formula.toLowerCase().includes(q) ||
      n.type.toLowerCase().includes(q)
    );
  }, [chemistryNotations, search]);

  const filteredConstants = React.useMemo(() => {
    if (!search.trim()) return constants;
    const q = search.toLowerCase();
    return constants.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  }, [constants, search]);

  const filteredQuestions = React.useMemo(() => {
    if (!search.trim()) return questions;
    const q = search.toLowerCase();
    return questions.filter(item =>
      (item.rawText && item.rawText.toLowerCase().includes(q)) ||
      (item.subject && item.subject.toLowerCase().includes(q)) ||
      (item.topic && item.topic.toLowerCase().includes(q))
    );
  }, [questions, search]);

  const handleDragStart = (e: React.DragEvent, payload: any) => {
    e.dataTransfer.setData('application/eduforge-item', JSON.stringify(payload));
    const textPayload = payload.latex || payload.symbol || payload.value || payload.formula || (payload.questionData ? payload.questionData.rawText : '') || '';
    e.dataTransfer.setData('text/plain', textPayload);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  return (
    <aside
      className={`fixed right-0 top-14 bottom-7 z-40 bg-white text-slate-900 border-l border-slate-300 shadow-2xl transition-all duration-200 flex flex-col ${
        isOpen ? 'w-80 sm:w-96' : 'w-10'
      }`}
    >
      {/* Drawer Toggle Handle */}
      <button
        type="button"
        onClick={onToggle}
        className="absolute -left-7 top-1/2 -translate-y-1/2 w-7 h-16 bg-white hover:bg-slate-100 text-slate-700 border-l border-t border-b border-slate-300 rounded-l-xl flex items-center justify-center shadow-md cursor-pointer transition-colors"
        title={isOpen ? 'Collapse Science Drawer' : 'Expand Science Library Drawer'}
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* When Collapsed View */}
      {!isOpen && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4 cursor-pointer" onClick={onToggle}>
          <Atom className="w-5 h-5 text-sky-600" />
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 [writing-mode:vertical-lr] rotate-180">
            Science Library & Q-Bank
          </span>
          <FlaskConical className="w-5 h-5 text-emerald-600" />
        </div>
      )}

      {/* When Expanded View */}
      {isOpen && (
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-100/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <div>
                <h4 className="text-xs font-black text-slate-900 tracking-tight">Science Library & Drag-Drop</h4>
                <p className="text-[10px] text-slate-500">Drag any formula or question onto the paper</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs">
            {[
              { id: 'physics', label: 'Physics', icon: Atom },
              { id: 'chemistry', label: 'Chemistry', icon: FlaskConical },
              { id: 'constants', label: 'Constants', icon: Gauge },
              { id: 'qbank', label: 'Q-Bank', icon: Bookmark }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 font-bold text-[11px] flex flex-col items-center gap-0.5 border-b-2 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-700 bg-white font-black'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900 bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Content Scroll Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/50">
            
            {/* PHYSICS TAB */}
            {activeTab === 'physics' && (
              <div className="space-y-2">
                {filteredPhysics.map(sym => (
                  <div
                    key={sym.id}
                    draggable={true}
                    onDragStart={e => handleDragStart(e, {
                      category: 'physics',
                      type: 'formula',
                      latex: sym.commonFormulas?.[0] || sym.symbol,
                      name: sym.name,
                      unit: sym.standardUnit
                    })}
                    className="p-2.5 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-400 rounded-xl transition-all shadow-2xs cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500" />
                        <span className="text-xs font-bold text-slate-900 leading-tight">
                          {sym.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-serif font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {sym.symbol}
                      </span>
                    </div>

                    {sym.commonFormulas && sym.commonFormulas.length > 0 && (
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 my-1 overflow-x-auto text-center text-xs">
                        <KaTeXRenderer math={sym.commonFormulas[0]} />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span className="font-mono">{sym.standardUnit || sym.chapter}</span>
                      <button
                        type="button"
                        onClick={() => onInsertFormula && onInsertFormula(sym.commonFormulas?.[0] || sym.symbol)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Insert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CHEMISTRY TAB */}
            {activeTab === 'chemistry' && (
              <div className="space-y-2">
                {filteredChemistry.map(not => (
                  <div
                    key={not.id}
                    draggable={true}
                    onDragStart={e => handleDragStart(e, {
                      category: 'chemistry',
                      type: 'reaction',
                      latex: not.formula,
                      name: not.name
                    })}
                    className="p-2.5 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 rounded-xl transition-all shadow-2xs cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500" />
                        <span className="text-xs font-bold text-slate-900 leading-tight">
                          {not.name}
                        </span>
                      </div>
                      <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                        {not.type}
                      </span>
                    </div>

                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 my-1 overflow-x-auto text-center text-xs">
                      <KaTeXRenderer math={not.formula} />
                    </div>

                    <div className="flex items-center justify-end text-[10px] text-slate-500 pt-1">
                      <button
                        type="button"
                        onClick={() => onInsertFormula && onInsertFormula(not.formula)}
                        className="text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Insert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CONSTANTS TAB */}
            {activeTab === 'constants' && (
              <div className="space-y-2">
                {filteredConstants.map(c => (
                  <div
                    key={c.id}
                    draggable={true}
                    onDragStart={e => handleDragStart(e, {
                      category: 'constants',
                      type: 'constant',
                      latex: `${c.symbol} = ${c.value} \\text{ ${c.unit}}`,
                      name: c.name
                    })}
                    className="p-2.5 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 rounded-xl transition-all shadow-2xs cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500" />
                        <span className="text-xs font-bold text-slate-900 leading-tight">
                          {c.name}
                        </span>
                      </div>
                      <span className="text-xs font-serif font-bold text-amber-800">
                        {c.symbol}
                      </span>
                    </div>

                    <div className="text-xs font-mono font-bold text-slate-700 bg-slate-50 p-1.5 rounded my-1 border border-slate-100 text-center">
                      {c.value} {c.unit}
                    </div>

                    <div className="flex items-center justify-end text-[10px] text-slate-500 pt-1">
                      <button
                        type="button"
                        onClick={() => onInsertFormula && onInsertFormula(`${c.symbol} = ${c.value} \\text{ ${c.unit}}`)}
                        className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Insert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* QUESTION BANK TAB */}
            {activeTab === 'qbank' && (
              <div className="space-y-2">
                {filteredQuestions.map(q => (
                  <div
                    key={q.id}
                    draggable={true}
                    onDragStart={e => handleDragStart(e, {
                      category: 'questions',
                      type: 'question',
                      questionData: q
                    })}
                    className="p-2.5 bg-white hover:bg-sky-50/60 border border-slate-200 hover:border-sky-400 rounded-xl transition-all shadow-2xs cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1">
                        <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500" />
                        <span className="text-[10px] font-bold uppercase text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded">
                          {q.subject || 'Q'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">
                        {q.marks} Marks
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 line-clamp-2 font-medium">
                      <MathTextRenderer text={q.rawText} />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 mt-1.5">
                      <span>{q.difficulty}</span>
                      <button
                        type="button"
                        onClick={() => onInsertQuestion && onInsertQuestion(q)}
                        className="text-sky-700 hover:text-sky-900 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Drop in Paper
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      )}
    </aside>
  );
};
