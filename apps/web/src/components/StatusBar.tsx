import React from 'react';
import { ZoomIn, ZoomOut, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface StatusBarProps {
  pageCount: number;
  questionCount: number;
  wordCount: number;
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  columns: 1 | 2;
  zoom: number;
  setZoom: (zoom: number) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  pageCount,
  questionCount,
  wordCount,
  autosaveStatus,
  lastSavedAt,
  columns,
  zoom,
  setZoom
}) => {
  return (
    <footer className="h-7 text-xs px-4 flex items-center justify-between border-t border-slate-300 bg-slate-100 text-slate-700 select-none no-print fixed bottom-0 left-0 right-0 z-40 shadow-xs">
      
      {/* Left Metadata */}
      <div className="flex items-center gap-4 text-[11px]">
        <span>
          <strong className="text-slate-900">{pageCount}</strong> Page{pageCount !== 1 ? 's' : ''} (A4)
        </span>
        <span className="text-slate-400">|</span>
        <span>
          <strong className="text-slate-900">{questionCount}</strong> Question{questionCount !== 1 ? 's' : ''}
        </span>
        <span className="text-slate-400">|</span>
        <span>
          <strong className="text-slate-900">{wordCount}</strong> Words
        </span>
        <span className="text-slate-400">|</span>
        <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 border border-sky-300 rounded font-semibold text-[10px]">
          Single Column (A4)
        </span>
      </div>

      {/* Center Autosave Status */}
      <div className="flex items-center gap-1.5 text-[11px]">
        {autosaveStatus === 'saving' ? (
          <span className="flex items-center gap-1 text-amber-600 font-medium">
            <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
          </span>
        ) : autosaveStatus === 'error' ? (
          <span className="flex items-center gap-1 text-red-600 font-medium">
            <AlertCircle className="w-3 h-3" /> Save Error
          </span>
        ) : (
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <Check className="w-3 h-3 text-emerald-600" />
            {lastSavedAt ? `Saved at ${lastSavedAt.toLocaleTimeString()}` : 'Saved'}
          </span>
        )}
      </div>

      {/* Right Zoom Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setZoom(Math.max(50, zoom - 10))}
          className="p-0.5 text-slate-600 hover:text-sky-600 rounded"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <input
          type="range"
          min={50}
          max={200}
          step={5}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          className="w-20 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-sky-600"
        />

        <button
          type="button"
          onClick={() => setZoom(Math.min(200, zoom + 10))}
          className="p-0.5 text-slate-600 hover:text-sky-600 rounded"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <span className="font-mono text-[10px] w-8 text-right font-bold text-slate-800">
          {zoom}%
        </span>
      </div>

    </footer>
  );
};
