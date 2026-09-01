import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { ChemistryElement, ChemistryNotation } from '@eduforge/shared';
import { KaTeXRenderer } from '../equation/KaTeXRenderer.js';
import { X, Search, FlaskConical, Sparkles, Grid } from 'lucide-react';

interface ChemistryLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertChemistry: (formula: string, latex: string) => void;
}

export const ChemistryLibraryModal: React.FC<ChemistryLibraryModalProps> = ({
  isOpen,
  onClose,
  onInsertChemistry
}) => {
  const [elements, setElements] = useState<ChemistryElement[]>([]);
  const [notations, setNotations] = useState<ChemistryNotation[]>([]);
  const [activeTab, setActiveTab] = useState<'notations' | 'elements'>('notations');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      Promise.all([api.getChemistryElements(), api.getChemistryNotations()])
        .then(([elems, nots]) => {
          setElements(elems);
          setNotations(nots);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredNotations = notations.filter(n => {
    if (!search) return true;
    return (
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.formula.toLowerCase().includes(search.toLowerCase()) ||
      n.type.toLowerCase().includes(search.toLowerCase()) ||
      (n.description && n.description.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const filteredElements = elements.filter(e => {
    if (!search) return true;
    return (
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.symbol.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[88vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Chemistry Library & Periodic Table</h3>
              <p className="text-xs text-slate-500">Chemical formulas, reaction arrows, equilibrium equations, ions, and elements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('notations')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeTab === 'notations' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reactions & Notations ({notations.length})
            </button>
            <button
              onClick={() => setActiveTab('elements')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeTab === 'elements' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Periodic Elements ({elements.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search chemistry (e.g. H2SO4, Haber, arrow)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto min-h-[350px]">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400">Loading chemistry library...</div>
          ) : activeTab === 'notations' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredNotations.map(not => (
                <div
                  key={not.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/eduforge-item', JSON.stringify({
                      category: 'chemistry',
                      type: 'reaction',
                      latex: not.latex || not.formula,
                      name: not.name
                    }));
                  }}
                  onClick={() => {
                    onInsertChemistry(not.formula, not.latex);
                    onClose();
                  }}
                  className="p-3 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 rounded-lg transition-all cursor-grab active:cursor-grabbing group flex flex-col justify-between"
                  title="Drag onto paper or click to insert"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-700">
                        {not.type}
                      </span>
                      <Sparkles className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500" />
                    </div>
                    <div className="text-center py-2 bg-white rounded border border-slate-100 mb-2 overflow-x-auto">
                      <KaTeXRenderer math={not.latex} block={false} className="text-emerald-950 font-bold" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">{not.name}</h4>
                    {not.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{not.description}</p>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono truncate flex items-center justify-between">
                    <span>Formula: {not.formula}</span>
                    <span className="text-[9px] text-emerald-600 font-bold">Drag / Click</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
              {filteredElements.map(el => (
                <button
                  key={el.symbol}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/eduforge-item', JSON.stringify({
                      category: 'chemistry',
                      type: 'element',
                      latex: `\\text{${el.symbol}}`,
                      name: el.name
                    }));
                  }}
                  onClick={() => {
                    onInsertChemistry(el.symbol, `\\text{${el.symbol}}`);
                    onClose();
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-lg flex flex-col items-center justify-between text-center transition-all group active:scale-95 cursor-grab"
                  title={`${el.name} (Atomic Weight: ${el.atomicMass}) - Drag onto paper`}
                >
                  <div className="w-full flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>{el.atomicNumber}</span>
                    <span>{el.atomicMass}</span>
                  </div>
                  <span className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 font-serif my-1">
                    {el.symbol}
                  </span>
                  <span className="text-[10px] font-medium text-slate-600 truncate w-full">
                    {el.name}
                  </span>
                  <span className="text-[9px] text-emerald-600/80 uppercase tracking-tighter truncate w-full mt-0.5">
                    {el.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <span>Supports inorganic stoichiometry, equilibrium arrows, organic functional groups, and states of matter</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-md transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
