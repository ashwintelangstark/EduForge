import React, { useState } from 'react';
import { Search, Replace, X, ArrowUp, ArrowDown, Check } from 'lucide-react';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (query: string) => number; // returns match count
  onReplace: (query: string, replacement: string) => void;
  onReplaceAll: (query: string, replacement: string) => void;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  onFind,
  onReplace,
  onReplaceAll
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCount, setMatchCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSearch = () => {
    if (!findText) {
      setMatchCount(null);
      return;
    }
    const count = onFind(findText);
    setMatchCount(count);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="fixed top-28 right-8 z-50 bg-white text-black rounded-xl shadow-2xl border border-slate-200 p-4 w-80 animate-in fade-in slide-in-from-top-4 duration-150">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-wider">
          <Search className="w-4 h-4 text-sky-600" /> Find & Replace
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-500 hover:text-black rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-bold text-black mb-1">Find Text</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search text in document..."
              value={findText}
              onChange={e => setFindText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-xs font-semibold text-black bg-white p-2 border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-sky-500 pr-16 placeholder:text-slate-400"
            />
            {matchCount !== null && (
              <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-600">
                {matchCount} match{matchCount !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-black mb-1">Replace With</label>
          <input
            type="text"
            placeholder="Replacement text..."
            value={replaceText}
            onChange={e => setReplaceText(e.target.value)}
            className="w-full text-xs font-semibold text-black bg-white p-2 border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleSearch}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold rounded transition-colors border border-slate-200"
          >
            Find
          </button>
          <button
            type="button"
            onClick={() => onReplace(findText, replaceText)}
            disabled={!findText}
            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-bold rounded transition-colors disabled:opacity-40"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => onReplaceAll(findText, replaceText)}
            disabled={!findText}
            className="col-span-2 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-40 shadow-xs"
          >
            Replace All Matches
          </button>
        </div>
      </div>
    </div>
  );
};
