import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { SymbolCategory } from '@eduforge/shared';
import { KaTeXRenderer } from '../equation/KaTeXRenderer.js';
import { X, Search, Hash } from 'lucide-react';

interface SymbolPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol: (symbol: string, latex: string) => void;
}

export const SymbolPickerModal: React.FC<SymbolPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSymbol
}) => {
  const [categories, setCategories] = useState<SymbolCategory[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      api.getSymbols()
        .then(data => {
          setCategories(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allSymbols = categories.flatMap(cat =>
    cat.symbols.map(s => ({ ...s, categoryId: cat.id, categoryName: cat.name }))
  );

  const filteredSymbols = allSymbols.filter(s => {
    const matchesCat = activeCategory === 'all' || s.categoryId === activeCategory;
    const matchesSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.latex.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Symbols & Character Palette</h3>
              <p className="text-xs text-slate-500">Insert Greek letters, operators, mathematical arrows, and logic notation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search symbols (e.g. alpha, theta, infty, approx)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Symbols ({allSymbols.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Symbols Grid */}
        <div className="p-6 overflow-y-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400">Loading symbols...</div>
          ) : filteredSymbols.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No symbols match "{search}"</div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
              {filteredSymbols.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelectSymbol(item.symbol, item.latex);
                    onClose();
                  }}
                  className="flex flex-col items-center justify-center p-2 h-16 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 rounded-lg transition-all shadow-xs group active:scale-95"
                  title={`${item.name} (${item.latex})`}
                >
                  <span className="text-xl text-slate-800 group-hover:text-indigo-700 font-serif">
                    {item.symbol}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 truncate w-full text-center mt-1">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <span>Click any symbol to insert directly into your document</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-md transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
