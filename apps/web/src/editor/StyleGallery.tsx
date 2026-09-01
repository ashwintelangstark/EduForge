import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, MoreHorizontal, Check } from 'lucide-react';
import { DOCUMENT_STYLES, DocumentStylePreset } from './styles.js';

interface StyleGalleryProps {
  currentStyleName?: string;
  onApplyStyle: (preset: DocumentStylePreset) => void;
}

export const StyleGallery: React.FC<StyleGalleryProps> = ({
  currentStyleName = 'Normal',
  onApplyStyle
}) => {
  const [scrollIndex, setScrollIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visibleCount = 3;
  const maxScroll = Math.max(0, DOCUMENT_STYLES.length - visibleCount);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isExpanded]);

  const visibleStyles = DOCUMENT_STYLES.slice(scrollIndex, scrollIndex + visibleCount);

  return (
    <div className="relative flex items-center gap-1 bg-slate-50/80 p-1 rounded-md border border-slate-200" ref={dropdownRef}>
      {/* Visible Style Cards */}
      <div className="flex items-center gap-1.5">
        {visibleStyles.map(preset => {
          const isSelected = currentStyleName === preset.name;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyStyle(preset)}
              title={preset.description}
              className={`h-11 px-3 min-w-[76px] flex flex-col items-center justify-center rounded border transition-all select-none ${
                isSelected
                  ? 'bg-white border-sky-500 ring-2 ring-sky-400/40 shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-slate-300/80 hover:border-slate-400 shadow-2xs'
              }`}
            >
              <span
                className="truncate max-w-[90px] leading-tight"
                style={preset.previewStyle}
              >
                {preset.previewLabel}
              </span>
              <span className="text-[8.5px] text-slate-400 font-sans truncate max-w-[90px] mt-0.5">
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Navigation & Expander Buttons Stack */}
      <div className="flex flex-col gap-0.5 border-l border-slate-200 pl-1">
        <button
          type="button"
          disabled={scrollIndex === 0}
          onClick={() => setScrollIndex(Math.max(0, scrollIndex - 1))}
          className="p-0.5 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-600 transition-colors"
          title="Previous Styles"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          disabled={scrollIndex >= maxScroll}
          onClick={() => setScrollIndex(Math.min(maxScroll, scrollIndex + 1))}
          className="p-0.5 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-600 transition-colors"
          title="Next Styles"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-0.5 hover:bg-slate-200 rounded text-slate-600 transition-colors ${
            isExpanded ? 'bg-slate-200 text-sky-700' : ''
          }`}
          title="Expand Styles Gallery"
        >
          <MoreHorizontal className="w-3 h-3" />
        </button>
      </div>

      {/* Expanded Styles Grid Modal */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-1 w-96 bg-white border border-slate-300 rounded-lg shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100">
          <div className="text-xs font-bold text-slate-800 mb-2 pb-1 border-b border-slate-200 flex items-center justify-between">
            <span>Styles Gallery</span>
            <span className="text-[10px] font-normal text-slate-400">Click to apply to selected block</span>
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            {DOCUMENT_STYLES.map(preset => {
              const isSelected = currentStyleName === preset.name;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onApplyStyle(preset);
                    setIsExpanded(false);
                  }}
                  className={`p-2 rounded border flex flex-col items-center justify-center text-center transition-all ${
                    isSelected
                      ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-300/50'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span
                    className="truncate max-w-full mb-1"
                    style={preset.previewStyle}
                  >
                    {preset.previewLabel}
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans truncate">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
