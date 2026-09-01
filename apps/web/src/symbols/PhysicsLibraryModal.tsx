import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { PhysicsChapter, PhysicsSymbol } from '@eduforge/shared';
import { KaTeXRenderer } from '../equation/KaTeXRenderer.js';
import { X, Search, Atom, Sparkles, BookOpen } from 'lucide-react';

interface PhysicsLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSymbol: (symbol: string, latex: string, formula?: string) => void;
}

export const PhysicsLibraryModal: React.FC<PhysicsLibraryModalProps> = ({
  isOpen,
  onClose,
  onInsertSymbol
}) => {
  const [chapters, setChapters] = useState<PhysicsChapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      api.getPhysicsChapters()
        .then(data => {
          setChapters(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allSymbols = chapters.flatMap(ch => ch.symbols);

  const filteredSymbols = allSymbols.filter(s => {
    const matchesChapter = activeChapterId === 'all' || chapters.find(c => c.id === activeChapterId)?.symbols.some(sym => sym.id === s.id);
    const matchesSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.chapter.toLowerCase().includes(search.toLowerCase()) ||
      (s.standardUnit && s.standardUnit.toLowerCase().includes(search.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    return matchesChapter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[88vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Atom className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Physics Library & Constants (23 Chapters)</h3>
              <p className="text-xs text-slate-500">Comprehensive physics symbols, dimensional formulas, SI units, and equations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search physics symbols (e.g. torque, permittivity, velocity, flux)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={activeChapterId}
              onChange={e => setActiveChapterId(e.target.value)}
              className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
            >
              <option value="all">All 23 Chapters ({allSymbols.length} Symbols)</option>
              {chapters.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content List */}
        <div className="p-6 overflow-y-auto min-h-[350px] space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400">Loading physics library...</div>
          ) : filteredSymbols.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No physics symbols found matching your filter</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSymbols.map(sym => (
                <div
                  key={sym.id}
                  className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all flex flex-col justify-between group shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold font-serif px-2.5 py-1 bg-white border border-slate-200 rounded-md text-blue-800 shadow-2xs">
                          {sym.symbol}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 leading-tight">{sym.name}</h4>
                          <span className="text-[11px] text-slate-500">{sym.chapter}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        {sym.standardUnit && (
                          <span className="inline-block text-[11px] font-mono font-semibold px-2 py-0.5 bg-blue-100/70 text-blue-800 rounded">
                            {sym.standardUnit}
                          </span>
                        )}
                        {sym.dimension && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sym.dimension}</div>
                        )}
                      </div>
                    </div>

                    {sym.description && (
                      <p className="text-xs text-slate-600 mb-2 leading-relaxed">{sym.description}</p>
                    )}

                    {sym.commonFormulas && sym.commonFormulas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3 bg-white p-1.5 rounded border border-slate-100">
                        {sym.commonFormulas.map((f, i) => (
                          <span
                            key={i}
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/eduforge-item', JSON.stringify({
                                category: 'physics',
                                type: 'formula',
                                latex: f,
                                name: sym.name,
                                unit: sym.standardUnit
                              }));
                            }}
                            onClick={() => {
                              onInsertSymbol(sym.symbol, sym.latex, f);
                              onClose();
                            }}
                            className="text-xs cursor-grab active:cursor-grabbing hover:bg-blue-100 text-slate-700 px-1.5 py-0.5 rounded transition-colors border border-transparent hover:border-blue-300"
                            title="Drag onto paper or click to insert"
                          >
                            <KaTeXRenderer math={f} />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-1">
                    <span className="text-[10px] text-slate-400 font-mono">LaTeX: \{sym.latex}</span>
                    <button
                      type="button"
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/eduforge-item', JSON.stringify({
                          category: 'physics',
                          type: 'formula',
                          latex: sym.commonFormulas?.[0] || sym.symbol,
                          name: sym.name,
                          unit: sym.standardUnit
                        }));
                      }}
                      onClick={() => {
                        onInsertSymbol(sym.symbol, sym.latex);
                        onClose();
                      }}
                      className="px-3 py-1 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors flex items-center gap-1 active:scale-95 cursor-grab"
                    >
                      <Sparkles className="w-3 h-3" /> Insert / Drag
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <span>Covers Kinematics, Thermodynamics, Electromagnetism, Optics, Modern Physics, and Semiconductors</span>
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
