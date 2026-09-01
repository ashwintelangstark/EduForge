import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Question } from '@eduforge/shared';
import { MathTextRenderer } from '../equation/MathTextRenderer.js';

interface StudentPreviewDrawerProps {
  isOpen: boolean;
  question?: Question | null;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalQuestions?: number;
}

export const StudentPreviewDrawer: React.FC<StudentPreviewDrawerProps> = ({
  isOpen,
  question,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  currentIndex,
  totalQuestions
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        e.preventDefault();
        onNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasPrevious, hasNext, onPrevious, onNext, onClose]);

  if (!isOpen) return null;

  const defaultQuestionText = question?.rawText || 'Identify the structure shown below.';
  const defaultCode = question?.id ? `BIO-CELL-${question.id.slice(-4)}` : 'BIO-CELL-0016';
  const defaultOptions = question?.options || [];

  const contentArr = Array.isArray(question?.content) ? (question?.content as any[]) : [];
  const diagSvg = question?.diagramSvg || (question as any)?.diagram_svg || contentArr.find((b: any) => b.type === 'diagram' || b.diagramSvg || b.svg)?.diagramSvg || contentArr.find((b: any) => b.type === 'diagram' || b.diagramSvg || b.svg)?.svg;
  const imageSrc = question?.imageUrl || (question as any)?.diagramUrl || question?.imageUrls?.[0] || contentArr.find((b: any) => b.type === 'image' || b.imageUrl || b.url)?.url;

  const showNavigation = onPrevious || onNext || currentIndex !== undefined;

  return (
    <>
      {/* Background Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 animate-in fade-in duration-150"
      />

      {/* Right Slide-over Panel */}
      <aside className="fixed right-0 top-0 w-full sm:w-[540px] h-full bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 font-sans">
        {/* Drawer Header */}
        <div className="h-16 px-5 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900 shrink-0">Student Preview</h3>
          </div>

          {/* Top Navigation Controls */}
          {showNavigation && (
            <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-2xs disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                title="Previous Question (Left Arrow)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {currentIndex !== undefined && totalQuestions !== undefined && (
                <span className="text-[11px] font-extrabold font-mono text-slate-600 px-2.5 border-x border-slate-200/90 select-none">
                  {currentIndex + 1} / {totalQuestions}
                </span>
              )}

              <button
                type="button"
                onClick={onNext}
                disabled={!hasNext}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-2xs disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                title="Next Question (Right Arrow)"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Close Preview (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question Content View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md font-mono tracking-wider">
              {(question as any)?.questionCode || (question as any)?.question_code || defaultCode}
            </span>
            {question?.subject && (
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                {question.subject}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900">Question Statement</h3>

          <div className="text-base leading-relaxed text-slate-900 font-medium">
            <MathTextRenderer text={defaultQuestionText} />
          </div>

          {diagSvg && (
            <div className="my-3 p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
              <div className="max-h-52 w-full flex items-center justify-center scale-95" dangerouslySetInnerHTML={{ __html: diagSvg }} />
            </div>
          )}

          {!diagSvg && imageSrc && (
            <div className="my-3 p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
              <img src={imageSrc} alt="Question preview illustration" className="max-h-48 object-contain rounded" />
            </div>
          )}

          <div className="space-y-2 pt-2">
            {defaultOptions.length > 0 ? (
              defaultOptions.map((opt, idx) => (
                <div
                  key={opt.key || idx}
                  className="p-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors flex items-center gap-2.5 text-sm font-medium"
                >
                  <span className="text-slate-400 font-bold">○</span>
                  <span className="font-bold text-slate-900">{opt.key?.toUpperCase() || String.fromCharCode(65 + idx)}.</span>
                  <MathTextRenderer text={(opt as any).rawText || (typeof (opt as any).content === 'string' ? (opt as any).content : '')} />
                </div>
              ))
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs italic text-center font-medium">
                No options added to this question yet.
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
