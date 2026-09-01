import React from 'react';
import { PaperMetadata } from '@eduforge/shared';
import { Edit3 } from 'lucide-react';

interface PaperHeaderProps {
  metadata: PaperMetadata;
  onEditMetadata?: () => void;
  onUpdateMetadata?: (metadata: PaperMetadata) => void;
}

export const PaperHeader: React.FC<PaperHeaderProps> = ({
  metadata,
  onEditMetadata,
  onUpdateMetadata
}) => {
  const handleUpdate = (field: keyof PaperMetadata, value: any) => {
    if (onUpdateMetadata) {
      onUpdateMetadata({
        ...metadata,
        [field]: value
      });
    }
  };

  return (
    <div
      className="relative group border-2 border-black bg-white p-3.5 mb-4 rounded-xs text-black transition-colors"
      title="Click any text in the header to edit directly in-place"
    >
      {onEditMetadata && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity no-print">
          <button
            type="button"
            onClick={onEditMetadata}
            className="p-1 bg-slate-900 text-white rounded text-xs flex items-center gap-1 px-2 font-bold shadow-xs hover:bg-sky-600 transition-colors"
          >
            <Edit3 className="w-3 h-3" /> Template Setup
          </button>
        </div>
      )}

      {/* Institute Name */}
      <h1
        contentEditable
        suppressContentEditableWarning
        onBlur={e => handleUpdate('instituteName', e.currentTarget.textContent || '')}
        className="text-base sm:text-lg font-black tracking-wide text-black uppercase text-center mb-0.5 outline-hidden hover:bg-sky-50/50 focus:bg-sky-50 focus:ring-1 focus:ring-sky-400 rounded px-1 cursor-text"
      >
        {metadata.instituteName || 'MODEL PUBLIC SENIOR SECONDARY SCHOOL'}
      </h1>

      {/* Exam Name */}
      <h2
        contentEditable
        suppressContentEditableWarning
        onBlur={e => handleUpdate('examName', e.currentTarget.textContent || '')}
        className="text-xs sm:text-sm font-bold text-black text-center mb-2 outline-hidden hover:bg-sky-50/50 focus:bg-sky-50 focus:ring-1 focus:ring-sky-400 rounded px-1 cursor-text"
      >
        {metadata.examName || 'ANNUAL BOARD EXAMINATION 2026'}
      </h2>

      {/* Metadata Bar */}
      <div className="flex items-center justify-between border-y border-black py-1.5 px-2 text-xs font-bold text-black mb-2">
        <span className="flex items-center gap-1">
          <strong>Subject:</strong>
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={e => handleUpdate('subject', e.currentTarget.textContent || '')}
            className="outline-hidden hover:bg-sky-50/50 rounded px-1 cursor-text"
          >
            {metadata.subject || 'General Science'}
          </span>
        </span>

        <span className="flex items-center gap-1">
          <strong>Time:</strong>
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={e => {
              const val = parseInt(e.currentTarget.textContent?.replace(/\D/g, '') || '180', 10);
              handleUpdate('timeAllowedMinutes', isNaN(val) ? 180 : val);
            }}
            className="outline-hidden hover:bg-sky-50/50 rounded px-1 cursor-text"
          >
            {metadata.timeAllowedMinutes || 180}
          </span>
          <span>Mins</span>
        </span>

        <span className="flex items-center gap-1">
          <strong>Max Marks:</strong>
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={e => {
              const val = parseInt(e.currentTarget.textContent?.replace(/\D/g, '') || '100', 10);
              handleUpdate('maxMarks', isNaN(val) ? 100 : val);
            }}
            className="outline-hidden hover:bg-sky-50/50 rounded px-1 cursor-text"
          >
            {metadata.maxMarks || 100}
          </span>
        </span>
      </div>

      {/* General Instructions */}
      <div className="text-[10px] sm:text-[11px] text-black font-medium leading-snug">
        <span className="font-bold underline block mb-0.5">General Instructions:</span>
        <ol className="list-decimal list-inside space-y-0.5 pl-1">
          {(metadata.generalInstructions && metadata.generalInstructions.length > 0
            ? metadata.generalInstructions
            : ['All questions are compulsory.', 'Calculators are strictly prohibited.']
          ).map((inst, i) => (
            <li
              key={i}
              contentEditable
              suppressContentEditableWarning
              onBlur={e => {
                const newInsts = [...(metadata.generalInstructions || [])];
                newInsts[i] = e.currentTarget.textContent || '';
                handleUpdate('generalInstructions', newInsts);
              }}
              className="outline-hidden hover:bg-sky-50/50 focus:bg-sky-50 rounded px-1 cursor-text"
            >
              {inst}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
