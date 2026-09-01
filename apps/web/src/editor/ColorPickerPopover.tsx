import React, { useState, useRef, useEffect } from 'react';
import { Check, Pipette } from 'lucide-react';

interface ColorPickerPopoverProps {
  currentColor?: string;
  onSelectColor: (color: string) => void;
  type?: 'text' | 'highlight' | 'shading';
  children: React.ReactNode;
}

// MS Word standard theme color palette matrix
const THEME_PALETTE = [
  ['#ffffff', '#000000', '#eeece1', '#1f497d', '#4f81bd', '#c0504d', '#9bbb59', '#8064a2', '#4bacc6', '#f79646'],
  ['#f2f2f2', '#7f7f7f', '#ddd9c3', '#c6d9f1', '#dbe5f1', '#f2dcdb', '#ebf1dd', '#e5e0ec', '#dbeef3', '#fdeada'],
  ['#d8d8d8', '#595959', '#c4bd97', '#8db3e2', '#b8cce4', '#e5b9b7', '#d7e3bc', '#ccc1da', '#b7dde8', '#fbd5b5'],
  ['#bfbfbf', '#3f3f3f', '#938953', '#548dd4', '#95b3d7', '#d99694', '#c3d69b', '#b2a2c7', '#92cddc', '#fac08f'],
  ['#a5a5a5', '#262626', '#494429', '#17365d', '#366092', '#953734', '#76933c', '#5f497a', '#31859b', '#e36c09'],
  ['#7f7f7f', '#0c0c0c', '#1d1b10', '#0f243e', '#244062', '#632423', '#4f6128', '#3f3151', '#205867', '#974806']
];

const STANDARD_COLORS = [
  '#c00000', '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0'
];

const HIGHLIGHT_PALETTE = [
  { name: 'Yellow', color: '#fef08a' },
  { name: 'Bright Green', color: '#86efac' },
  { name: 'Cyan', color: '#67e8f9' },
  { name: 'Magenta', color: '#f472b6' },
  { name: 'Blue', color: '#93c5fd' },
  { name: 'Red', color: '#fca5a5' },
  { name: 'Dark Blue', color: '#3b82f6' },
  { name: 'Teal', color: '#2dd4bf' },
  { name: 'Lime Green', color: '#a3e635' },
  { name: 'Purple', color: '#c084fc' },
  { name: 'Orange', color: '#fdba74' },
  { name: 'Gray 50%', color: '#94a3b8' },
  { name: 'Gray 25%', color: '#e2e8f0' },
  { name: 'Black', color: '#0f172a' },
  { name: 'Dark Red', color: '#b91c1c' }
];

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  currentColor,
  onSelectColor,
  type = 'text',
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customHex, setCustomHex] = useState(currentColor || '#000000');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handlePick = (color: string) => {
    onSelectColor(color);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {children}
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-300 rounded-lg shadow-xl z-50 p-2.5 text-xs select-none animate-in fade-in zoom-in-95 duration-100">
          
          {/* Automatic / No Color Button */}
          <button
            type="button"
            onClick={() => handlePick(type === 'highlight' ? 'transparent' : '#000000')}
            className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 rounded text-slate-800 font-medium mb-2 border border-slate-200"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-xs border border-slate-300"
                style={{ backgroundColor: type === 'highlight' ? 'transparent' : '#000000' }}
              />
              <span>{type === 'highlight' ? 'No Color' : 'Automatic (Black)'}</span>
            </div>
            {(!currentColor || currentColor === 'transparent' || currentColor === '#000000') && (
              <Check className="w-3.5 h-3.5 text-sky-600" />
            )}
          </button>

          {/* Highlight Palette Mode */}
          {type === 'highlight' ? (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Highlighter Colors
              </div>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {HIGHLIGHT_PALETTE.map(item => (
                  <button
                    key={item.name}
                    type="button"
                    title={item.name}
                    onClick={() => handlePick(item.color)}
                    className="w-8 h-8 rounded border border-slate-300 hover:scale-110 transition-transform relative flex items-center justify-center shadow-2xs"
                    style={{ backgroundColor: item.color }}
                  >
                    {currentColor === item.color && (
                      <Check className="w-3.5 h-3.5 text-slate-900" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Theme Colors Grid */}
              <div className="mb-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Theme Colors
                </div>
                <div className="flex flex-col gap-0.5">
                  {THEME_PALETTE.map((row, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-0.5">
                      {row.map((color, cIdx) => (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => handlePick(color)}
                          className="w-5 h-4 hover:scale-125 transition-transform border border-slate-200 relative"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Standard Colors Grid */}
              <div className="mb-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Standard Colors
                </div>
                <div className="flex items-center gap-0.5">
                  {STANDARD_COLORS.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePick(color)}
                      className="w-5 h-5 hover:scale-125 transition-transform border border-slate-300"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Custom Hex Color Input */}
          <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
            <Pipette className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-600 font-medium">Custom:</span>
            <input
              type="color"
              value={customHex.startsWith('#') ? customHex : '#000000'}
              onChange={e => setCustomHex(e.target.value)}
              className="w-5 h-5 p-0 border-0 rounded cursor-pointer"
            />
            <input
              type="text"
              value={customHex}
              onChange={e => setCustomHex(e.target.value)}
              placeholder="#000000"
              className="w-20 px-1.5 py-0.5 text-xs font-mono border border-slate-300 rounded uppercase"
            />
            <button
              type="button"
              onClick={() => handlePick(customHex)}
              className="px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-bold"
            >
              Apply
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
