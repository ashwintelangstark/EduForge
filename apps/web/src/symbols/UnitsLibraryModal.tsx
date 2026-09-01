import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Unit } from '@eduforge/shared';
import { X, Search, Gauge, Sparkles } from 'lucide-react';

interface UnitsLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertUnit: (symbol: string, name: string) => void;
}

export const UnitsLibraryModal: React.FC<UnitsLibraryModalProps> = ({
  isOpen,
  onClose,
  onInsertUnit
}) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      api.getUnits()
        .then(data => {
          setUnits(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(units.map(u => u.category)));

  const filteredUnits = units.filter(u => {
    const matchesCat = activeCategory === 'all' || u.category === activeCategory;
    const matchesSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.symbol.toLowerCase().includes(search.toLowerCase()) ||
      (u.dimension && u.dimension.toLowerCase().includes(search.toLowerCase())) ||
      (u.siEquivalent && u.siEquivalent.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Units & Metric Prefixes Database</h3>
              <p className="text-xs text-slate-500">SI base units, derived units, dimensions, and metric multipliers</p>
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
              placeholder="Search units (e.g. Newton, Joule, Pascal, micro, giga)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories ({units.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400">Loading units...</div>
          ) : filteredUnits.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No units found matching "{search}"</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredUnits.map(unit => (
                <div
                  key={unit.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/eduforge-item', JSON.stringify({
                      category: 'units',
                      type: 'unit',
                      symbol: unit.symbol,
                      name: unit.name,
                      latex: `\\text{ ${unit.symbol}}`
                    }));
                  }}
                  onClick={() => {
                    onInsertUnit(unit.symbol, unit.name);
                    onClose();
                  }}
                  className="p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-400 rounded-lg transition-all cursor-grab active:cursor-grabbing group flex flex-col justify-between"
                  title="Drag onto paper or click to insert"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xl font-bold font-mono text-slate-800 group-hover:text-amber-700">
                        {unit.symbol}
                      </span>
                      <h4 className="text-xs font-bold text-slate-700 mt-0.5">{unit.name}</h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-500 font-medium">
                      {unit.category}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                    {unit.siEquivalent ? (
                      <span title="SI Equivalent">SI: {unit.siEquivalent}</span>
                    ) : unit.dimension ? (
                      <span>Dim: {unit.dimension}</span>
                    ) : (
                      <span>Metric Prefix</span>
                    )}
                    <span className="text-[9px] text-amber-700 font-bold">Drag / Click</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <span>Click any unit symbol to insert into equation or document</span>
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
