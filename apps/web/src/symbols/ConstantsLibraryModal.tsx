import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { ScientificConstant } from '@eduforge/shared';
import { KaTeXRenderer } from '../equation/KaTeXRenderer.js';
import { X, Search, Bookmark, Sparkles, Copy, Check } from 'lucide-react';

interface ConstantsLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertConstant: (symbol: string, latex: string, value: string, unit: string) => void;
}

export const ConstantsLibraryModal: React.FC<ConstantsLibraryModalProps> = ({
  isOpen,
  onClose,
  onInsertConstant
}) => {
  const [constants, setConstants] = useState<ScientificConstant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getConstants()
        .then(data => {
          setConstants(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = constants.filter(c => {
    if (!search) return true;
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCopy = (c: ScientificConstant) => {
    const text = `${c.symbol} = ${c.value} ${c.unit}`;
    navigator.clipboard.writeText(text);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Scientific & Physical Constants</h3>
              <p className="text-xs text-slate-500">Universal, electromagnetic, atomic, and thermodynamic constants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search constants (e.g. Planck, Speed of Light, Gravitation, Avogadro)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto min-h-[300px] space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400">Loading constants...</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No constants match "{search}"</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filtered.map(c => (
                <div
                  key={c.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/eduforge-item', JSON.stringify({
                      category: 'constants',
                      type: 'constant',
                      latex: `${c.symbol} = ${c.value} \\text{ ${c.unit}}`,
                      name: c.name,
                      symbol: c.symbol,
                      value: c.value,
                      unit: c.unit
                    }));
                  }}
                  className="p-3.5 bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 rounded-lg transition-all flex flex-col justify-between group shadow-xs cursor-grab active:cursor-grabbing"
                  title="Drag onto paper or click Insert"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold font-serif px-2 py-0.5 bg-white border border-slate-200 rounded text-purple-800">
                          {c.symbol}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 leading-tight">{c.name}</h4>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">{c.category}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(c)}
                        className="p-1 text-slate-400 hover:text-purple-600 rounded transition-colors"
                        title="Copy value"
                      >
                        {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="bg-white p-2 rounded border border-slate-100 my-2 font-mono text-xs text-slate-800 flex items-center justify-between">
                      <span className="font-bold text-purple-950">{c.value}</span>
                      <span className="text-[11px] text-slate-500">{c.unit}</span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed mb-2">{c.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-mono">LaTeX: \{c.latex}</span>
                    <button
                      type="button"
                      onClick={() => {
                        onInsertConstant(c.symbol, c.latex, c.value, c.unit);
                        onClose();
                      }}
                      className="px-3 py-1 text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
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
          <span>CODATA internationally recommended physical values</span>
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
