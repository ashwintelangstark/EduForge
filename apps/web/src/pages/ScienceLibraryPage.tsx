import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  Atom, FlaskConical, Gauge, Bookmark, ArrowLeft, Search, Sparkles
} from 'lucide-react';
import {
  PhysicsChapter, ChemistryElement, ChemistryNotation, Unit, MetricPrefix, ScientificConstant
} from '@eduforge/shared';
import { api } from '../services/api.js';
import { KaTeXRenderer } from '../equation/KaTeXRenderer.js';

interface ScienceLibraryPageProps {
  onBackToDashboard: () => void;
}

// Memoized Chapter Card for max 120fps scrolling
const PhysicsChapterCard = memo(({ ch }: { ch: PhysicsChapter }) => (
  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs transition-all" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' }}>
    <h3 className="text-sm font-bold mb-2 border-b border-slate-100 pb-1 flex justify-between text-slate-900">
      <span>{ch.name}</span>
      <span className="text-xs font-semibold text-sky-700">
        {ch.symbols.length} symbols
      </span>
    </h3>
    <div className="space-y-2">
      {ch.symbols.map((s: any) => (
        <div key={s.id} className="text-xs flex items-start justify-between p-2 rounded-lg border border-slate-200 bg-slate-50">
          <div>
            <strong className="font-serif text-sm mr-2 text-slate-900 font-bold">{s.symbol}</strong>
            <span className="font-semibold text-slate-800">{s.name}</span>
            {s.description && <p className="text-[11px] mt-0.5 text-slate-500">{s.description}</p>}
          </div>
          {s.standardUnit && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border bg-white text-slate-700 border-slate-200">
              {s.standardUnit}
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
));

export const ScienceLibraryPage: React.FC<ScienceLibraryPageProps> = ({
  onBackToDashboard
}) => {
  const [activeTab, setActiveTab] = useState<'physics' | 'chemistry' | 'units' | 'constants'>('physics');
  const [physicsChapters, setPhysicsChapters] = useState<PhysicsChapter[]>([]);
  const [elements, setElements] = useState<ChemistryElement[]>([]);
  const [notations, setNotations] = useState<ChemistryNotation[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [prefixes, setPrefixes] = useState<MetricPrefix[]>([]);
  const [constants, setConstants] = useState<ScientificConstant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      api.getPhysicsChapters(),
      api.getChemistryElements(),
      api.getChemistryNotations(),
      api.getUnits(),
      api.getPrefixes(),
      api.getConstants()
    ]).then(([p, e, n, u, pref, c]) => {
      if (!isMounted) return;
      setPhysicsChapters(Array.isArray(p) ? p : []);
      setElements(Array.isArray(e) ? e : []);
      setNotations(Array.isArray(n) ? n : []);
      setUnits(Array.isArray(u) ? u : ((u as any)?.units || []));
      setPrefixes(Array.isArray(pref) ? pref : ((u as any)?.prefixes || []));
      setConstants(Array.isArray(c) ? c : []);
      setLoading(false);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  // Ultra-fast instant memoized search filters
  const filteredChapters = useMemo(() => {
    const arr = Array.isArray(physicsChapters) ? physicsChapters : [];
    if (!searchQuery.trim()) return arr;
    const q = searchQuery.toLowerCase();
    return arr.filter(ch => 
      ch.name.toLowerCase().includes(q) ||
      ch.symbols.some(s => s.name.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q)))
    );
  }, [physicsChapters, searchQuery]);

  const filteredElements = useMemo(() => {
    const arr = Array.isArray(elements) ? elements : [];
    if (!searchQuery.trim()) return arr;
    const q = searchQuery.toLowerCase();
    return arr.filter(el =>
      el.name.toLowerCase().includes(q) ||
      el.symbol.toLowerCase().includes(q) ||
      String(el.atomicNumber).includes(q)
    );
  }, [elements, searchQuery]);

  const filteredNotations = useMemo(() => {
    const arr = Array.isArray(notations) ? notations : [];
    if (!searchQuery.trim()) return arr;
    const q = searchQuery.toLowerCase();
    return arr.filter(n =>
      n.name.toLowerCase().includes(q) ||
      n.formula.toLowerCase().includes(q) ||
      n.type.toLowerCase().includes(q)
    );
  }, [notations, searchQuery]);

  const filteredUnits = useMemo(() => {
    const arr = Array.isArray(units) ? units : [];
    if (!searchQuery.trim()) return arr;
    const q = searchQuery.toLowerCase();
    return arr.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.symbol.toLowerCase().includes(q) ||
      (u.category && u.category.toLowerCase().includes(q)) ||
      (u.dimension && u.dimension.toLowerCase().includes(q)) ||
      (u.siEquivalent && u.siEquivalent.toLowerCase().includes(q))
    );
  }, [units, searchQuery]);

  const filteredPrefixes = useMemo(() => {
    const arr = Array.isArray(prefixes) ? prefixes : [];
    if (!searchQuery.trim()) return arr;
    const q = searchQuery.toLowerCase();
    return arr.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.symbol.toLowerCase().includes(q) ||
      p.factor.toLowerCase().includes(q) ||
      String(p.power).includes(q)
    );
  }, [prefixes, searchQuery]);

  const filteredConstants = useMemo(() => {
    const arr = Array.isArray(constants) ? constants : [];
    if (!searchQuery.trim()) return arr;
    const q = searchQuery.toLowerCase();
    return arr.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q) ||
      (c.category && c.category.toLowerCase().includes(q))
    );
  }, [constants, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 rounded-lg transition-colors hover:bg-slate-100 text-slate-700 cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">
            <Atom className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Scientific Reference Libraries</h1>
            <p className="text-xs text-slate-500">Physics, Chemistry, SI Units, Prefixes, and Constants database</p>
          </div>
        </div>

        {/* Real-time Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter symbols, formulas, units, prefixes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('physics')}
          className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'physics'
              ? 'border-sky-600 text-sky-700 bg-sky-50/40 rounded-t-lg font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Atom className="w-4 h-4 text-sky-600" /> Physics ({filteredChapters.length} Chapters)
        </button>
        <button
          onClick={() => setActiveTab('chemistry')}
          className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'chemistry'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-emerald-600" /> Chemistry ({filteredElements.length} Elements)
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'units'
              ? 'border-amber-600 text-amber-700 bg-amber-50/40 rounded-t-lg font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Gauge className="w-4 h-4 text-amber-600" /> Units & Prefixes ({filteredUnits.length + filteredPrefixes.length})
        </button>
        <button
          onClick={() => setActiveTab('constants')}
          className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'constants'
              ? 'border-purple-600 text-purple-700 bg-purple-50/40 rounded-t-lg font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bookmark className="w-4 h-4 text-purple-600" /> Scientific Constants ({filteredConstants.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs min-h-[400px]">
        {loading && physicsChapters.length === 0 && units.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            Loading science libraries...
          </div>
        ) : (
          <>
            {activeTab === 'physics' && (
              <div className="space-y-6">
                <div className="text-xs font-semibold uppercase tracking-wider flex justify-between items-center text-slate-500">
                  <span>Physics Chapters Catalog</span>
                  <span>Showing {filteredChapters.length} chapters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredChapters.map((ch: PhysicsChapter) => (
                    <PhysicsChapterCard
                      key={ch.id}
                      ch={ch}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'chemistry' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 text-slate-500">
                    Periodic Table Elements ({filteredElements.length})
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {filteredElements.map((el: ChemistryElement) => (
                      <div
                        key={el.symbol}
                        className="p-2 border border-slate-200 rounded-lg text-center bg-slate-50 shadow-2xs"
                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 80px' }}
                      >
                        <span className="text-xs font-mono block text-slate-500 font-bold">{el.atomicNumber}</span>
                        <span className="text-lg font-bold font-serif text-emerald-700">{el.symbol}</span>
                        <span className="text-[11px] font-bold block truncate text-slate-800">{el.name}</span>
                        <span className="text-[9px] font-mono text-slate-500 font-bold">{el.atomicMass}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 text-slate-500">
                    Chemical Notations, Structures & Reaction Arrows ({filteredNotations.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredNotations.map((n: ChemistryNotation) => (
                      <div
                        key={n.id}
                        className="p-3 border border-slate-200 rounded-xl space-y-1 bg-slate-50 shadow-2xs"
                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 90px' }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-500">{n.type}</span>
                          <span className="font-mono text-xs font-bold text-sky-700">{n.formula}</span>
                        </div>
                        <div className="py-1 text-center rounded border bg-white border-slate-200 text-slate-900">
                          <KaTeXRenderer math={n.latex} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{n.name}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'units' && (
              <div className="space-y-8">
                
                {/* Section 1: SI Base & Derived Units */}
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-amber-600" /> SI Base & Derived Units ({filteredUnits.length})
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">Standard dimensions & equivalents</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredUnits.map((u: Unit) => (
                      <div
                        key={u.id}
                        className="p-3.5 border border-slate-200 rounded-xl flex flex-col justify-between bg-slate-50 hover:bg-amber-50/40 hover:border-amber-300 transition-all shadow-2xs"
                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 90px' }}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-lg font-black font-mono text-amber-800">{u.symbol}</span>
                            <span className="text-[10px] border border-slate-200 px-2 py-0.5 rounded-full bg-white text-slate-700 font-bold">
                              {u.category}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">{u.name}</h4>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-mono space-y-0.5">
                          {u.dimension && <p className="text-[10px] text-slate-400">Dim: {u.dimension}</p>}
                          {u.siEquivalent && <p className="font-semibold text-slate-700 truncate">SI: {u.siEquivalent}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Metric & Decimal Prefixes */}
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" /> Metric & SI Multiplier Prefixes ({filteredPrefixes.length})
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">Multipliers from 10⁻¹² to 10⁹</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    {filteredPrefixes.map((pref: MetricPrefix) => (
                      <div
                        key={pref.id}
                        className="p-3 border border-slate-200 rounded-xl text-center bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all shadow-2xs flex flex-col justify-between"
                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 80px' }}
                      >
                        <span className="text-xl font-black font-serif text-indigo-700">{pref.symbol}</span>
                        <span className="text-xs font-bold text-slate-900 mt-0.5">{pref.name}</span>
                        <div className="mt-1.5 pt-1 border-t border-slate-200 font-mono text-[11px] font-bold text-slate-600">
                          {pref.factor}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'constants' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredConstants.map((c: ScientificConstant) => (
                    <div
                      key={c.id}
                      className="p-4 border border-slate-200 rounded-xl space-y-2 bg-slate-50 shadow-2xs"
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 120px' }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold font-serif text-purple-700">{c.symbol}</span>
                        <span className="text-[10px] px-2 py-0.5 border border-slate-200 rounded bg-white text-slate-700 font-semibold">
                          {c.category}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                      <div className="p-2 rounded border border-slate-200 font-mono text-xs font-bold flex justify-between bg-white text-slate-800">
                        <span>{c.value}</span>
                        <span className="text-slate-500">{c.unit}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600">{c.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};
