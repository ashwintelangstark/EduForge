import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Check, Sparkles } from 'lucide-react';
import { FONTS_CATALOG, FontDefinition, ensureFontLoaded } from './fonts.js';

interface FontDropdownProps {
  currentFont: string;
  onSelectFont: (fontFamily: string, fontName: string) => void;
}

export const FontDropdown: React.FC<FontDropdownProps> = ({
  currentFont,
  onSelectFont
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const categories = ['All', 'Standard', 'Sans-Serif', 'Serif', 'STEM & Math', 'Monospace', 'Handwriting & Display'];

  const filteredFonts = FONTS_CATALOG.filter(font => {
    const matchesSearch = font.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          font.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || font.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Current display name
  const currentFontObj = FONTS_CATALOG.find(f => 
    f.name === currentFont || f.family === currentFont || currentFont.includes(f.name.split(' ')[0])
  );
  const displayName = currentFontObj ? currentFontObj.name : currentFont || 'Calibri (Body)';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Dropdown trigger button styled like MS Word */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-1.5 h-7 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded text-xs text-slate-800 font-medium w-40 transition-colors shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-sky-500"
        title="Font Family (80+ styles)"
      >
        <span className="truncate text-left" style={{ fontFamily: currentFontObj?.family || currentFont }}>
          {displayName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-80 max-h-96 bg-white border border-slate-300 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          
          {/* Header & Search */}
          <div className="p-2 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search 80+ fonts..."
                className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 mt-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[10px]">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-200/70 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Fonts List with live preview */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-72">
            {filteredFonts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No fonts found matching "{searchQuery}"
              </div>
            ) : (
              filteredFonts.map(font => {
                const isSelected = displayName === font.name;
                return (
                  <button
                    key={font.name}
                    type="button"
                    onMouseEnter={() => ensureFontLoaded(font)}
                    onClick={() => {
                      ensureFontLoaded(font);
                      onSelectFont(font.family, font.name);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-sky-50 transition-colors group ${
                      isSelected ? 'bg-sky-50/80 font-bold text-sky-900' : 'text-slate-800'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-sm truncate"
                          style={{ fontFamily: font.family }}
                        >
                          {font.name}
                        </span>
                        {font.category === 'STEM & Math' && (
                          <span className="text-[9px] px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-sans font-bold">
                            MATH
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 group-hover:text-slate-500 font-sans">
                        {font.category} • The quick brown fox jumps
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-sky-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between font-sans">
            <span>{FONTS_CATALOG.length} fonts available</span>
            <span className="text-sky-600 font-medium flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> High Precision Typography
            </span>
          </div>

        </div>
      )}
    </div>
  );
};
